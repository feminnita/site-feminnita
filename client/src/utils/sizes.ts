// Ordem canônica de tamanhos para EXIBIÇÃO (seletor e filtro).
// Letras primeiro, depois numéricos em ordem crescente. Fora da lista => fim, alfabético.
const CANONICAL_ORDER = [
    "PP", "P", "M", "G", "GG", "XGG", "G1", "G2", "G3", "ÚNICO",
    "4", "6", "8", "10", "12", "14", "33/34", "35/36", "37/38", "39/40", "48", "50", "52",
];

// Normaliza para comparação: tolerante a caixa e espaço (exibe o valor original).
function normalizeSize(size: string): string {
    return size.trim().toUpperCase().replace(/\s+/g, "");
}

const RANK = new Map(CANONICAL_ORDER.map((s, i) => [s, i]));

export function sortSizes(sizes: string[]): string[] {
    return [...sizes].sort((a, b) => {
        const ra = RANK.get(normalizeSize(a));
        const rb = RANK.get(normalizeSize(b));
        if (ra !== undefined && rb !== undefined) return ra - rb;
        if (ra !== undefined) return -1;
        if (rb !== undefined) return 1;
        return normalizeSize(a).localeCompare(normalizeSize(b));
    });
}
