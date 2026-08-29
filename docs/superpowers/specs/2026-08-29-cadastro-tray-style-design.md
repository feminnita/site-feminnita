# Cadastro de produtos estilo Tray (variação por variação)

**Data:** 2026-08-29
**Onde:** painel da loja `site-feminnita` (`/admin/produtos`), grava no Supabase `ctvitzzddrumphhhreht` (banco que a loja lê). Substitui o uso do painel `painel-administrativo-smoky` (que grava no banco errado rh15).

## Problema
O formulário atual usa uma **matriz Tamanho × Cor** de estoque. Com dezenas de estampas fica impossível saber qual quadrado é qual, e preço/EAN/promoção são únicos do produto. Sem autonomia por variação.

## Objetivo
Cadastro **idêntico em usabilidade à Tray**: PAI em cima (imagens + descrição única + preço base), e **cada variação (cor+tamanho) num card independente**, com autonomia total (editar, excluir, inativar) e identidade clara ("Código · Cor · Tamanho").

## Layout
- **Topo (PAI):** nome, código/ref do pai, categoria, galeria de imagens (principal marcada), descrição única (herda pros filhos), preço base, preço PIX, SEO (slug/meta), peso/dimensões padrão, produto ativo.
- **Variações geradas (N):** lista de cards, 1 por SKU. Cabeçalho "Código · Cor · Tamanho" + [inativar/ativar] + [excluir] + expandir. Ao expandir: Estoque, Preço de venda, Preço de custo, Referência, EAN/GTIN, Estoque mínimo, Promoção (toggle) com Preço promocional + Data início/fim + % desconto, Peso/Altura/Largura/Comprimento (herda do pai se vazio). Imagens ficam por estampa (color_images) exibidas no card.
- **Fora de escopo (só integração marketplace, sem efeito em loja própria):** "Prazo de disponibilidade" e "Quando acabar o estoque".

## Dados (Supabase)
`product_skus` já tem: product_id, size, color, stock_qty, price, sale_price, id.
Migration `019_sku_tray_fields.sql` adiciona (aditivo, não destrutivo): reference, ean, cost_price, min_stock, sale_start, sale_end, active(default true), weight_kg, pkg_height_cm, pkg_width_cm, pkg_length_cm + índice por product_id.
Imagens por estampa = `products.color_images` (jsonb {cor:[urls]}). Imagens/descrição/preço base do pai = colunas de `products`.

## Salvar
- PAI → update/insert em `products`.
- Cada card → upsert em `product_skus` por (product_id, size, color).
- Excluir variação → delete da linha `product_skus`.
- Inativar → `active=false` (some da loja, não apaga). A vitrine deve filtrar SKUs `active=false` e cores sem nenhum SKU ativo.
- Storage de imagem já é bucket `product-images` (ou Cloudinary unsigned vsngjl2a).

## Deploy
O painel `/admin` existe no código mas está 404 no ar (build antigo). Redeploy no Vercel (projeto `site-feminnita`) para publicar o painel e este cadastro. Passa a ser o painel de trabalho.

## Critérios de sucesso (verificar na fonte)
1. Abrir `/admin/produtos`, editar um produto com muitas estampas → ver 1 card por variação, identificado.
2. Alterar estoque de uma variação → refletir em `product_skus` e na loja.
3. Inativar uma variação → sumir da loja, permanecer no painel.
4. Excluir uma variação → sair do banco.
5. Migration 019 aplicada (colunas existem).
