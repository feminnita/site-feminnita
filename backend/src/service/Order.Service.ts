import * as AsaasService from '../integrations/asass/Service';
import * as OrderRepository from '../repository/Order.Repository';
import * as OrderDomain from '../domain/Order.Domain';
import * as EmailService from '../integrations/resend/Services';
import * as MelhorEnvio from '../integrations/melhorEnvio/Service';
import * as AdminOrderService from '../service/OrderLifecycle.Service';
import * as ResaleTermService from '../service/ResaleTerm.Service';
import * as AffiliateRepository from '../repository/Affiliate.Repository';
import * as SiteSettingsRepository from '../repository/SiteSettings.Repository';
import * as AddressesRepository from '../repository/Addresses.Repository';
import * as AuthRepository from '../repository/Auth.Repository';
import type { CreateOrderInput } from '../types/order';

/**
 * Teto de parcelas no cartão — o mesmo MAX_PARCELAS de client/src/lib/parcelamento.ts.
 * No Asaas 2x a 6x custam a mesma taxa (3,49%, cobrada uma vez); de 7x em diante
 * sobe. Se mudar lá, muda aqui: a tela promete o número e é este que vai ao Asaas.
 */
export const MAX_PARCELAS = 6;


export async function createOrder(input: CreateOrderInput) {
    if (input.items.length === 0) {
        throw new Error('EMPTY_CART');
    }

    // Clamp obrigatório: a loja só vende em até MAX_PARCELAS sem juros. Nunca confiar
    // no número de parcelas que vem do front — um front desatualizado (ou forjado)
    // poderia mandar 10x e o Asaas cobraria em 10x. Aqui o servidor garante o teto.
    input.installments = Math.min(MAX_PARCELAS, Math.max(1, Math.trunc(Number(input.installments)) || 1));

    const productIds = input.items.map((item) => item.productId);
    const dbProducts = await OrderRepository.findProductsByIds(productIds);
    const productById = new Map(dbProducts.map((p) => [p.id, p]));

    const resolvedItems = [];
    for (const item of input.items) {
        const product = productById.get(item.productId);
        if (!product || !product.active) {
            throw new Error(`PRODUCT_UNAVAILABLE: ${item.productId}`);
        }

        const skuId = await OrderRepository.resolveSkuId(item.productId, item.size, item.color);
        if (!skuId) {
            throw new Error(`SKU_NOT_FOUND: ${item.productId}:${item.size}:${item.color ?? ''}`);
        }

        const sku = await OrderRepository.findSkuById(skuId);
        if (!sku || sku.stockQty - sku.reservedQty < item.quantity) {
            throw new Error(`OUT_OF_STOCK: ${item.productId}: ${item.size}:${item.color ?? ''}`);
        }

        const unitPriceCents = OrderDomain.resolveUnitPriceCents(product);
        resolvedItems.push({
            productId: item.productId,
            skuId,
            productName: product.name,
            productImage: Array.isArray(product.images) ? product.images[0] ?? null : null,
            color: item.color ?? null,
            size: item.size,
            quantity: item.quantity,
            unitPriceCents,
            totalPriceCents: unitPriceCents * item.quantity,
        });
    }

    const subtotalCents = OrderDomain.calculateSubtotalCents(resolvedItems);

    // Pedido minimo do atacado, conferido AQUI.
    //
    // Ate agora o minimo existia so na tela: uma barra de progresso que
    // informava e nao impedia nada. Nem o checkout olhava para ela. Na pratica
    // qualquer pessoa fechava um pedido de R$ 30 no atacado — e a obrigacao de
    // enviar era da loja.
    //
    // Regra de negocio que so mora na tela nao e regra: e sugestao. Quem decide
    // e o servidor, porque e ele que ninguem consegue contornar.
    const minimoCents = OrderDomain.toCents(await pedidoMinimo());
    if (subtotalCents < minimoCents) {
        throw new Error(`MIN_ORDER_NOT_REACHED:${OrderDomain.fromCents(minimoCents)}`);
    }

    let coupon = null;
    let couponDiscountCents = 0;

    if (input.couponCode) {
        coupon = await OrderRepository.findCouponByCode(input.couponCode);

        if (!coupon) throw new Error('COUPON_NOT_FOUND');

        const alreadyUsed = await OrderRepository.findOrderByCustomerAndCoupon(input.customerId, coupon.id);
        if (alreadyUsed) throw new Error('COUPON_ALREADY_USED');

        // Cupom de primeira compra: vale so para quem nunca comprou, e nao
        // "uma vez por cupom". Sem isto, quem comprou com o de 3% pegaria o de
        // 6% na compra seguinte, e o desconto viraria tabela de preco.
        //
        // Aqui e a conferencia que MANDA: input.customerId ja foi resolvido
        // pelo e-mail, entao comprar sem conta nao escapa.
        if (coupon.firstPurchaseOnly) {
            const jaComprou = await OrderRepository.findOrdersByCustomerId(input.customerId);
            if (jaComprou.length > 0) throw new Error('COUPON_FIRST_PURCHASE_ONLY');
        }

        couponDiscountCents = OrderDomain.calculateCouponDiscountCents(coupon, subtotalCents);

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            throw new Error('COUPON_MAX_USES_REACHED');
        }
    }

    const pixDiscountCents = OrderDomain.calculatePixDiscountCents(subtotalCents, input.paymentMethod);
    const discountCents = pixDiscountCents + couponDiscountCents;

    // Retirada na fábrica: sem transportadora, sem CEP obrigatório, custo R$ 0,00 e
    // sem shipping_service_id (o painel não gera etiqueta para esses pedidos).
    let shippingCostCents = 0;
    let chosenShippingServiceId: number | null = null;
    let shippingMethodName = 'Retirada na fábrica';

    if (!input.pickup) {
        const toCep = String((input.shippingAddress as { cep?: string })?.cep ?? '');
        if (!toCep) throw new Error('SHIPPING_CEP_REQUIRED');

        const quotable = input.items.map((item) => {
            const product = productById.get(item.productId)!;
            return {
                weightKg: product.weightKg,
                pkgHeightCm: product.pkgHeightCm,
                pkgWidthCm: product.pkgWidthCm,
                pkgLengthCm: product.pkgLengthCm,
                quantity: item.quantity,
            };
        });

        // Mesmo valor segurado da cotacao do carrinho: se divergisse, o preco
        // mudaria entre a tela e o fechamento do pedido.
        const shippingOptions = await MelhorEnvio.quoteShipping(
            toCep,
            quotable,
            subtotalCents / 100,
        );
        const chosenShipping = shippingOptions.find((option) => option.id === input.shippingServiceId);
        if (!chosenShipping) throw new Error('SHIPPING_OPTION_UNAVAILABLE');

        shippingCostCents = OrderDomain.toCents(chosenShipping.price);
        chosenShippingServiceId = chosenShipping.id;
        // Guarda TRANSPORTADORA + servico, como a cliente escolheu na tela.
        // So o servico nao identifica nada: "Standard" e o nome que a JeT e a
        // Total Express usam, entao dois pedidos de transportadoras diferentes
        // chegavam identicos na folha de separacao, e a Chris tinha de ir ao
        // Melhor Envio descobrir qual era para despachar.
        shippingMethodName = chosenShipping.company
            ? `${chosenShipping.company} — ${chosenShipping.name}`
            : chosenShipping.name;
    }

    const totalCents = OrderDomain.calculateTotalCents(subtotalCents, discountCents, shippingCostCents);

    // Afiliada que trouxe a venda. O codigo chega do navegador, entao quem
    // decide e o banco: so credita se existir E estiver aprovada.
    //
    // A base e o que entrou PELOS PRODUTOS: subtotal menos desconto, sem frete.
    // Sem tirar o desconto, uma venda com cupom de 30% pagaria comissao sobre
    // dinheiro que nao entrou. Sem tirar o frete, pagaria sobre o que vai para
    // a transportadora.
    let afiliada: {
        affiliateId?: string;
        affiliateCode?: string;
        affiliateRate?: string;
        affiliateCommission?: string;
    } = {};

    if (input.afiliada) {
        const a = await AffiliateRepository.aprovadaPorCodigo(input.afiliada);
        if (a) {
            const baseCents = Math.max(subtotalCents - discountCents, 0);
            const percentual = Number(a.percentual);
            afiliada = {
                affiliateId: a.id,
                affiliateCode: a.codigo,
                // Congelados: mudar a comissao dela amanha nao pode mexer no
                // que ja foi vendido.
                affiliateRate: a.percentual,
                affiliateCommission: OrderDomain.fromCents(
                    Math.round((baseCents * percentual) / 100),
                ),
            };
        }
    }

    const customer = await OrderRepository.findCustomerForCharge(input.customerId);
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
    if (!customer.cpf) throw new Error('CPF_REQUIRED');

    // Gate de revenda só vale com termo ATIVO (content não-vazio). Desligado, o
    // pedido sai normal e carimba resale_term_version = null.
    const resaleTerm = await ResaleTermService.getCurrentResaleTerm();
    if (resaleTerm.active && customer.resaleTermVersion !== resaleTerm.version) {
        throw new Error(`RESALE_TERM_REACCEPT_REQUIRED:${resaleTerm.version}`);
    }
    const orderResaleTermVersion = resaleTerm.active ? resaleTerm.version : null;

    const address = input.shippingAddress as Record<string, unknown>;
    const shippingAddress = {
        cep: String(address?.cep ?? ''),
        street: String(address?.street ?? ''),
        number: String(address?.number ?? ''),
        complement: address?.complement ? String(address.complement) : undefined,
        neighborhood: String(address?.neighborhood ?? ''),
        city: String(address?.city ?? ''),
        state: String(address?.state ?? ''),
    };

    const order = await OrderRepository.insertOrderWithItems(
        {
            customerId: input.customerId,
            paymentMethod: input.paymentMethod,
            installments: input.installments,
            couponId: coupon?.id,
            subtotal: OrderDomain.fromCents(subtotalCents),
            discount: OrderDomain.fromCents(discountCents),
            shippingCost: OrderDomain.fromCents(shippingCostCents),
            total: OrderDomain.fromCents(totalCents),
            shippingAddress,
            shippingServiceId: chosenShippingServiceId,
            shippingMethod: shippingMethodName,
            resaleTermVersion: orderResaleTermVersion,
            // Origem da visita: chega do navegador, entao e limitada em tamanho
            // antes de gravar — campo de URL e coisa que qualquer um edita.
            ...limitarOrigem(input.origem),
            ...afiliada,
        },
        resolvedItems.map((item) => ({
            productId: item.productId,
            skuId: item.skuId,
            productName: item.productName,
            productImage: item.productImage,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unitPrice: OrderDomain.fromCents(item.unitPriceCents),
            totalPrice: OrderDomain.fromCents(item.totalPriceCents),
        })),
        coupon?.id,
    );

    // Endereco digitado entra na agenda da cliente. Falhar aqui nao pode custar
    // a venda: o pedido ja existe e ja tem o endereco dentro dele — isto e
    // conveniencia para a proxima compra, nao parte do pedido.
    try {
        await AddressesRepository.saveFromCheckout(customer.id, shippingAddress);
    } catch (erroDoEndereco) {
        console.error('Nao consegui guardar o endereco na agenda:', erroDoEndereco);
    }

    try {
        const { payment, pixQrCode, asaasCustomerId } = await AsaasService.createChargeWithCustomer(
            {
                ...order,
                paymentMethod: input.paymentMethod,
                installments: input.installments,
                creditCard: input.creditCard,
                holderInfo: {
                    name: customer.name,
                    email: customer.email,
                    cpfCnpj: customer.cpf,
                    postalCode: shippingAddress.cep,
                    addressNumber: shippingAddress.number,
                    phone: customer.phone ?? undefined,
                },
                remoteIp: input.remoteIp,
            },
            { ...customer, cpf: customer.cpf },
        );

        // Persiste o id efetivo do cliente Asaas (novo, ou recriado no retry de invalid_customer).
        if (customer.asaasCustomerId !== asaasCustomerId) {
            await OrderRepository.saveCustomerAsaasId(customer.id, asaasCustomerId);
        }
        await OrderRepository.saveOrderAsaasPaymentId(order.id, payment.id);

        if (input.paymentMethod === 'card' && payment.status === 'CONFIRMED') {
            await AdminOrderService.updateOrderStatus(order.id, { paymentStatus: 'paid', status: 'paid' });
        } else {
            await EmailService.sendOrderReceived({
                customerName: customer.name,
                customerEmail: customer.email,
                orderNumber: order.orderNumber,
                total: order.total,
            });
        }

        return {
            order,
            payment: {
                asaasPaymentId: payment.id,
                invoiceUrl: payment.invoiceUrl,
                bankSlipUrl: payment.bankSlipUrl ?? null,
                pixQrCode: pixQrCode?.encodedImage ?? null,
                pixCopyPaste: pixQrCode?.payload ?? null,
            },
        };
    } catch (error) {
        console.error(`Falha ao criar cobrança do pedido ${order.orderNumber}: `, error);
        await OrderRepository.cancelOrdeAndReleaseStock(order.id);
        throw new Error('PAYMENT_CREATION_FAILED');
    }
}

