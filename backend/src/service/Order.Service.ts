import * as AsaasService from '../integrations/asass/Service';
import * as OrderRepository from '../repository/Order.Repository';
import * as OrderDomain from '../domain/Order.Domain';
import * as EmailService from '../integrations/resend/Services';
import * as MelhorEnvio from '../integrations/melhorEnvio/Service';
import * as AdminOrderService from '../service/OrderLifecycle.Service';
import type { CreateOrderInput } from '../types/order';



export async function createOrder(input: CreateOrderInput) {
    if (input.items.length === 0) {
        throw new Error('EMPTY_CART');
    }

    // Clamp obrigatório: a loja só vende em até 3x sem juros. Nunca confiar no
    // número de parcelas que vem do front — um front desatualizado (ou forjado)
    // poderia mandar 10x e o Asaas cobraria em 10x. Aqui o servidor garante o teto.
    input.installments = Math.min(3, Math.max(1, Math.trunc(Number(input.installments)) || 1));

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

    let coupon = null;
    let couponDiscountCents = 0;

    if (input.couponCode) {
        coupon = await OrderRepository.findCouponByCode(input.couponCode);

        if (!coupon) throw new Error('COUPON_NOT_FOUND');

        const alreadyUsed = await OrderRepository.findOrderByCustomerAndCoupon(input.customerId, coupon.id);
        if (alreadyUsed) throw new Error('COUPON_ALREADY_USED');

        couponDiscountCents = OrderDomain.calculateCouponDiscountCents(coupon, subtotalCents);

        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
            throw new Error('COUPON_MAX_USES_REACHED');
        }
    }

    const pixDiscountCents = OrderDomain.calculatePixDiscountCents(subtotalCents, input.paymentMethod);
    const discountCents = pixDiscountCents + couponDiscountCents;

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

    const shippingOptions = await MelhorEnvio.quoteShipping(toCep, quotable);
    const chosenShipping = shippingOptions.find((option) => option.id === input.shippingServiceId);
    if (!chosenShipping) throw new Error('SHIPPING_OPTION_UNAVAILABLE');

    const shippingCostCents = OrderDomain.toCents(chosenShipping.price);

    const totalCents = OrderDomain.calculateTotalCents(subtotalCents, discountCents, shippingCostCents);

    const customer = await OrderRepository.findCustomerForCharge(input.customerId);
    if (!customer) throw new Error('CUSTOMER_NOT_FOUND');
    if (!customer.cpf) throw new Error('CPF_REQUIRED');

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
            shippingServiceId: chosenShipping.id,
            shippingMethod: chosenShipping.name,
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
            await AdminOrderService.updateOrderStatus(order.id, { paymentStatus: 'paid', status: 'confirmed' });
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

export async function previewCoupon(customerId: string, couponCode: string, subtotal: number) {

    const coupon = await OrderRepository.findCouponByCode(couponCode);
    if (!coupon) throw new Error('COUPON_NOT_FOUND');

    const alreadyUsed = await OrderRepository.findOrderByCustomerAndCoupon(customerId, coupon.id);
    if (alreadyUsed) throw new Error('COUPON_ALREADY_USED');

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
