// Configuração da função de pacote (computePackage). TODO valor de embalagem
// mora AQUI — para recalibrar não se recodifica nada, só se edita este arquivo.
//
// Unidade interna do algoritmo: centímetro e cm³ (1 L = 1000 cm³). As
// capacidades de sacola/caixa são derivadas das medidas abaixo.
//
// ┌─ STATUS DE VALIDAÇÃO ──────────────────────────────────────────────────┐
// │ MEDIDAS EXTERNAS das sacolas (40x50, 50x60, 60x80) e da caixa           │
// │ (40x40x40) CONFIRMADAS pelo Iury.                                       │
// │                                                                         │
// │ BASES e ESPESSURA_MAX CALIBRADAS (03/set/2026) contra os 637 envios     │
// │ reais do Melhor Envio (GET /me/orders, script me:shipping-stats no      │
// │ painel). Densidade declarada: p10=79, mediana=173, p90=271 g/L.         │
// │ Clusters de base mais frequentes (largura×comprimento, arred. 5cm →     │
// │ envios | esp.p90): 30x25 → 107|25 · 30x30 → 105|30 · 30x20 → 95|21 ·    │
// │ 20x20 → 60|20 · 40x40 → 50|39 (já caixa). Quase todo envio tem um lado  │
// │ = 30cm. Valores abaixo usam a esp.p90 (conservador: na dúvida sobe de   │
// │ tier / vai pra caixa, nunca sub-cota). Recalibrar = rodar o script e     │
// │ trocar SÓ os números aqui. NADA de código muda.                         │
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
        // 40x50 → CALIBRADO base 30x25, esp.máx 20 → cap 15 L. Footprint declarado
        // = cluster real 30x25 (107 envios, o mais comum). Cobre 30x20/30x25/20x20/25x25.
        { nome: 'Sacola 40x50', larguraBaseCm: 25, comprimentoBaseCm: 30, espessuraMaxCm: 20 },
        // 50x60 → CALIBRADO base 40x30, esp.máx 25 → cap 30 L. Footprint = cluster
        // real 40x30. Cobre 30x30, 40x25, 40x30, 40x35 (até ~esp 25).
        { nome: 'Sacola 50x60', larguraBaseCm: 30, comprimentoBaseCm: 40, espessuraMaxCm: 25 },
        // 60x80 → CALIBRADO base 40x40, esp.máx 34 → cap 54.4 L. Footprint = cluster
        // real 40x40. Cobre 40x40 fino e 45x40 antes de virar caixa (>54 L → caixa 64 L).
        { nome: 'Sacola 60x80', larguraBaseCm: 40, comprimentoBaseCm: 40, espessuraMaxCm: 34 },
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
