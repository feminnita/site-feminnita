/**
 * Em quantas vezes a loja parcela no cartão.
 *
 * Era seis, porque no Asaas a faixa de 2 a 6 parcelas custa a MESMA taxa —
 * 3,49% sobre o total, cobrada uma vez só. Pela taxa, seguiria sendo seis: em
 * 3x ou em 6x a Chris paga o mesmo para vender.
 *
 * Voltou para três em 29/09/2026 por CAIXA, não por taxa. O "receba em 32
 * dias" do Asaas vale por PARCELA, e não pela venda: numa venda em 6x a última
 * parcela entra sete meses depois. A Chris não tem como esperar isso — foi
 * essa a razão, e é a única.
 *
 * O segundo efeito é a antecipação, que custa 1,6% ao mês por parcela
 * adiantada, ou seja `1,6% × (parcelas + 1) / 2`:
 *
 *   3x → 3,2% de antecipação → 6,7% somando a taxa do cartão
 *   6x → 5,6% de antecipação → 9,1%
 *
 * A margem reservada para meio de pagamento é 8%. Em 6x antecipar estourava
 * essa margem; em 3x cabe. Três parcelas devolvem a opção de antecipar sem
 * comer o lucro.
 *
 * O preço da mudança é a revendedora: um pedido de R$ 1.200 sai de 6× R$ 200
 * para 3× R$ 400, e isso pesa para quem está montando estoque. Se um dia o
 * caixa permitir esperar, voltar é trocar este número.
 *
 * A partir de 7x a taxa sobe para 3,99% — por isso nunca passou disso.
 *
 * Este número é a única fonte: o seletor do checkout, o texto do cartão, a
 * faixa do topo do site, a central de ajuda e a página "como comprar" leem
 * daqui. Quando estavam escritos à mão em seis lugares, a loja prometia 3x na
 * home e cobrava em 6x no pagamento.
 */
export const MAX_PARCELAS = 3;

/** "em até 3x sem juros" — o texto que a loja usa em toda parte. */
export const TEXTO_PARCELAMENTO = `em até ${MAX_PARCELAS}x sem juros`;
