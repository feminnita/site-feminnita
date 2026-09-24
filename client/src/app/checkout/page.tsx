"use client";

import Link from "next/link";
import { Header } from "../../components/layout/Header";
import { useAuth } from "../../hooks/count/useAuth";
import { useCart } from "../../hooks/cart/useCart";
import { useCep } from "../../hooks/count/useCep";
import { fetchProfile, updateProfile } from "../../services/accountService";
import { fetchAddresses } from "../../services/addressesService";
import {
    createOrder,
    mapCouponError,
    mapOrderError,
    previewCoupon,
    fetchAutomaticCoupon,
} from "../../services/checkoutService";
import { quoteShipping } from "../../services/shippingService";
import { registrarCarrinhoDeVisitante } from "../../services/cartLeadService";
import { NaoSaiaAgora } from "../../components/checkout/NaoSaiaAgora";
import { acceptResaleTerm, parseReacceptVersion } from "../../services/resaleTermService";
import { ApiError } from "../../services/api";
import {
    trackAddPaymentInfo,
    trackAddShippingInfo,
    trackBeginCheckout,
} from "../../utils/analytics";
import { isValidateCpf } from "../../utils/checkout";
import { PIX_DISCOUNT_RATE } from "../../utils/pricing";
import type { AccountCustomer } from "../../types/account/account";
import type { ShippingOption } from "../../types/checkout/checkout";
import {
    AlertCircle,
    Barcode,
    Check,
    ChevronDown,
    ChevronUp,
    CreditCard,
    Loader2,
    Lock,
    QrCode,
    ShieldCheck,
    Tag,
    Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MIN_ORDER, formatBRL } from "../../lib/minOrder";
import { MAX_PARCELAS, TEXTO_PARCELAMENTO } from "../../lib/parcelamento";

type AppliedCoupon = { code: string; discount: number };

function CouponBox({
    couponCode,
    setCouponCode,
    appliedCoupon,
    loading,
    onApply,
    onRemove,
}: {
    couponCode: string;
    setCouponCode: (v: string) => void;
    appliedCoupon: AppliedCoupon | null;
    loading: boolean;
    onApply: () => void;
    onRemove: () => void;
}) {
    if (appliedCoupon) {
        return (
            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <Tag size={13} /> {appliedCoupon.code} — R${" "}
                    {appliedCoupon.discount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                    })}{" "}
                    de desconto
                </span>
                <button
                    type="button"
                    onClick={onRemove}
                    className="text-xs font-medium text-gray-400 hover:text-red-500"
                >
                    Remover
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex gap-2">
                <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="CUPOM"
                    className="w-full rounded-lg border px-3 py-2 font-mono text-sm uppercase focus:ring-2 focus:ring-[#8C2F39]"
                />
                <button
                    type="button"
                    onClick={onApply}
                    disabled={loading || !couponCode.trim()}
                    className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        "Aplicar"
                    )}
                </button>
            </div>
            {couponCode.trim() && (
                <p className="mt-1 text-xs text-gray-400">
                    Clique em Aplicar para validar o cupom.
                </p>
            )}
        </div>
    );
}

/**
 * O cupom da última chance. Vale 6% — os 3% da primeira compra mais os 3% de
 * finalizar agora —, porque o pedido guarda UM cupom e não dois.
 *
 * É de primeira compra, e o servidor confere pelo e-mail: sem isso a
 * revendedora aprende o macete e passa a fingir que vai sair toda vez.
 */
const CUPOM_DE_SAIDA = "FICA6";

