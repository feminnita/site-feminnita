import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/require-admin";
import { blingGet } from "@/lib/bling";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 200);
}

async function fetchAllBlingProducts(): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const data = await blingGet("/produtos", {
      pagina: String(page),
      limite: "100",
      situacao: "A", // apenas ativos
    });
    const items = data?.data || [];
    if (!items.length) break;
    all.push(...items);
    if (items.length < 100) break;
    page++;
  }
  return all;
}

async function fetchProductDetail(id: number): Promise<any> {
  try {
    const data = await blingGet(`/produtos/${id}`);
    return data?.data || {};
  } catch {
    return {};
  }
}

async function fetchProductStock(id: number): Promise<number> {
  try {
    const data = await blingGet(`/estoques`, { idProduto: String(id) });
    const deposits = data?.data || [];
    return deposits.reduce((sum: number, d: any) => sum + (d.saldoVirtual || 0), 0);
  } catch {
    return 0;
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }

  // Create sync log entry
  const { data: logEntry } = await supabase
    .from("bling_sync_log")
    .insert({ status: "running" })
    .select()
    .single();
  const logId = logEntry?.id;

  let created = 0, updated = 0, errors = 0;

  try {
    const products = await fetchAllBlingProducts();

    for (const item of products) {
      try {
        const detail = await fetchProductDetail(item.id);
        const stock = await fetchProductStock(item.id);

        // ── Prices ──
        const basePrice = parseFloat(detail.preco || item.preco || "0");
        const promoPrice = parseFloat(detail.precoPromocional || "0") || null;
        const pixPrice = parseFloat((basePrice * 0.9).toFixed(2));

        // ── Images ── (NÃO importa do Bling: imagens são refeitas manualmente pela Feminnita)
        const images: string[] = [];

        // ── Weight & dimensions ──
        const weightKg = parseFloat(detail.pesoBruto || "0.3") || 0.3;
        const height = parseFloat(detail.dimensoes?.altura || "5") || 5;
        const width = parseFloat(detail.dimensoes?.largura || "15") || 15;
        const length = parseFloat(detail.dimensoes?.comprimento || "20") || 20;

        // ── Variations (colors + sizes) ──
        const variations: any[] = detail.variacoes || [];
        const colorsSet = new Set<string>();
        const sizesSet = new Set<string>();
        const skus: { size: string; color: string; sku_code: string; stock_qty: number }[] = [];

        for (const v of variations) {
          const atributos: any[] = v.produto?.variacao?.nome?.split(";") || [];
          let color = "";
          let size = "";

          // Bling format: "Cor:Azul;Tamanho:M"
          for (const attr of v.produto?.variacao?.nome?.split(";") || []) {
            const [key, val] = attr.split(":").map((s: string) => s.trim());
            if (key?.toLowerCase().includes("cor")) color = val || "";
            else if (key?.toLowerCase().includes("tamanho") || key?.toLowerCase().includes("tam")) size = val || "";
            else if (!color) color = val || ""; // fallback
          }

          if (color) colorsSet.add(color);
          if (size) sizesSet.add(size);

          skus.push({
            size,
            color,
            sku_code: v.produto?.codigo || "",
            stock_qty: parseFloat(v.produto?.estoque?.saldoVirtual || "0") || 0,
          });
        }

        // ── Category ──
        let categoryId: string | null = null;
        const catName = detail.categoria?.descricao || "";
        if (catName) {
          const catSlug = slugify(catName);
          const { data: existing } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", catSlug)
            .single();
          if (existing) {
            categoryId = existing.id;
          } else {
            const { data: newCat } = await supabase
              .from("categories")
              .insert({ name: catName, slug: catSlug, active: true })
              .select()
              .single();
            categoryId = newCat?.id || null;
          }
        }

        const name = detail.nome || item.nome || "Produto";
        const code = detail.codigo || item.codigo || "";
        const slug = `${slugify(name)}-${code}`.replace(/-+$/, "");

        const payload = {
          name,
          slug,
          description: detail.descricaoCurta || detail.descricao || null,
          code: code || null,
          category_id: categoryId,
          base_price: basePrice,
          pix_price: pixPrice,
          sale_price: promoPrice,
          stock,
          active: detail.situacao === "A",
          featured: false,
          is_new: false,
          is_bestseller: false,
          images,
          weight_kg: weightKg,
          pkg_height_cm: height,
          pkg_width_cm: width,
          pkg_length_cm: length,
          colors: Array.from(colorsSet),
          sizes: Array.from(sizesSet),
          size_chart: {},
          bling_id: item.id,
        };

        // Upsert product
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("bling_id", item.id)
          .single();

        let productId: string;
        if (existing) {
          await supabase.from("products").update(payload).eq("bling_id", item.id);
          productId = existing.id;
          updated++;
        } else {
          const { data: inserted } = await supabase
            .from("products")
            .insert(payload)
            .select()
            .single();
          productId = inserted?.id;
          created++;
        }

        // Upsert SKUs
        for (const sku of skus) {
          if (sku.size || sku.color) {
            await supabase.from("product_skus").upsert({
              product_id: productId,
              size: sku.size,
              color: sku.color,
              sku_code: sku.sku_code || null,
              stock_qty: sku.stock_qty,
            }, { onConflict: "product_id,size,color" });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 150));
      } catch (itemErr: any) {
        console.error(`Bling sync error for product ${item.id}:`, itemErr);
        errors++;
      }
    }

    // Update log
    if (logId) {
      await supabase.from("bling_sync_log").update({
        finished_at: new Date().toISOString(),
        products_synced: products.length,
        products_created: created,
        products_updated: updated,
        errors,
        status: "done",
      }).eq("id", logId);
    }

    return NextResponse.json({ ok: true, created, updated, errors, total: products.length });
  } catch (err: any) {
    if (logId) {
      await supabase.from("bling_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "error",
        errors: 1,
      }).eq("id", logId);
    }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("bling_sync_log")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5);
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}
