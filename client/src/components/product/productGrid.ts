// Grades de vitrine que OCUPAM A LARGURA da seção (auto-fit + trilhas 1fr).
// auto-fit colapsa as trilhas vazias, então 5 produtos numa tela de 1920px se
// espalham pela linha inteira em vez de ficarem amontoados à esquerda com um
// vazio de ~650px do lado direito (era o que o auto-fill fazia).
//
// O teto NÃO pode ir no minmax: quando o max é uma largura fixa, o navegador
// usa ELE para contar as trilhas e a linha acaba com menos colunas (5 produtos
// viravam 4 + 1 sobrando embaixo). Então a trilha é 1fr e o limite vai no card,
// com justify-self-center — assim, com 1 ou 2 produtos, o card para de crescer
// em vez de virar um banner gigante.
const CARD_CAP = "[&>*]:w-full [&>*]:max-w-[340px] [&>*]:justify-self-center";

export const PRODUCT_GRID =
    `grid gap-4 md:gap-6 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] ${CARD_CAP}`;

// Home: mesma regra, com piso um pouco menor (cabe ~5 por linha no desktop largo).
export const HOME_SECTION_GRID =
    `grid gap-4 md:gap-6 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(190px,1fr))] ${CARD_CAP}`;
