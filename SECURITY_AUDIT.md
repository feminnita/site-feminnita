# Auditoria de Segurança — site-feminnita (site novo)

**Data:** 2026-08-22 · **Escopo:** `C:\Users\chris\Downloads\site-feminnita` (Next.js App Router + Supabase + Asaas). Site AINDA NÃO no ar.
**Método:** varredura em 4 dimensões, lendo o código real — (1) auth/autorização, (2) integridade de pagamento, (3) IDOR/exposição/segredos, (4) injeção/XSS/config/dependências.
**Regra:** 2 itens dependem de verificar na FONTE (Supabase RLS + config do webhook Asaas) — marcados como ⚠️ VERIFICAR.

---

## STATUS DAS CORREÇÕES (22/08 — só código; type-check tsc limpo; NÃO deployado)
- ✅ **C1 price-tampering** — CORRIGIDO: `checkout/route.ts` recalcula preço/subtotal/desconto/total no servidor a partir de `products` (base_price/pix_price/sale_price); ignora todo valor do cliente; `total ≤ 0` rejeita.
- ✅ **C2 webhook forjável** — CORRIGIDO: `webhooks/asaas` agora FAIL-CLOSED (rejeita 503 se `ASAAS_WEBHOOK_TOKEN` não configurado; 401 se token errado). ⚠️ ainda: SETAR o env + (melhoria) re-consultar `GET /payments/{id}` na Asaas.
- ✅ **C3 rotas bling abertas** — CORRIGIDO: `requireAdmin()` novo (`src/lib/require-admin.ts`) nos 4 handlers de `bling/sync` e `bling/import-customers`.
- ✅ **C4 desconto client-side** — CORRIGIDO junto com C1: os 10% do Pix são calculados no servidor; `discount` do cliente ignorado.
- ⚠️ **C5 RLS** — NÃO corrigível só no código. Falta: verificar policies no Supabase real + gravar `customer_id` no checkout (guest não tem). PENDENTE — verificar na fonte.
- 🟠 **A1 comissão afiliado** — parcial: agora usa `computedTotal` (não infla); FALTA mover o crédito pro webhook `paid` (hoje credita na criação).
- 🟠 **A6 deps** — `npm audit fix` não-breaking aplicado; restam 3 high + 2 moderate (sharp/libvips, mercadopago→uuid) que exigem upgrade major testado (`--force`).
- ⏳ Demais A/M/B: pendentes.
- **Falta antes de declarar OK:** teste real de checkout (pagar de verdade Pix+cartão e conferir valor no Asaas/Bling) + setar envs + verificar RLS no Supabase.

## 🔴 CRÍTICO — fechar ANTES de subir o site

### C1. Adulteração de preço no checkout (pagar R$0,01)
`src/app/api/checkout/route.ts:167-179, 227-228, 293`
O servidor NÃO recalcula nada: `total`, `subtotal`, `discount`, `shippingCost` e `unit_price (item.pixPrice ?? item.price)` vêm crus do `body` do cliente e viram a cobrança Asaas (`chargeBase.value = total`).
- **Explorar:** `POST /api/checkout` com `total: 0.01` e `items[].price: 0.01` → gera PIX/boleto de R$0,01.
- **Correção:** no servidor, buscar cada produto por `product_id` no Supabase, recalcular `subtotal = Σ preço_do_banco × qtd`, revalidar frete e desconto no servidor, `total ≥ 0`. Ignorar TODO valor monetário do cliente. Enviar ao Asaas só o total recalculado.

### C2. Webhook Asaas aceita "pago" forjado (auth opcional)
`src/app/api/webhooks/asaas/route.ts:31-34`
`if (process.env.ASAAS_WEBHOOK_TOKEN && token !== ...)` — se a env NÃO estiver setada (está vazia no `.env.example`), a checagem é PULADA e qualquer POST é aceito. O corpo é confiado sem consultar a Asaas.
- **Explorar:** `POST /api/webhooks/asaas` com `{payment:{externalReference:"<orderId>", status:"RECEIVED", id:"x"}}` → marca pedido `paid` sem pagar (dispara CAPI/email). O `orderId` é o `data.orderId` devolvido ao cliente no checkout.
- **Correção:** falhar FECHADO — rejeitar 401 se a env não estiver configurada (token sempre obrigatório). Idealmente, re-consultar `GET /payments/{id}` na Asaas pra confirmar o status real antes de gravar.

