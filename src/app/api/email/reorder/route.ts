import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// Called daily by /api/cron/email-automations
// Targets customers whose last order was exactly REORDER_DAYS_THRESHOLD days ago
const REORDER_DAYS_THRESHOLD = 45;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - REORDER_DAYS_THRESHOLD);
    const cutoffStart = new Date(cutoffDate);
    cutoffStart.setHours(0, 0, 0, 0);
    const cutoffEnd = new Date(cutoffDate);
    cutoffEnd.setHours(23, 59, 59, 999);

    // Find paid orders from exactly THRESHOLD days ago where no later order exists
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, total, order_items(product_id, product_name, product_image)")
      .eq("payment_status", "paid")
      .eq("reorder_email_sent", false)
      .gte("created_at", cutoffStart.toISOString())
      .lte("created_at", cutoffEnd.toISOString());

    if (!orders?.length) return NextResponse.json({ sent: 0 });

    let sent = 0;

    for (const order of orders) {
      if (!order.customer_email) continue;

      // Skip if customer has a more recent order
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_email", order.customer_email)
        .eq("payment_status", "paid")
        .gt("created_at", cutoffEnd.toISOString());

      if (count && count > 0) {
        await supabase.from("orders").update({ reorder_email_sent: true }).eq("id", order.id);
        continue;
      }

      // Fetch recommendations based on purchased product IDs
      const productIds = order.order_items.map((i: any) => i.product_id).filter(Boolean);
      const { data: recommended } = await supabase
        .from("products")
        .select("id, name, price, pix_price, images")
        .eq("active", true)
        .not("id", "in", `(${productIds.join(",") || "null"})`)
        .order("discount_percent", { ascending: false })
        .limit(3);

      const firstName = order.customer_name?.split(" ")[0] || "você";

      const recommendedHtml =
        recommended && recommended.length > 0
          ? recommended
              .map(
                (p: any) => `
              <div style="flex:1;min-width:150px;max-width:180px;text-align:center">
                <a href="https://feminnita.com.br/produto/${p.id}" style="text-decoration:none;color:inherit">
                  ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px;display:block"/>` : ""}
                  <p style="margin:8px 0 2px;font-size:13px;font-weight:600">${p.name}</p>
                  <p style="margin:0;font-size:14px;font-weight:bold;color:#8C2F39">R$ ${fmtBRL(p.pix_price)}</p>
                </a>
              </div>`
              )
              .join("")
          : "";

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "contato@feminnita.com.br",
          to: order.customer_email,
          subject: `${firstName}, sentimos sua falta! 😍 Novidades esperando por você`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A">
              <div style="background:#8C2F39;padding:28px;text-align:center">
                <h1 style="color:white;margin:0;font-size:28px;letter-spacing:6px;font-weight:900">FEMINNITA</h1>
              </div>
              <div style="padding:36px 32px">
                <h2 style="margin:0 0 8px">Olá, ${firstName}! Sentimos sua falta 💕</h2>
                <p style="color:#666;margin:0 0 24px">Faz um tempinho desde a sua última compra. Temos novidades lindas esperando por você!</p>

                ${
                  recommendedHtml
                    ? `<h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 16px">Selecionado para você</h3>
                       <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:32px">${recommendedHtml}</div>`
                    : ""
                }

                <div style="background:#FAF6F2;border:2px dashed #8C2F39;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                  <p style="margin:0 0 4px;font-size:14px;color:#666">Cupom exclusivo para você</p>
                  <p style="margin:0 0 8px;font-size:24px;font-weight:900;color:#8C2F39">VOLTEI10</p>
                  <p style="margin:0;font-size:13px;color:#666">10% de desconto na sua próxima compra</p>
                </div>

                <div style="text-align:center">
                  <a href="https://feminnita.com.br/produtos"
                     style="background:#8C2F39;color:white;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                    VER NOVIDADES
                  </a>
                </div>

                <p style="margin-top:24px;color:#999;font-size:12px;text-align:center">
                  Use o cupom <strong>VOLTEI10</strong> no checkout. Válido por 7 dias.<br/>
                  <a href="#" style="color:#999">Cancelar inscrição</a>
                </p>
              </div>
            </div>
          `,
        });

        await supabase.from("orders").update({ reorder_email_sent: true }).eq("id", order.id);
        sent++;
      } catch (e) {
        console.error(`Reorder email failed for ${order.customer_email}:`, e);
      }
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error("Reorder email cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
