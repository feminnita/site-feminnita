// Grades de vitrine com COLUNAS DE LARGURA FIXA (auto-fill) + alinhamento à esquerda.
// auto-fill (e não auto-fit) mantém as trilhas vazias: com poucos itens o card NÃO
// estica pra ocupar a linha inteira — fica no tamanho normal, encostado à esquerda.
// Quando a grade enche, o comportamento é o mesmo de antes (várias colunas).
export const PRODUCT_GRID =
    "grid justify-start gap-4 md:gap-6 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]";

// Home: cards um pouco mais estreitos (cabe ~5 por linha no desktop largo).
export const HOME_SECTION_GRID =
    "grid justify-start gap-4 md:gap-6 grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(190px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(190px,1fr))]";
