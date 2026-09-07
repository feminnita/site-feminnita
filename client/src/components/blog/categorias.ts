// Cada categoria tem cor própria, como no blog antigo. É o que dava a ele cara
// de revista em vez de lista de links — sem isso, 16 artigos viram 16 retângulos
// iguais e a pessoa não sabe por onde começar.
//
// As cores vieram do style.css do blog antigo, para o visual continuar o mesmo
// que a Chris já tinha aprovado.
export const COR_DA_CATEGORIA: Record<string, string> = {
    Treinamento: "#D4A956",
    "Tecidos & Produtos": "#8C2F39",
    "Bem-Estar & Sono": "#4A7C59",
    Comunidade: "#7B5EA7",
    "Datas Especiais": "#C0503A",
};

export const COR_PADRAO = "#8C2F39";

export const corDaCategoria = (c?: string | null) =>
    (c && COR_DA_CATEGORIA[c]) || COR_PADRAO;