/**
 * customerId vazio = compra sem conta, antes de a cliente se identificar.
 *
 * Nesse caso nao da para checar "ja usou este cupom": ainda nao se sabe quem
 * e. E tudo bem — isto aqui e uma PREVIA, um calculo na tela. A verificacao
 * que vale acontece na criacao do pedido, quando o e-mail ja resolveu a
 * cliente e o mesmo teste roda com identidade.
 *
 * O contrario — exigir login para calcular um desconto — bloquearia o cupom
 * inteiro para quem compra sem conta.
 */
/**
 * Quanto a loja exige por pedido.
 *
 * Le de site_settings.min_order quando existir, para a Chris poder mudar sem
 * deploy; cai em 199 se nao existir — o mesmo numero que a vitrine anuncia.
 */
async function pedidoMinimo(): Promise<number> {
    const row = await SiteSettingsRepository.findByKey('min_order');
    const valor = Number((row?.value as { valor?: unknown })?.valor);
    return Number.isFinite(valor) && valor > 0 ? valor : 199;
}

export async function previewCoupon(
    customerId: string | null,
    couponCode: string,
    subtotal: number,
    email?: string | null,
) {

    const coupon = await OrderRepository.findCouponByCode(couponCode);
    if (!coupon) throw new Error('COUPON_NOT_FOUND');

    // Quem compra sem conta nao tem customerId aqui, mas ja digitou o e-mail
    // no checkout. E por ele que se descobre se ela ja e cliente — e e assim
    // que o cupom de primeira compra deixa de ser burlavel comprando como
    // visitante.
    if (!customerId && email) {
        const cliente = await AuthRepository.findCustomerByEmail(String(email).trim().toLowerCase());
        if (cliente) customerId = cliente.id;
    }

    if (customerId) {
        const alreadyUsed = await OrderRepository.findOrderByCustomerAndCoupon(customerId, coupon.id);
        if (alreadyUsed) throw new Error('COUPON_ALREADY_USED');

        if (coupon.firstPurchaseOnly) {
            const jaComprou = await OrderRepository.findOrdersByCustomerId(customerId);
            if (jaComprou.length > 0) throw new Error('COUPON_FIRST_PURCHASE_ONLY');
        }
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
        throw new Error('COUPON_MAX_USES_REACHED');
    }

    const subtotalCents = OrderDomain.toCents(subtotal);
    const discountCents = OrderDomain.calculateCouponDiscountCents(coupon, subtotalCents);

    return {
        code: coupon.code,
        discount: Number(OrderDomain.fromCents(discountCents)),
    };
}