### C3. Rotas `api/bling/*` sem autenticação usando service_role (bypassa RLS)
`src/app/api/bling/sync/route.ts:56,244` e `src/app/api/bling/import-customers/route.ts:44,145`
Ambas usam `createAdminClient()` (service_role) e NÃO exigem sessão.
- **Explorar:** `POST /api/bling/sync` → sobrescreve `products`/`product_skus`/`stock_qty` (adultera preço/estoque) e martela a API Bling (DoS/custo). `POST /api/bling/import-customers` → puxa TODA a base de contatos (PII em massa). GETs vazam logs/contagens.
- **Correção:** exigir sessão admin (mesma checagem `admin_users` do middleware) no início de cada handler.

### C4. Cupom/desconto 100% no cliente
`src/app/admin/cupons/page.tsx:30,69` + `checkout/route.ts:176`
Não existe API de cupom — cupons vivem em `localStorage`; o `discount` é aceito do body sem validar.
- **Explorar:** enviar `discount: 999999` (total negativo) ou reusar código infinitas vezes.
- **Correção:** tabela `coupons` + endpoint que valida (ativo, `min_value`, `usage_limit`, `expires_at`) e recalcula o desconto no servidor. `discount` nunca vindo do cliente.

### C5. ⚠️ VERIFICAR — RLS de `orders`/`customers`/`affiliates` pode estar aberta
`supabase/schema.sql:209-210` (política SELECT de `orders` = dono via `customer_id`), mas o checkout (`checkout/route.ts:185-214`) **nunca grava `customer_id`**. As páginas admin leem tabelas sensíveis com a **publishable key** (pública no bundle JS) — o middleware só bloqueia a navegação, não o REST do Supabase.
- **Risco:** se a RLS em produção estiver permissiva (provável, pra o site funcionar via anon), qualquer visitante pega a chave pública do JS e lê nome/email/CPF/telefone/endereço de TODOS os pedidos/clientes direto no REST.
- **Correção:** (a) gravar `customer_id` no checkout; (b) confirmar no Supabase real que `orders`/`customers`/`affiliates`/`abandoned_carts` têm policies owner-scoped e que leitura administrativa passa por rota server-side com service_role — não pela publishable key no browser. **Verificar na fonte (Supabase), não só no código.**

---

## 🟠 ALTO

### A1. Comissão de afiliado inflável e prematura
`checkout/route.ts:244-249` — `commission = total × pct/100` usa o `total` manipulável e credita na CRIAÇÃO do pedido (`pending`), não no pagamento.
- **Correção:** creditar comissão só no webhook `paid`, sobre o total recalculado no servidor.

### A2. IDOR na API de rastreio
`src/app/api/shipping/tracking/route.ts:15-53` — `GET ?orderId=` lê o pedido por id sem sessão/dono e ainda faz `UPDATE orders ... .eq("id", orderId)`.
- **Correção:** exigir sessão + validar dono, ou casar `orderId + email`; nunca UPDATE com id arbitrário.

### A3. Endpoints de e-mail abertos (phishing/spam pelo seu domínio)
`src/app/api/abandoned-cart/route.ts:4-30` (sem auth; `name`, `items`, `cartUrl` controlados pelo atacante → link de phishing saindo do seu Resend) e `src/app/api/email/post-purchase/route.ts` (sem o guard `CRON_SECRET` que as outras rotas de email têm).
- **Correção:** exigir `Bearer CRON_SECRET`/sessão, rate-limit, e nunca aceitar URL externa no corpo.

### A4. Rotas de IA sem auth nem rate-limit (abuso de custo Anthropic)
`src/app/api/ai/{recommendations,size-recommendation,stylist}/route.ts` chamam o modelo Anthropic sem qualquer trava.
- **Explorar:** loop de POSTs = conta de API explode (DoS financeiro).
- **Correção:** rate-limit por IP/sessão + captcha; validar body.

### A5. `api/bling/push-order` sem auth
`src/app/api/bling/push-order/route.ts:5-16` — aceita `orderId` arbitrário e empurra pedido ao Bling (spam/duplicatas no ERP).
- **Correção:** exigir auth (chamada só interna) + idempotência via `bling_order_id`.

### A6. Dependências com vulnerabilidades HIGH (`npm audit --omit=dev`)
`next` (SSRF/DoS/cache), `postcss` (XSS/path traversal), `sharp`/libvips (CVE), `nanoid` (loop infinito) — todas com fix.
- **Correção:** `npm audit fix` (next/postcss/sharp/nanoid sem breaking). `uuid`/`mercadopago` (moderate) exigem `--force`/upgrade major — testar.

