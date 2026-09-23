/**
 * Em quantas vezes a loja parcela no cartão.
 *
 * Seis, e não três, porque no Asaas a faixa de **2 a 6 parcelas custa a mesma
 * taxa** — 3,49% sobre o total, cobrada uma vez só. Dobrar o parcelamento não
 * custa nada a mais para a Chris, e muda bastante para a revendedora: um
 * pedido de R$ 1.200 sai de parcelas de R$ 400 para R$ 200, que é o que cabe
 * no cartão de quem está montando estoque para revender ao longo de dois meses.
 *
 * A partir de 7x a taxa sobe para 3,99% — por isso o limite é aqui, e não mais
 * adiante.
 *
 * Este número é a única fonte: o seletor do checkout, o texto do cartão, a
 * faixa do topo do site, a central de ajuda e a página "como comprar" leem
 * daqui. Quando estavam escritos à mão em seis lugares, a loja prometia 3x na
 * home e cobrava em 6x no pagamento.
 */
export const MAX_PARCELAS = 6;

/** "em até 6x sem juros" — o texto que a loja usa em toda parte. */
export const TEXTO_PARCELAMENTO = `em até ${MAX_PARCELAS}x sem juros`;