/**
 * O cupom que entra sozinho no carrinho.
 *
 * Cupom que a cliente precisa digitar e cupom que metade nao usa: ela viu a
 * promessa no pop-up, fechou a aba e na hora de pagar nao lembra do codigo. A
 * Chris pediu que entrasse direto, e esta certa.
 *
 * QUAL cupom vem de site_settings.newsletter_popup.cupom — a mesma chave que o
 * pop-up anuncia. Assim a promessa e o desconto nunca se separam: trocar o
 * cupom do pop-up troca o que o carrinho aplica, sem deploy.
 *
 * So vale para quem NUNCA comprou. E cupom de primeira compra: sem essa trava
 * ele viraria 5% permanente para a loja inteira, e com o PIX somando, 10% fixo
 * de margem entregue sem ninguem ter decidido isso.
 *
 * A trava por cliente que ja existia continua valendo por cima (o mesmo cupom
 * nao sai duas vezes para a mesma pessoa), e a conferencia final acontece de
 * novo na criacao do pedido — esta rota so sugere.
 */
export async function automaticCoupon(
    customerId: string | null,
    subtotal: number,
    email?: string | null,
) {
    const config = await SiteSettingsRepository.findByKey('newsletter_popup');
    const code = String((config?.value as { cupom?: string })?.cupom ?? '').trim();
    if (!code) return null;

    // Quem compra sem conta chega aqui sem id, mas com o e-mail que digitou no
    // checkout. E por ele que se sabe se ela ja e cliente.
    if (!customerId && email) {
        const cliente = await AuthRepository.findCustomerByEmail(String(email).trim().toLowerCase());
        if (cliente) customerId = cliente.id;
    }

    if (customerId) {
        const jaComprou = await OrderRepository.findOrdersByCustomerId(customerId);
        if (jaComprou.length > 0) return null;
    }

    try {
        return await previewCoupon(customerId, code, subtotal, email);
    } catch {
        // Cupom apagado, vencido ou esgotado: o carrinho segue sem desconto.
        // Sugestao que falha nao pode derrubar a tela de quem esta comprando.
        return null;
    }
}

