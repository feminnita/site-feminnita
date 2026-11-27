// 27/11 Chris: Black Friday com botão no topo, banner principal parado e uma página só
// com os produtos da promoção. Tudo some sozinho depois do fim (domingo 29/11, 23h59 de Brasília).
export const BLACK_FRIDAY_ATE = new Date("2026-11-30T03:00:00Z");

export function blackFridayNoAr(agora: Date = new Date()): boolean {
  return agora.getTime() < BLACK_FRIDAY_ATE.getTime();
}

// Produto da Black Friday = etiqueta da promoção especial "Black Friday" no ar.
export function ehBlackFriday(p: { promo?: { selo: string } | null }): boolean {
  return !!p.promo && /black\s*friday/i.test(p.promo.selo);
}