### A7. Zero validação de input nas rotas de API
Nenhuma rota valida o body (sem zod/schema); `await req.json()` é consumido direto.
- **Correção:** schema (zod) em toda rota + rate-limit global nas caras (checkout, IA, email).

---

## 🟡 MÉDIO

- **M1. Injeção de HTML em e-mail** — `checkout/route.ts confirmationEmailHtml` e demais rotas de email interpolam `customer.name`/`item.name` no HTML sem escape. → escapar variáveis.
- **M2. XSS armazenado (`dangerouslySetInnerHTML`)** — `blog/[slug]/page.tsx:105` (`post.content`) e `produto/[id]/page.tsx:532` (`product.description` do sync Bling). Fonte admin/integração, mas sanitizar com DOMPurify/sanitize-html.
- **M3. Sem cabeçalhos de segurança** — `next.config.js` sem `headers()`: faltam CSP, X-Frame-Options, HSTS, X-Content-Type-Options. → adicionar `headers()`.
- **M4. Dados sensíveis em query params** — `pedido-confirmado/page.tsx:12-15` (código PIX/URL boleto na URL → histórico/Referer/logs); `rastreio/page.tsx:34` (`?email=`). → passar via POST/estado.
- **M5. Filter injection PostgREST** — `admin/clientes/page.tsx:87` interpola busca crua no `.or()`. Admin-only, mas sanitizar vírgula/parênteses.
- **M6. Webhook MercadoPago sem validação de assinatura** — `webhooks/mercadopago/route.ts` re-busca o pagamento na API (bom) mas não valida `x-signature`. → adicionar HMAC.
- **M7. Fraude de contadores** — `api/affiliate/click` e `api/product/view` incrementam sem dedupe/rate-limit. → dedupe por IP/sessão.

## 🟢 BAIXO
- **B1. PII em logs** — `email/birthday/route.ts:93`, `reorder/route.ts:133` logam email do cliente.
- **B2. `meus-pedidos/page.tsx`** guarda pedidos completos (CPF/endereço) em `localStorage`.
- **B3. Open-redirect leve** — `shipping/tracking` reflete `code` numa `trackingUrl` retornada.

---

## ✅ O que está OK (não mexer)
- **Segredos:** nenhum hardcoded em `src/`; `.env.example` só com placeholders; `.gitignore` cobre `.env`/`.env*.local`/`.next`/`node_modules`. Nenhum `.env` real no git.
- **`NEXT_PUBLIC_*`:** todos legítimos (URL Supabase, anon/publishable key, IDs de analytics). `SUPABASE_SERVICE_ROLE_KEY` é server-only (`src/lib/supabase/admin.ts`).
- **Middleware:** `src/middleware.ts:72-88` protege `/admin/*` (login + `admin_users`, server-side). Crons/emails principais checam `Bearer CRON_SECRET`.
- **`next.config`:** `remotePatterns` com hosts específicos (sem `**`), sem `dangerouslyAllowSVG`, `typescript.ignoreBuildErrors: false`.
- **Backend Express** (`backend/`): usa `helmet()` e CORS restrito a `FRONTEND_URL`.
- **SSRF:** todos os `fetch` usam bases fixas (Asaas/Melhor Envio/Bling), sem URL do usuário.

---

## Ordem de ataque (o que fechar primeiro)
1. **C2** (webhook forjável = pago grátis) — trocar pra fail-closed. *(rápido)*
2. **C1** (pagar R$0,01) — recalcular preço/total/frete no servidor.
3. **C4** (cupom server-side) — junto com C1.
4. **C3** (auth nas `api/bling/*`).
5. **C5** (⚠️ verificar RLS no Supabase + gravar `customer_id`).
6. **A1–A7** (comissão no pago, IDOR rastreio, fechar rotas de email/IA, `npm audit fix`, validação zod).
7. **M/B** (headers, escape de email, sanitizar HTML, assinatura MercadoPago, etc.).

**Padrão-raiz que se repete:** o servidor confia em dados que vêm do cliente/externos sem revalidar (preço, desconto, frete, "pago", orderId). O princípio de correção é único: **nunca confiar no input — recalcular/reconferir no servidor a partir do banco ou da fonte externa.**