/**
 * Troca a forma de pagamento de um pedido que ainda nao foi pago.
 *
 * Antes existia so o link para a fatura do Asaas, e ele mentia por omissao: la
 * o valor ja esta fechado no total do boleto, entao quem fechava no boleto e
 * pagava por PIX pagava 5% a mais do que pagaria escolhendo PIX no checkout —
 * sem nenhum aviso. Desconto que a loja promete e que some quando a cliente
 * muda de ideia nao e desconto, e armadilha.
 *
 * Agora a troca e de verdade: recalcula o total com a regra da forma escolhida,
 * CANCELA a cobranca antiga e emite outra. O cancelamento vem antes de propos
 * porque duas cobrancas abertas do mesmo pedido e o caminho para a cliente
 * pagar duas vezes.
 *
 * O cupom sobrevive a troca: ele e do pedido, nao da forma de pagamento.
 *
 * Cartao aqui nao pede os dados do cartao — a cliente digita na pagina segura
 * do Asaas (invoiceUrl). Receber numero de cartao numa tela de pedido ja criado
 * seria guardar dado sensivel onde ele nao precisa passar.
 */
/**
 * Dados de pagamento de um pedido ainda nao pago, para a cliente retomar.
 *
 * Em "Meus Pedidos" nao havia link de pagamento nenhum: quem fechava no boleto
 * e fechava a aba so conseguia pagar pelo e-mail. E boleto e exatamente o que
 * se paga depois — a tela existia para o pedido que ja acabou, nao para o que
 * ainda precisa ser pago.
 */
