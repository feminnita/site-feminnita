// Pedido mínimo do atacado. Hoje é uma constante fixa; idealmente vira um
// setting editável no painel (settings_service) para a cliente trocar sem deploy.
export const MIN_ORDER = 199;

const BRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

// Formata em Real no padrão pt-BR: 1234.5 => "R$ 1.234,50".
export function formatBRL(value: number): string {
    return BRL.format(Number.isFinite(value) ? value : 0);
}
