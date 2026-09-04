// Resolução da TABELA DE MEDIDAS de um produto.
//
// Fonte dos dados: setting `size_charts` (site_settings) = objeto por TIPO:
//   { feminino, plus, masculino, infantil, pet }, cada tipo =
//   { name, columns:[...], footer, rows:[{ label, equiv, values:[...] }] }.
//
// Regra:
//  - Se `products.size_chart` (do próprio produto) for NÃO-VAZIO => EXCEÇÃO
//    (source="product"): renderiza best-effort a estrutura { tamanho: { medida: valor } }.
//  - Senão => herda por categoria (source="category"): resolve o TIPO pelos slugs
//    das categorias do produto (prioridade pet→infantil→plus→masculino→feminino;
//    feminino é o padrão) e usa o chart daquele tipo no setting.
//  - Em AMBOS, filtra as linhas para só os tamanhos que o produto tem (case-insensitive).

export type SizeChartType = 'feminino' | 'plus' | 'masculino' | 'infantil' | 'pet';

type SettingChartRow = { label?: string; equiv?: string | null; values?: (string | number)[] };
type SettingChart = { name?: string; columns?: string[]; footer?: string; rows?: SettingChartRow[] };
export type SizeChartsSetting = Partial<Record<SizeChartType, SettingChart>>;

export type ResolvedSizeChartRow = { label: string; equiv: string | null; values: (string | number)[] };
export type ResolvedSizeChart = {
    source: 'product' | 'category';
    name: string;
    columns: string[];
    footer: string;
    rows: ResolvedSizeChartRow[];
};

// Mapa slug -> tipo. Ordem de prioridade abaixo em PRIORITY; feminino é o default.
const TYPE_SLUGS: Record<Exclude<SizeChartType, 'feminino'>, string[]> = {
    pet: ['pet'],
    infantil: [
        'infantil',
        'feminino-menina',
        'menino',
        'feminino-menina-pijama-manga-curta',
        'feminino-menina-pijama-manga-longa',
        'menina-baby-doll',
    ],
    plus: ['plus-size', 'baby-doll-plus-size'],
    masculino: ['masculino', 'pijama-masculino-curto', 'pijama-masculino-longo', 'samba-cancao'],
};
const PRIORITY: Exclude<SizeChartType, 'feminino'>[] = ['pet', 'infantil', 'plus', 'masculino'];

export function resolveSizeChartType(categorySlugs: string[]): SizeChartType {
    const set = new Set(categorySlugs.map((s) => s.trim().toLowerCase()).filter(Boolean));
    for (const type of PRIORITY) {
        if (TYPE_SLUGS[type].some((slug) => set.has(slug))) return type;
    }
    return 'feminino';
}

function isNonEmptyObject(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length > 0;
}

function filterRowsToSizes(rows: ResolvedSizeChartRow[], sizes: string[]): ResolvedSizeChartRow[] {
    const wanted = new Set(sizes.map((s) => s.trim().toLowerCase()).filter(Boolean));
    if (wanted.size === 0) return [];
    return rows.filter((r) => wanted.has(String(r.label).trim().toLowerCase()));
}

// Best-effort da estrutura do próprio produto: { tamanho: { medida: valor } }.
function buildFromProductChart(raw: Record<string, unknown>): ResolvedSizeChart | null {
    const entries = Object.entries(raw).filter(([, v]) => isNonEmptyObject(v));
    if (entries.length === 0) return null;

    const columns: string[] = [];
    for (const [, measures] of entries) {
        for (const key of Object.keys(measures as Record<string, unknown>)) {
            if (!columns.includes(key)) columns.push(key);
        }
    }

    const rows: ResolvedSizeChartRow[] = entries.map(([size, measures]) => {
        const m = measures as Record<string, unknown>;
        return {
            label: size,
            equiv: null,
            values: columns.map((c) => {
                const val = m[c];
                return val === undefined || val === null ? '' : (val as string | number);
            }),
        };
    });

    return { source: 'product', name: 'Tabela de medidas', columns, footer: '', rows };
}

function fromSettingChart(chart: SettingChart | undefined): ResolvedSizeChart | null {
    if (!chart || !Array.isArray(chart.columns)) return null;
    const rows: ResolvedSizeChartRow[] = (chart.rows ?? []).map((r) => ({
        label: String(r?.label ?? ''),
        equiv: r?.equiv != null ? String(r.equiv) : null,
        values: Array.isArray(r?.values) ? r.values : [],
    }));
    return {
        source: 'category',
        name: chart.name ?? '',
        columns: chart.columns,
        footer: chart.footer ?? '',
        rows,
    };
}

const EMPTY: ResolvedSizeChart = { source: 'category', name: '', columns: [], footer: '', rows: [] };

export function resolveSizeChart(input: {
    productChart: Record<string, unknown> | null | undefined;
    charts: SizeChartsSetting;
    categorySlugs: string[];
    sizes: string[];
}): ResolvedSizeChart {
    // Exceção: chart do próprio produto (não-vazio) tem prioridade sobre a herança.
    if (isNonEmptyObject(input.productChart)) {
        const built = buildFromProductChart(input.productChart);
        if (built) return { ...built, rows: filterRowsToSizes(built.rows, input.sizes) };
    }

    // Herdado por categoria: tipo resolvido, com feminino como fallback padrão.
    const type = resolveSizeChartType(input.categorySlugs);
    const chart = fromSettingChart(input.charts?.[type]) ?? fromSettingChart(input.charts?.feminino);
    if (!chart) return EMPTY;
    return { ...chart, rows: filterRowsToSizes(chart.rows, input.sizes) };
}