export async function getPaymentInfo(orderId: string, customerId: string) {
    const order = await OrderRepository.findOrderByIndAndCustomerId(orderId, customerId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    if (order.paymentStatus === 'paid' || order.status === 'cancelled') return null;
    if (!order.asaasPaymentId) return null;

    const pagamento = await AsaasService.getPaymentForCustomer(
        order.asaasPaymentId,
        order.paymentMethod ?? 'pix',
    );
    if (!pagamento) return null;

    return {
        paymentMethod: order.paymentMethod,
        total: order.total,
        ...pagamento,
    };
}

export async function changePaymentMethod(
    orderId: string,
    customerId: string,
    paymentMethod: 'pix' | 'boleto' | 'card',
    // Parcelas so valem no cartao. Vem da tela porque a loja promete "ate 6x
    // sem juros": sem mandar o numero, a cobranca nascia sempre em 1x e a
    // promessa da vitrine nao aparecia na hora de pagar.
    installments = 1,
) {
    const order = await OrderRepository.findOrderByIndAndCustomerId(orderId, customerId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    if (order.paymentStatus === 'paid') throw new Error('ORDER_ALREADY_PAID');
    if (order.status === 'cancelled') throw new Error('ORDER_CANCELLED');

    const subtotalCents = OrderDomain.toCents(Number(order.subtotal));
    const shippingCents = OrderDomain.toCents(Number(order.shippingCost ?? 0));

    // Desconto recalculado do zero, nunca ajustado a partir do antigo: o valor
    // gravado soma cupom e PIX, e mexer nele por diferenca acumula erro de
    // arredondamento a cada troca.
    const coupon = order.couponId
        ? await OrderRepository.findCouponById(order.couponId)
        : null;
    const couponCents = coupon
        ? OrderDomain.calculateCouponDiscountCents(coupon, subtotalCents)
        : 0;
    const pixCents = OrderDomain.calculatePixDiscountCents(subtotalCents, paymentMethod);
    const discountCents = couponCents + pixCents;
    const totalCents = OrderDomain.calculateTotalCents(subtotalCents, discountCents, shippingCents);

    const customer = await OrderRepository.findCustomerForCharge(customerId);
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');

    if (order.asaasPaymentId) {
        await AsaasService.cancelCharge(order.asaasPaymentId);
    }

    const { payment, pixQrCode, asaasCustomerId } = await AsaasService.createChargeWithCustomer(
        {
            ...order,
            paymentMethod,
            installments: paymentMethod === 'card' ? installments : 1,
            total: OrderDomain.fromCents(totalCents),
        } as never,
        { ...customer, cpf: customer.cpf ?? '' } as never,
    );

    if (customer.asaasCustomerId !== asaasCustomerId) {
        await OrderRepository.saveCustomerAsaasId(customer.id, asaasCustomerId);
    }

    await OrderRepository.saveOrderPaymentChange(order.id, {
        paymentMethod,
        installments: paymentMethod === 'card' ? installments : 1,
        discount: OrderDomain.fromCents(discountCents),
        total: OrderDomain.fromCents(totalCents),
        asaasPaymentId: payment.id,
    });

    return {
        paymentMethod,
        discount: OrderDomain.fromCents(discountCents),
        total: OrderDomain.fromCents(totalCents),
        payment: {
            asaasPaymentId: payment.id,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl ?? null,
            pixQrCode: pixQrCode?.encodedImage ?? null,
            pixCopyPaste: pixQrCode?.payload ?? null,
        },
    };
}

export async function listMyOrders(customerId: string) {
    const myOrders = await OrderRepository.findOrdersByCustomerId(customerId);
    if (myOrders.length === 0) return [];

    const items = await OrderRepository.findItemsByOrderIds(myOrders.map((o) => o.id));

    return myOrders.map((order) => ({
        ...order,
        items: items.filter((item) => item.orderId === order.id),
    }));
}

export async function getMyOrder(orderId: string, customerId: string) {
    const order = await OrderRepository.findOrderByIndAndCustomerId(orderId, customerId);
    if (!order) throw new Error('ORDER_NOT_FOUND');

    const items = await OrderRepository.findItemsByOrderID(orderId);
    return { ...order, items };
}

// A origem vem da URL, ou seja, do lado de fora: corta em 200 caracteres e
// descarta o que nao for texto. Nao muda o resultado de um anuncio de verdade e
// evita gravar lixo colado na barra de endereco.
function limitarOrigem(o: unknown) {
    const origem = (o ?? {}) as Record<string, unknown>;
    const texto = (v: unknown) =>
        typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null;

    return {
        utmSource: texto(origem.utmSource),
        utmMedium: texto(origem.utmMedium),
        utmCampaign: texto(origem.utmCampaign),
        utmContent: texto(origem.utmContent),
        utmTerm: texto(origem.utmTerm),
        landingPage: texto(origem.landingPage),
        referrer: texto(origem.referrer),
    };
}
