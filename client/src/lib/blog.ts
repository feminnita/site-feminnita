// O blog entra no ar DEPOIS da loja — decisão da Chris: o site estreia antes
// do conteúdo estar pronto, e blog vazio na estreia conta a história errada
// sobre a marca.
//
// Enquanto esta chave for false:
//   - BLOG some do menu (nada leva até ele);
//   - /blog e /blog/qualquer-artigo mostram "em construção", com noindex;
//   - o sitemap para de oferecer as páginas do blog ao Google.
//
// Nada foi apagado: as páginas, os artigos e o painel continuam inteiros.
// Para publicar o blog, troque para true e suba. É a única mudança necessária.
export const BLOG_NO_AR = false;
