/**
 * Quando o cartao passa, o Pix que a mesma cliente deixou em aberto morre.
 *
 * O caminho comum: a cliente gera o Pix, nao paga, volta e paga no cartao.
 * O Pix seguia valido por 24h — se ela (ou alguem da familia, com o QR code no
 * celular) pagasse depois, a loja recebia duas vezes pelo mesmo carrinho.
 *
 * Regras:
 *  - so cobranca que o ASAAS diz estar PENDING. Paga, vencida ou ja cancelada
 *    nao se toca — e o Asaas, nao o nosso banco, quem sabe se o dinheiro caiu;
 *  - primeiro cancela no Asaas, so depois no banco. Ao contrario, um Pix
 *    cancelado aqui e ainda pagavel la viraria pedido pago sem estoque;
 *  - nada aqui pode derrubar o pedido pago: todo erro vira log.
 *
 * As dependencias chegam por parametro para o teste rodar sem banco e sem Asaas.
 */

export const MOTIVO_SUBSTITUIDO = 'substituido_por_cartao';
export const JANELA_PIX_HORAS = 24;

export type PixPendente = { id: string; orderNumber: string; asaasPaymentId: string };

export type DependenciasPix = {
    buscarPixPendentes: (cpf: string, horas: number, excetoOrderId: string) => Promise<PixPendente[]>;
    statusNoAsaas: (asaasPaymentId: string) => Promise<string>;
    cancelarNoAsaas: (asaasPaymentId: string) => Promise<unknown>;
    // Cancela o pedido como o cancelamento normal (devolve a reserva de
    // estoque). Devolve false se ele ja nao estava pendente.
    cancelarPedido: (orderId: string) => Promise<boolean>;
    marcarMotivo: (orderId: string, motivo: string, nota: string) => Promise<unknown>;
    log?: (...args: unknown[]) => void;
};

export type ResultadoPix = { cancelados: string[]; ignorados: string[]; falhas: string[] };

export async function cancelarPixPendentesDoCpf(
    cpf: string | null | undefined,
    pedidoPago: { id: string; orderNumber: string },
    deps: DependenciasPix,
): Promise<ResultadoPix> {
    const log = deps.log ?? console.error;
    const resultado: ResultadoPix = { cancelados: [], ignorados: [], falhas: [] };
    if (!cpf) return resultado;

    let pendentes: PixPendente[];
    try {
        pendentes = await deps.buscarPixPendentes(cpf, JANELA_PIX_HORAS, pedidoPago.id);
    } catch (erro) {
        log(`Pix pendente: nao consegui listar os Pix do CPF apos o pedido ${pedidoPago.orderNumber}:`, erro);
        return resultado;
    }

    for (const pix of pendentes) {
        try {
            const status = await deps.statusNoAsaas(pix.asaasPaymentId);
            if (status !== 'PENDING') {
                resultado.ignorados.push(pix.orderNumber);
                continue;
            }
            await deps.cancelarNoAsaas(pix.asaasPaymentId);
            await deps.cancelarPedido(pix.id);
            await deps.marcarMotivo(
                pix.id,
                MOTIVO_SUBSTITUIDO,
                `Cancelado automaticamente: a cliente pagou no cartão o pedido ${pedidoPago.orderNumber}.`,
            );
            resultado.cancelados.push(pix.orderNumber);
        } catch (erro) {
            resultado.falhas.push(pix.orderNumber);
            log(`Pix pendente: falha ao cancelar ${pix.orderNumber} (pago no cartao: ${pedidoPago.orderNumber}):`, erro);
        }
    }
    return resultado;
}
