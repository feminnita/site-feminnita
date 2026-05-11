import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { orderId } = await req.json();

    if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

    const supabase = await createClient();

    // Fetch order with items
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order || order.payment_status !== "paid") {
      return NextResponse.json({ error: "Order not found or not paid" }, { status: 404 });
    }

    // Get recommended products (different from purchased categories)
    const purchasedProductIds = order.order_items.map((i: any) => i.product_id).filter(Boolean);
    const { data: recommended } = await supabase
      .from("products")
      .select("id, name, price, pix_price, images, slug")
      .eq("active", true)
      .not("id", "in", `(${purchasedProductIds.join(",") || "null"})`)
      .order("created_at", { ascending: false })
      .limit(3);

    const firstName = order.customer_name?.split(" ")[0] || "você";

    const recommendedHtml =
      recommended && recommended.length > 0
        ? `
      <div style="margin-top:32px">
        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:0 0 16px">Você também pode gostar</h3>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${recommended
            .map(
              (p: any) => `
            <div style="flex:1;min-width:150px;max-width:180px">
              <a href="https://feminnita.com.br/produto/${p.id}" style="text-decoration:none;color:inherit">
                ${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" style="width:100%;aspect-ratio:2/3;object-fit:cover;border-radius:8px;display:block"/>` : ""}
                <p style="margin:8px 0 4px;font-size:13px;font-weight:600">${p.name}</p>
                <p style="margin:0;font-size:14px;font-weight:bold;color:#8C2F39">R$ ${fmtBRL(p.pix_price)}</p>
              </a>
            </div>
          `
            )
            .join("")}
        </div>
      </div>`
        : "";

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "pedidos@feminnita.com.br",
      to: order.customer_email,
      subject: `Seu pedido #${order.order_number} foi confirmado! 🎉`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A">
          <div style="background:#8C2F39;padding:28px;text-align:center">
            <h1 style="color:white;margin:0;font-size:28px;letter-spacing:6px;font-weight:900">FEMINNITA</h1>
          </div>
          <div style="padding:36px 32px">
            <h2 style="margin:0 0 8px">Pagamento confirmado! ✅</h2>
            <p style="color:#666;margin:0 0 24px">Olá, ${firstName}! Seu pedido foi pago e já está sendo preparado para envio.</p>

            <div style="background:#FAF6F2;border-radius:8px;padding:20px;margin-bottom:24px">
              <p style="margin:0 0 6px;font-size:13px;color:#666">PEDIDO</p>
              <p style="margin:0;font-size:22px;font-weight:bold;color:#8C2F39">#${order.order_number}</p>
            </div>

            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-bottom:24px">
              <p style="margin:0;font-size:14px;color:#15803d">
                📦 <strong>Próximos passos:</strong> Você receberá um email com o código de rastreio assim que seu pedido for despachado.
              </p>
            </div>

            ${recommendedHtml}

            <div style="text-align:center;margin-top:32px">
              <a href="https://feminnita.com.br/produtos"
                 style="background:#8C2F39;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
                CONTINUAR COMPRANDO
              </a>
            </div>

            <div style="border-top:2px solid #FAF6F2;margin-top:32px;padding-top:24px">
              <p style="color:#666;font-size:13px;margin:0">Dúvidas? contato@feminnita.com.br</p>
            </div>
          </div>
        </div>
      `,
    });

    // Mark post-purchase email as sent
    await supabase
      .from("orders")
      .update({ post_purchase_email_sent: true })
      .eq("id", orderId);

    return NextResponse.json({ sent: true });
  } catch (err: any) {
    console.error("Post-purchase email error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
