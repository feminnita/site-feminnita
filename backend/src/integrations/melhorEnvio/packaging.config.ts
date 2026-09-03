// Configuração da função de pacote (computePackage). TODO valor de embalagem
// mora AQUI — para recalibrar não se recodifica nada, só se edita este arquivo.
//
// Unidade interna do algoritmo: centímetro e cm³ (1 L = 1000 cm³). As
// capacidades de sacola/caixa são derivadas das medidas abaixo.
//
// ┌─ STATUS DE VALIDAÇÃO ──────────────────────────────────────────────────┐
// │ As MEDIDAS EXTERNAS das sacolas (40x50, 50x60, 60x80) e da caixa        │
// │ (40x40x40) estão CONFIRMADAS pelo Iury.                                 │
// │                                                                         │
// │ Já as BASES (larguraBaseCm × comprimentoBaseCm) e a ESPESSURA_MAX de    │
// │ cada sacola abaixo ainda são HIPÓTESE (bloco ≈ W/2 × (L-20), espessura  │
// │ ≈ W/2). Elas PRECISAM ser calibradas contra o histórico real do Melhor │
// │ Envio (~637 envios, GET /me/orders → volumes[].{height,width,length}).  │
// │ Esse cruzamento NÃO foi feito porque o token do ME não está disponível  │
// │ neste ambiente (sem .env / ME_TOKEN). Quando o token existir, rode a    │
// │ validação, agrupe os pares (largura × comprimento), pegue a espessura   │
// │ máxima observada por grupo e substitua os números abaixo. NADA de       │
// │ código muda — só estes valores.                                         │
// └─────────────────────────────────────────────────────────────────────────┘

export type SacolaConfig = {
    nome: string;
    /** Largura da base do "bloco" que a sacola forma quando cheia (cm). */
    larguraBaseCm: number;
    /** Comprimento da base do "bloco" (cm). */
    comprimentoBaseCm: number;
    /** Espessura máxima que a sacola comporta antes de virar caixa (cm). */
    espessuraMaxCm: number;
};

export const PACKAGING = {
    // Sacolas planas do Iury (largura externa × comprimento externo confirmados).
    // Lista NÃO-vazia = a função tenta sacola antes da caixa. Deixe [] para
    // pular sacola e ir direto pra caixa.
    // Ordem irrelevante: a função escolhe SEMPRE a menor sacola que couber.
    SACOLAS: [
        // 40x50  → HIPÓTESE base 20x30, espessura máx 20  → cap ~12 L
        { nome: 'Sacola 40x50', larguraBaseCm: 20, comprimentoBaseCm: 30, espessuraMaxCm: 20 },
        // 50x60  → HIPÓTESE base 25x40, espessura máx 25  → cap ~25 L
        { nome: 'Sacola 50x60', larguraBaseCm: 25, comprimentoBaseCm: 40, espessuraMaxCm: 25 },
        // 60x80  → HIPÓTESE base 30x60, espessura máx 30  → cap ~54 L
        { nome: 'Sacola 60x80', larguraBaseCm: 30, comprimentoBaseCm: 60, espessuraMaxCm: 30 },
    ] as SacolaConfig[],

    // Caixa padrão da operação (confirmada). 40×40×40 = 64.000 cm³ = 64 L.
    CAIXA_CM: { larguraCm: 40, comprimentoCm: 40, alturaCm: 40 },
    CAIXA_VOL_CM3: 40 * 40 * 40, // 64.000

    // Item sem medida real → estima o volume a partir do peso pela densidade
    // fallback (p10 = 79 g/L). volume_cm3 = peso_g / 79 * 1000.
    DENSITY_FALLBACK_G_POR_L: 79,

    // Teto duro por embalagem/volume (kg). Nenhum volume pode passar disso.
    TETO_KG: 22,

    // Piso dos Correios por volume (cm): comprimento ≥ 13, largura ≥ 8, altura ≥ 1.
    CORREIOS_MIN_CM: { comprimentoCm: 13, larguraCm: 8, alturaCm: 1 },

    // Máximo de volumes que ainda cotamos no Melhor Envio. Acima disso o pedido
    // vira "Frete sob consulta" (a operação cota coleta com transportadora).
    MAX_VOLUMES_ME: 2,

    // Sentinela de "produto NÃO medido": no banco as colunas de medida têm
    // DEFAULT (peso 0.3 kg, 5×15×20 cm), então nunca vêm NULL. Quando as
    // dimensões batem EXATAMENTE com este default, tratamos como sem medida e
    // caímos no fallback por densidade (e registramos o SKU como "estimado").
    DEFAULT_DIMS_SENTINELA: { alturaCm: 5, larguraCm: 15, comprimentoCm: 20 },
} as const;