export default function CheckoutPage() {
    const router = useRouter();

    const { customer, loading: authLoading } = useAuth();
    const { selectedItems, ready, removeSelected } = useCart();
    const { lookup, loading: cepLoading } = useCep();

    const [profile, setProfile] = useState<AccountCustomer | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"pix" | "boleto" | "card">("pix");
    const [isProcessing, setIsProcessing] = useState(false);
    // Reaceite do Termo de Revenda no checkout: versão vigente exigida pelo backend
    // quando o termo mudou desde o último aceite do cliente.
    const [reacceptVersion, setReacceptVersion] = useState<number | null>(null);
    const [reacceptChecked, setReacceptChecked] = useState(false);
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
    // Retirada escolhida de proposito ainda passa por uma pergunta: ela nao e um
    // frete mais barato, e uma viagem ate Nova Friburgo. Guarda a opcao ate a
    // cliente confirmar — so entao vira a escolhida.
    const [confirmandoRetirada, setConfirmandoRetirada] = useState<ShippingOption | null>(null);
    const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [error, setError] = useState("");
    const [summaryOpen, setSummaryOpen] = useState(false);
    const beginTracked = useRef(false);
    const autoShippingDone = useRef(false);
    const submittingRef = useRef(false);

    const [form, setForm] = useState({
        name: "",
        // Compra sem conta: a cliente digita o proprio e-mail. Quem esta logada
        // nao ve este campo — o e-mail dela manda.
        email: "",
        cpf: "",
        phone: "",
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        installments: "1",
        card_number: "",
        card_expiry: "",
        card_cvv: "",
        card_name: "",
    });

    const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

    useEffect(() => {
        if (authLoading || !ready || isProcessing) return;

        // Obrigar cadastro antes de comprar derrubava a venda: no atacado quem
        // chega ao checkout ja decidiu, e ser barrada por um formulario de
        // conta e o momento classico de desistencia. Agora a cliente se
        // identifica aqui mesmo, e a conta vira convite DEPOIS do pagamento.

        if (selectedItems.length === 0) {
            router.push("/carrinho");
            return;
        }

        if (!beginTracked.current) {
            beginTracked.current = true;
            const subtotal = selectedItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
            );
            trackBeginCheckout(selectedItems, subtotal);
        }
    }, [authLoading, ready, customer, selectedItems, router, isProcessing]);


    useEffect(() => {
        if (authLoading || !customer) return;

        Promise.all([fetchProfile(), fetchAddresses()]).then(([prof, addresses]) => {
            if (prof) setProfile(prof);

            const addr = addresses.find((a) => a.isDefault) ?? addresses[0];

            setForm((f) => ({
                ...f,
                name: f.name || prof?.name || "",
                cpf: f.cpf || prof?.cpf || "",
                phone: f.phone || prof?.phone || "",
                cep: f.cep || addr?.cep?.replace(/\D/g, "") || "",
                street: f.street || addr?.street || "",
                number: f.number || addr?.number || "",
                complement: f.complement || addr?.complement || "",
                neighborhood: f.neighborhood || addr?.neighborhood || "",
                city: f.city || addr?.city || "",
                state: f.state || addr?.state || "",
            }));
        });
    }, [authLoading, customer]);

    const subtotal = selectedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
    );
    const shippingCost = selectedShipping?.price || 0;
    const discount = Number(
        (paymentMethod === "pix" ? subtotal * PIX_DISCOUNT_RATE : 0).toFixed(2),
    );
    const couponDiscount = appliedCoupon?.discount ?? 0;
    const total = Number(
        (subtotal + shippingCost - discount - couponDiscount).toFixed(2),
    );

    const calculateShipping = async (cep: string) => {
        setIsCalculatingShipping(true);
        setSelectedShipping(null);
        try {
            const options = await quoteShipping(cep, selectedItems);
            setShippingOptions(options);
            // A retirada vem em PRIMEIRO na lista (o servidor poe na frente de
            // proposito: e a unica gratis, e quem mora em Nova Friburgo precisa
            // ve-la). So que marcar a primeira sozinha fazia toda cliente do
            // Brasil chegar ao pagamento com "Retirar na fabrica" ja escolhida.
            // Foi o que aconteceu no FEM-1031: cliente de Sao Paulo, pedido pago,
            // retirada em Nova Friburgo que ela nunca vai fazer. O padrao passa a
            // ser a primeira transportadora; a retirada continua na frente, visivel,
            // mas exige um clique.
            const padrao = options.find((o) => !o.pickup) ?? options[0];
            if (padrao) {
                setSelectedShipping(padrao);
                trackAddShippingInfo(selectedItems, subtotal, padrao.name);
            }
        } catch {
            setShippingOptions([]);
        } finally {
            setIsCalculatingShipping(false);
        }
    };

    const handleCepBlur = async () => {
        const cep = form.cep.replace(/\D/g, "");
        if (cep.length !== 8) return;

        const addr = await lookup(cep);
        if (addr) {
            setForm((f) => ({
                ...f,
                street: addr.logradouro || f.street,
                neighborhood: addr.bairro || f.neighborhood,
                city: addr.cidade,
                state: addr.uf,
            }));
        }
        calculateShipping(cep);
    };

    useEffect(() => {
        const cep = form.cep.replace(/\D/g, "");
        if (
            !autoShippingDone.current &&
            cep.length === 8 &&
            selectedItems.length > 0
        ) {
            autoShippingDone.current = true;
            calculateShipping(cep);
        }
    }, [form.cep, selectedItems]);

    /**
     * Guarda o carrinho para poder lembrar quem desistir.
     *
     * Dispara quando a cliente SAI do campo de e-mail — ali ela terminou de
     * digitar, e ainda faltam endereço, frete e pagamento, que é onde as
     * pessoas somem.
     *
     * Só para quem não tem conta: de quem está logada o carrinho já é salvo.
     * Uma vez por visita, porque o campo perde o foco toda vez que ela volta
     * para conferir o e-mail, e não há motivo para repetir a gravação.
     */
    const carrinhoRegistrado = useRef(false);

    const guardarCarrinhoParaLembrete = () => {
        if (customer || carrinhoRegistrado.current) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return;
        if (selectedItems.length === 0) return;

        carrinhoRegistrado.current = true;
        void registrarCarrinhoDeVisitante({
            email: form.email,
            name: form.name,
            phone: form.phone,
            items: selectedItems,
        });
    };

    // Cupom de primeira compra entra sozinho. A cliente viu a promessa no
    // pop-up, fechou a aba e na hora de pagar nao lembra do codigo — exigir que
    // ela digite e perder a venda que o desconto foi feito para ganhar.
    //
    // So enquanto ela nao mexeu em cupom nenhum: quem digitou o proprio codigo
    // mandou mais que a sugestao da loja.
    const cupomAutomaticoTentado = useRef(false);

    useEffect(() => {
        if (cupomAutomaticoTentado.current) return;
        // So para quem tem conta: o cupom automatico e de PRIMEIRA COMPRA, e
        // "primeira" so existe com identidade. Sem sessao nao da para saber, e
        // o endereco que responde isso exige login — sem esta guarda, toda
        // convidada dispararia um 401 ao abrir o checkout.
        //
        // Ela nao fica sem cupom: pode digitar o codigo, e a previa aceita
        // convidada.
        if (subtotal <= 0 || appliedCoupon || couponCode.trim()) return;

        // Quem compra SEM conta tambem tem direito ao desconto de primeira
        // compra — e hoje e a maioria. O que identifica essa cliente e o
        // e-mail que ela acabou de digitar; sem ele nao da para saber se ja
        // comprou, entao o cupom so entra depois que o campo esta preenchido.
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
        if (!customer && !emailValido) return;

        cupomAutomaticoTentado.current = true;
        fetchAutomaticCoupon(subtotal, customer ? undefined : form.email).then((cupom) => {
            if (!cupom) return;
            setAppliedCoupon(cupom);
            setCouponCode(cupom.code);
            toast.success(`Cupom ${cupom.code} aplicado: desconto de primeira compra.`);
        });
    }, [customer, subtotal, appliedCoupon, couponCode, form.email]);

    /**
     * O cupom da última chance, para quem está saindo do checkout.
     *
     * Substitui o de 3% por um de 6% — o pedido guarda UM cupom, então "mais
     * 3%" vira um cupom de 6%. Para a cliente a conta é a mesma; o que muda é
     * que não existe empilhamento de cupom para dar errado depois.
     */
    const aceitarCupomDeSaida = async () => {
        try {
            const cupom = await previewCoupon(
                CUPOM_DE_SAIDA,
                subtotal,
                customer ? undefined : form.email,
            );
            setAppliedCoupon(cupom);
            setCouponCode(cupom.code);
            toast.success("Mais 3% aplicados. Agora são 6% de desconto!");
        } catch {
            // Cliente que ja comprou antes cai aqui, e esta certo: o cupom e
            // de primeira compra. Nao mostra erro — ela nem pediu nada.
        }
    };

    const handleApplyCoupon = async () => {
        const code = couponCode.trim().toUpperCase();
        if (!code) return;

        setCouponLoading(true);
        try {
            const result = await previewCoupon(code, subtotal);
            setAppliedCoupon(result);
            toast.success(`Cupom ${result.code} aplicado!`);
        } catch (err) {
            setAppliedCoupon(null);
            toast.error(
                err instanceof ApiError
                    ? mapCouponError(err.message)
                    : "Não foi possível validar o cupom. Tente novamente.",
            );
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode("");
    };

    const selectPayment = (method: "pix" | "boleto" | "card") => {
        setPaymentMethod(method);
        trackAddPaymentInfo(
            selectedItems,
            total,
            method === "pix" ? "PIX" : method === "card" ? "Cartão de Crédito" : "Boleto",
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Le tambem o que esta ESCRITO na tela, nao so o estado do React.
        //
        // O preenchimento automatico do Chrome as vezes escreve no campo sem
        // avisar a aplicacao: a cliente ve tudo preenchido e o pedido sai sem
        // o dado. Foi o que aconteceu — POST rejeitado em 4ms por falta de
        // nome/e-mail, com a tela mostrando os dois preenchidos.
        //
        // O estado tem prioridade (e o que ela digitou de fato); a tela so
        // preenche o que estiver vazio.
        const naTela = new FormData(e.currentTarget as HTMLFormElement);
        const f = { ...form };
        for (const chave of Object.keys(f) as (keyof typeof f)[]) {
            const valor = naTela.get(chave as string);
            if (!f[chave] && typeof valor === "string" && valor.trim()) {
                f[chave] = valor.trim();
            }
        }

        if (!customer) {
            if (!f.name.trim() || !f.email.trim()) {
                setError("Preencha seu nome e e-mail para continuar.");
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
                setError("Confira o e-mail digitado.");
                return;
            }
        }

        // O minimo tambem e conferido no servidor — e la que a regra vale de
        // verdade. Aqui e so para a cliente saber ANTES de preencher tudo.
        if (subtotal < MIN_ORDER) {
            setError(
                `O pedido mínimo é de ${formatBRL(MIN_ORDER)}. Faltam ${formatBRL(MIN_ORDER - subtotal)}.`,
            );
            return;
        }
        if (!selectedShipping) {
            setError("Selecione uma opção de frete.");
            return;
        }
        if (!isValidateCpf(f.cpf)) {
            setError("CPF inválido. Confira os números digitados.");
            return;
        }
        if (!f.phone.replace(/\D/g, "").match(/^\d{10,11}$/)) {
            setError("Informe um WhatsApp válido com DDD.");
            return;
        }
        if (paymentMethod === "card") {
            if (
                !f.card_number ||
                !f.card_name ||
                f.card_expiry.length < 5 ||
                !f.card_cvv
            ) {
                setError("Preencha todos os dados do cartão.");
                return;
            }
        }

        // Guard contra duplo-clique: ref é síncrono (antes do 1º await), então
        // um 2º submit disparado antes do re-render que desabilita o botão é barrado.
        if (submittingRef.current) return;
        submittingRef.current = true;

        // Se o termo foi atualizado, o backend exige reaceite aqui antes do pedido.
        if (reacceptVersion !== null && !reacceptChecked) {
            setError("É necessário aceitar o Termo de Revenda atualizado para continuar.");
            return;
        }

        setError("");
        setIsProcessing(true);

        try {
            if (reacceptVersion !== null && reacceptChecked) {
                await acceptResaleTerm();
                setReacceptVersion(null);
            }

            // Salvar o perfil so faz sentido para quem TEM perfil.
            //
            // Esta chamada vai para /api/store/account, que exige sessao. Na
            // compra sem conta ela voltava 401 e a execucao morria aqui — o
            // pedido nunca chegava a ser enviado. Na tela aparecia "Erro ao
            // processar o pedido", e na aba Network nao havia nenhuma chamada
            // a /orders, porque de fato nunca houve.
            //
            // A convidada nao perde nada: nome, telefone e CPF vao junto com o
            // pedido, e o servidor cria a cliente com eles.
            if (customer) {
                await updateProfile({
                    name: f.name,
                    phone: f.phone,
                    cpf: f.cpf,
                    birthDate: profile?.birthDate ?? null,
                });
            }

            const result = await createOrder({
                // So vai quando nao ha sessao. O servidor prefere a sessao
                // sempre que ela existe — ninguem compra em nome de outra.
                convidado: customer
                    ? undefined
                    : {
                        name: f.name,
                        email: f.email,
                        phone: f.phone,
                        cpf: f.cpf,
                    },
                items: selectedItems,
                paymentMethod,
                installments: Number(f.installments) || 1,
                card:
                    paymentMethod === "card"
                        ? {
                            number: f.card_number,
                            name: f.card_name,
                            expiry: f.card_expiry,
                            cvv: f.card_cvv,
                        }
                        : undefined,
                couponCode: appliedCoupon?.code,
                shippingServiceId: selectedShipping.id,
                pickup: selectedShipping.pickup === true,
                shippingAddress: {
                    cep: f.cep,
                    street: f.street,
                    number: f.number,
                    complement: f.complement || undefined,
                    neighborhood: f.neighborhood,
                    city: f.city,
                    state: f.state,
                },
            });

            // A conversão de venda é reportada SERVER-SIDE (Meta CAPI/GA4/TikTok)
            // quando o pagamento cai de fato — não aqui, na criação do pedido.
            // Disparar aqui contava Pix/boleto não pago (~65% não paga).
            sessionStorage.setItem("feminnita:lastOrder", JSON.stringify(result));
            removeSelected();

            router.push("/pedido-confirmado");
        } catch (err) {
            const reVersion = err instanceof ApiError ? parseReacceptVersion(err.message) : null;
            if (reVersion !== null) {
                setReacceptVersion(reVersion);
                setReacceptChecked(false);
                setError("");
            } else {
                setError(
                    err instanceof ApiError
                        ? mapOrderError(err.message)
                        : "Erro ao processar o pedido. Tente novamente.",
                );
            }
            setIsProcessing(false);
            submittingRef.current = false;
        }
    };

    const inputClass =
        "w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8C2F39] focus:border-transparent text-base";

    if (authLoading || !ready || selectedItems.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[#8C2F39]" size={50} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-28 md:pb-8">
            <Header />

            {/*
              A última oferta, para quem está indo embora.
              Só aparece se ainda não há o cupom de saída aplicado e a cliente
              já se identificou — sem e-mail não dá para saber se ela é nova, e
              prometer desconto que o servidor vai recusar é pior que calar.
            */}
            <NaoSaiaAgora
                podeOferecer={
                    ready &&
                    selectedItems.length > 0 &&
                    appliedCoupon?.code !== CUPOM_DE_SAIDA &&
                    (!!customer || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                }
                onAceitar={aceitarCupomDeSaida}
            />

            {/* Trust bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-[#8C2F39] px-4 py-2 text-center text-xs text-white">
                <span className="flex items-center gap-1">
                    <ShieldCheck size={13} /> Compra 100% segura
                </span>
                <span className="flex items-center gap-1">
                    <Check size={13} /> Pagamento via Asaas
                </span>
                <span className="flex items-center gap-1">
                    <Truck size={13} /> Frete calculado no CEP
                </span>
            </div>

            <div className="container mx-auto max-w-4xl px-4 py-6">
                <h1 className="mb-6 flex items-center gap-2 text-2xl font-light">
                    <Lock size={18} className="text-green-600" /> Finalizar Compra
                </h1>

                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <AlertCircle size={16} />
                        <p>{error}</p>
                    </div>
                )}

                {/*
                 * O mínimo dito na entrada, não na saída.
                 *
                 * A conferência já existia, mas dentro do submit: a cliente
                 * preenchia nome, CPF, WhatsApp e o endereço inteiro, escolhia
                 * frete e pagamento, e só ao clicar em Finalizar descobria que
                 * o pedido não alcançava o mínimo. Quem passa por isso não
                 * volta para completar o carrinho — fecha a aba.
                 */}
                {ready && subtotal > 0 && subtotal < MIN_ORDER && (
                    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <div className="flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>
                                Este é um atacado: o pedido mínimo é{" "}
                                <strong>{formatBRL(MIN_ORDER)}</strong>. Faltam{" "}
                                <strong>{formatBRL(MIN_ORDER - subtotal)}</strong> para fechar.{" "}
                                <Link href="/carrinho" className="font-semibold underline">
                                    Voltar ao carrinho e adicionar peças
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                {/* Mobile/tablet: resumo recolhível */}
                <div className="mb-4 overflow-hidden rounded-xl border bg-white lg:hidden">
                    <button
                        type="button"
                        onClick={() => setSummaryOpen((v) => !v)}
                        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
                    >
                        <span>
                            Ver resumo do pedido ({selectedItems.length}{" "}
                            {selectedItems.length === 1 ? "item" : "itens"})
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[#8C2F39]">
                                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                            {summaryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </button>
                    {summaryOpen && (
                        <div className="border-t px-4 pb-4 text-sm">
                            <div className="divide-y">
                                {selectedItems.map((item, i) => (
                                    <div key={i} className="flex justify-between py-2">
                                        <span className="text-gray-700">
                                            {item.quantity}× {item.name}
                                        </span>
                                        <span className="font-medium">
                                            R${" "}
                                            {(item.price * item.quantity).toLocaleString("pt-BR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-3">
                                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <Tag size={12} /> Cupom de desconto
                                </label>
                                <CouponBox
                                    couponCode={couponCode}
                                    setCouponCode={setCouponCode}
                                    appliedCoupon={appliedCoupon}
                                    loading={couponLoading}
                                    onApply={handleApplyCoupon}
                                    onRemove={handleRemoveCoupon}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-5">
                        {/* Left: form */}
                        <div className="space-y-4 lg:col-span-3">
                            {/* Dados pessoais */}
                            <div className="rounded-xl border bg-white p-5">
                                <h2 className="mb-4 font-semibold">1. Dados pessoais</h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <input
                                        name="name"
                                        placeholder="Nome completo *"
                                        required
                                        value={form.name}
                                        onChange={(e) => set("name", e.target.value)}
                                        className={inputClass}
                                    />
                                    {customer ? (
                                        <input
                                            name="email"
                                            type="email"
                                            value={customer.email}
                                            disabled
                                            className={`${inputClass} bg-gray-50 text-gray-400`}
                                        />
                                    ) : (
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="E-mail *"
                                            required
                                            value={form.email}
                                            onChange={(e) => set("email", e.target.value.trim())}
                                            onBlur={guardarCarrinhoParaLembrete}
                                            className={inputClass}
                                            autoComplete="email"
                                        />
                                    )}
                                    <input
                                        name="cpf"
                                        placeholder="CPF *"
                                        required
                                        value={form.cpf}
                                        onChange={(e) =>
                                            set("cpf", e.target.value.replace(/\D/g, "").slice(0, 11))
                                        }
                                        className={inputClass}
                                        inputMode="numeric"
                                    />
                                    <input
                                        name="phone"
                                        type="tel"
                                        placeholder="WhatsApp com DDD *"
                                        required
                                        value={form.phone}
                                        onChange={(e) => set("phone", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="rounded-xl border bg-white p-5">
                                <h2 className="mb-4 font-semibold">2. Endereço de entrega</h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="relative sm:col-span-2">
                                        <input
                                            name="cep"
                                            placeholder="CEP *"
                                            required
                                            value={form.cep}
                                            onChange={(e) =>
                                                set("cep", e.target.value.replace(/\D/g, "").slice(0, 8))
                                            }
                                            onBlur={handleCepBlur}
                                            className={inputClass + " pr-10"}
                                            inputMode="numeric"
                                        />
                                        {cepLoading && (
                                            <Loader2
                                                size={16}
                                                className="absolute right-3 top-3.5 animate-spin text-gray-400"
                                            />
                                        )}
                                    </div>
                                    <input
                                        name="street"
                                        placeholder="Rua *"
                                        required
                                        value={form.street}
                                        onChange={(e) => set("street", e.target.value)}
                                        className={`${inputClass} sm:col-span-2`}
                                    />
                                    <input
                                        name="number"
                                        placeholder="Número *"
                                        required
                                        value={form.number}
                                        onChange={(e) => set("number", e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        name="complement"
                                        placeholder="Complemento"
                                        value={form.complement}
                                        onChange={(e) => set("complement", e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        name="neighborhood"
                                        placeholder="Bairro *"
                                        required
                                        value={form.neighborhood}
                                        onChange={(e) => set("neighborhood", e.target.value)}
                                        className={inputClass}
                                    />
                                    <input
                                        name="city"
                                        placeholder="Cidade *"
                                        required
                                        value={form.city}
                                        onChange={(e) => set("city", e.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                {/* Frete */}
                                {isCalculatingShipping && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 size={14} className="animate-spin" /> Calculando
                                        frete...
                                    </div>
                                )}
                                {shippingOptions.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        <h3 className="flex items-center gap-2 text-sm font-medium">
                                            <Truck size={16} /> Opções de frete
                                        </h3>
                                        {shippingOptions.map((opt) => (
                                            <label
                                                key={opt.id}
                                                className={`flex cursor-pointer items-center justify-between rounded-xl border-2 p-3 transition-all ${selectedShipping?.id === opt.id
                                                    ? "border-[#8C2F39] bg-rose-50"
                                                    : "border-gray-200"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="shipping"
                                                        checked={selectedShipping?.id === opt.id}
                                                        onChange={() =>
                                                            opt.pickup
                                                                ? setConfirmandoRetirada(opt)
                                                                : setSelectedShipping(opt)
                                                        }
                                                        className="accent-[#8C2F39]"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {opt.company ? `${opt.company} — ` : ""}
                                                            {opt.name}
                                                        </p>
                                                        {opt.pickup ? (
                                                            <div className="text-xs text-gray-600">
                                                                {opt.address && <p>{opt.address}</p>}
                                                                {opt.hours && (
                                                                    <p className="text-gray-500">
                                                                        {opt.hours}
                                                                    </p>
                                                                )}
                                                                {opt.note && (
                                                                    <p className="mt-0.5 text-[#8C2F39]">
                                                                        {opt.note}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-gray-500">
                                                                {/* "útil" no plural é "úteis": troca o "il" por "eis",
                                                                    não acrescenta. Somando, saía "dias útileis" em
                                                                    todas as sete transportadoras do checkout. */}
                                                                {opt.deliveryDays > 0
                                                                    ? `até ${opt.deliveryDays} dia${opt.deliveryDays > 1 ? "s" : ""} út${opt.deliveryDays > 1 ? "eis" : "il"}`
                                                                    : "prazo a confirmar"}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm font-semibold text-[#8C2F39]">
                                                    {opt.price === 0
                                                        ? "Grátis"
                                                        : `R$ ${opt.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                                                </p>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {!isCalculatingShipping &&
                                    shippingOptions.length === 0 &&
                                    form.cep.length === 8 && (
                                        <p className="mt-3 text-xs text-amber-600">
                                            Nenhuma opção de frete disponível para este CEP.
                                        </p>
                                    )}
                            </div>

                            {/* Pagamento */}
                            <div className="rounded-xl border bg-white p-5">
                                <h2 className="mb-4 font-semibold">3. Forma de pagamento</h2>

                                {/* PIX destaque */}
                                <label
                                    className={`mb-3 flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${paymentMethod === "pix"
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="pix"
                                        checked={paymentMethod === "pix"}
                                        onChange={() => selectPayment("pix")}
                                        className="accent-green-600"
                                    />
                                    <QrCode
                                        size={22}
                                        className={
                                            paymentMethod === "pix" ? "text-green-600" : "text-gray-400"
                                        }
                                    />
                                    <div className="flex-1">
                                        <p className="font-semibold">PIX</p>
                                        <p className="text-xs font-semibold text-green-600">
                                            {Math.round(PIX_DISCOUNT_RATE * 100)}% DE DESCONTO — Aprovação instantânea
                                        </p>
                                    </div>
                                    {paymentMethod === "pix" && discount > 0 && (
                                        <span className="rounded-full bg-green-600 px-2 py-1 text-xs font-bold text-white">
                                            -R${" "}
                                            {discount.toLocaleString("pt-BR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    )}
                                </label>

                                {[
                                    {
                                        id: "card" as const,
                                        Icon: CreditCard,
                                        title: "Cartão de crédito",
                                        subtitle: `Parcelamento ${TEXTO_PARCELAMENTO}`,
                                    },
                                    {
                                        id: "boleto" as const,
                                        Icon: Barcode,
                                        title: "Boleto bancário",
                                        subtitle: "Vence em 3 dias úteis",
                                    },
                                ].map(({ id, Icon, title, subtitle }) => (
                                    <label
                                        key={id}
                                        className={`mb-3 flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${paymentMethod === id
                                            ? "border-[#8C2F39] bg-rose-50"
                                            : "border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={id}
                                            checked={paymentMethod === id}
                                            onChange={() => selectPayment(id)}
                                            className="accent-[#8C2F39]"
                                        />
                                        <Icon
                                            size={22}
                                            className={
                                                paymentMethod === id ? "text-[#8C2F39]" : "text-gray-400"
                                            }
                                        />
                                        <div>
                                            <p className="font-medium">{title}</p>
                                            <p className="text-xs text-gray-500">{subtitle}</p>
                                        </div>
                                    </label>
                                ))}

                                {/* Campos cartão */}
                                {paymentMethod === "card" && (
                                    <div className="mt-2 space-y-3">
                                        <input
                                            placeholder="Número do cartão *"
                                            value={form.card_number}
                                            onChange={(e) =>
                                                set(
                                                    "card_number",
                                                    e.target.value
                                                        .replace(/\D/g, "")
                                                        .replace(/(.{4})/g, "$1 ")
                                                        .trim()
                                                        .slice(0, 19),
                                                )
                                            }
                                            className={inputClass}
                                            inputMode="numeric"
                                            autoComplete="cc-number"
                                        />
                                        <input
                                            placeholder="Nome no cartão *"
                                            value={form.card_name}
                                            onChange={(e) =>
                                                set("card_name", e.target.value.toUpperCase())
                                            }
                                            className={inputClass}
                                            autoComplete="cc-name"
                                        />
                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                placeholder="MM/AA *"
                                                value={form.card_expiry}
                                                onChange={(e) => {
                                                    const v = e.target.value.replace(/\D/g, "");
                                                    set(
                                                        "card_expiry",
                                                        v.length >= 2 ? v.slice(0, 2) + "/" + v.slice(2, 4) : v,
                                                    );
                                                }}
                                                className={inputClass}
                                                inputMode="numeric"
                                                maxLength={5}
                                                autoComplete="cc-exp"
                                            />
                                            <input
                                                placeholder="CVV *"
                                                value={form.card_cvv}
                                                onChange={(e) =>
                                                    set("card_cvv", e.target.value.replace(/\D/g, "").slice(0, 4))
                                                }
                                                className={inputClass}
                                                inputMode="numeric"
                                                autoComplete="cc-csc"
                                            />
                                        </div>
                                        <select
                                            value={form.installments}
                                            onChange={(e) => set("installments", e.target.value)}
                                            className={inputClass}
                                        >
                                            {Array.from({ length: MAX_PARCELAS }, (_, i) => i + 1).map((n) => (
                                                <option key={n} value={String(n)}>
                                                    {n}× de R${" "}
                                                    {(total / n).toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}{" "}
                                                    sem juros
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: summary (desktop) */}
                        <div className="hidden lg:col-span-2 lg:block">
                            <div className="sticky top-4 space-y-4 rounded-xl border bg-white p-5">
                                <h2 className="font-semibold">Resumo</h2>
                                <div className="max-h-52 space-y-2 divide-y overflow-y-auto text-sm">
                                    {selectedItems.map((item, i) => (
                                        <div key={i} className="flex justify-between pt-2">
                                            <span className="truncate pr-2 text-gray-700">
                                                {item.quantity}× {item.name}
                                            </span>
                                            <span className="shrink-0 font-medium">
                                                R${" "}
                                                {(item.price * item.quantity).toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Cupom */}
                                <div className="border-t pt-3">
                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                        <Tag size={12} /> Cupom de desconto
                                    </label>
                                    <CouponBox
                                        couponCode={couponCode}
                                        setCouponCode={setCouponCode}
                                        appliedCoupon={appliedCoupon}
                                        loading={couponLoading}
                                        onApply={handleApplyCoupon}
                                        onRemove={handleRemoveCoupon}
                                    />
                                </div>

                                <div className="space-y-2 border-t pt-3 text-sm">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span>
                                            R${" "}
                                            {subtotal.toLocaleString("pt-BR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Frete</span>
                                        <span>
                                            {shippingCost === 0 && selectedShipping
                                                ? "Grátis"
                                                : selectedShipping
                                                    ? `R$ ${shippingCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                                    : "—"}
                                        </span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between font-medium text-green-600">
                                            <span>Desconto PIX</span>
                                            <span>
                                                - R${" "}
                                                {discount.toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    {appliedCoupon && (
                                        <div className="flex justify-between font-medium text-green-600">
                                            <span>Cupom {appliedCoupon.code}</span>
                                            <span>
                                                - R${" "}
                                                {couponDiscount.toLocaleString("pt-BR", {
                                                    minimumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                        <span>Total</span>
                                        <span className="text-[#8C2F39]">
                                            R${" "}
                                            {total.toLocaleString("pt-BR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isProcessing || !selectedShipping || subtotal < MIN_ORDER}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C2F39] py-4 font-semibold text-white transition-colors hover:bg-[#7a2832] disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Lock size={15} /> Finalizar Pedido
                                        </>
                                    )}
                                </button>

                                <p className="flex items-center justify-center gap-1 text-center text-xs text-gray-400">
                                    <Lock size={10} /> Pagamento 100% seguro e criptografado
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile sticky CTA */}
                    <div
                        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-4 shadow-lg lg:hidden"
                        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                    >
                        <button
                            type="submit"
                            disabled={isProcessing || !selectedShipping || subtotal < MIN_ORDER}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#8C2F39] py-4 font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> Processando...
                                </>
                            ) : (
                                <>
                                    <Lock size={15} /> Finalizar — R${" "}
                                    {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </>
                            )}
                        </button>
                        {!selectedShipping && (
                            <p className="mt-1 text-center text-xs text-amber-600">
                                Digite o CEP para calcular o frete
                            </p>
                        )}
                    </div>
                </form>
            </div>

            {/* Confirmacao da retirada. A cliente do FEM-1031 pagou um pedido com
                retirada em Nova Friburgo morando em Sao Paulo. O aviso diz o que
                a lista nao dizia: retirada nao e frete gratis, e ninguem entrega.
                Quando a cidade dela nao e Nova Friburgo, a pergunta cita a cidade —
                generico se le no automatico, o proprio nome da cidade nao. */}
            {confirmandoRetirada && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="titulo-retirada"
                >
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 id="titulo-retirada" className="text-lg font-bold">
                            Tem certeza que quer retirar na fábrica?
                        </h3>

                        <p className="mt-3 text-sm text-gray-700">
                            Escolhendo a retirada,{" "}
                            <strong>o pedido não é enviado pelos Correios nem por transportadora</strong>.
                            Você precisa buscar pessoalmente na nossa fábrica, em Nova Friburgo – RJ.
                        </p>

                        {form.city && !/friburgo/i.test(form.city) && (
                            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                                Você informou <strong>{form.city}{form.state ? ` – ${form.state}` : ""}</strong>.
                                Se você não vai até Nova Friburgo, escolha uma transportadora.
                            </p>
                        )}

                        {(confirmandoRetirada.address || confirmandoRetirada.hours) && (
                            <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                                {confirmandoRetirada.address && <p>{confirmandoRetirada.address}</p>}
                                {confirmandoRetirada.hours && (
                                    <p className="text-gray-500">{confirmandoRetirada.hours}</p>
                                )}
                            </div>
                        )}

                        <div className="mt-5 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedShipping(confirmandoRetirada);
                                    setConfirmandoRetirada(null);
                                }}
                                className="rounded-xl bg-[#8C2F39] py-3 font-semibold text-white hover:bg-[#7a2832]"
                            >
                                Sim, eu vou buscar na fábrica
                            </button>
                            <button
                                type="button"
                                onClick={() => setConfirmandoRetirada(null)}
                                className="rounded-xl border py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
                            >
                                Não, quero receber em casa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
