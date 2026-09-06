// Número FIXO de colunas por página (decisão da Chris):
//   home (vitrine) ....... 5 produtos por linha no desktop
//   categoria / produtos / busca ... 4 produtos por linha no desktop
// Antes era auto-fill, que reservava trilhas vazias: numa tela de 1920px os 5
// produtos ficavam amontoados à esquerda com ~650px de vazio à direita. Coluna
// fixa resolve isso e ainda dispensa teto por card — com 1 produto ele ocupa
// 1/4 (ou 1/5) da linha em vez de virar um banner.
export const PRODUCT_GRID = "grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

export const HOME_SECTION_GRID = "grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5";
