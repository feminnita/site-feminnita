// Número FIXO de colunas por página (decisão da Chris):
//   categoria / produtos / busca ... 4 produtos por linha no desktop
// Antes era auto-fill, que reservava trilhas vazias: numa tela de 1920px os 4
// produtos ficavam amontoados à esquerda com ~650px de vazio à direita. Coluna
// fixa resolve isso e ainda dispensa teto por card — com 1 produto ele ocupa
// 1/4 da linha em vez de virar um banner.
// A home saiu daqui: as fileiras dela viraram carrossel (ProductRowCarousel),
// que mantém a mesma contagem por tela (2 / 3 / 5) mas rola em vez de quebrar linha.
export const PRODUCT_GRID = "grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
