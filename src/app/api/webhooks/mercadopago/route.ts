import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();

    // MP sends notifications for different topics
    if (body.type !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) return NextResponse.json({ ok: true });

    // Fetch full payment details from MP
    const paymentClient = new Payment(mp);
    const payment = await paymentClient.get({ id: paymentId });

    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ ok: true });

    const supabase = await createClient();

    // Map MP status to our status
    const statusMap: Record<string, { status: string; payment_status: string }> = {
      approved: { status: "paid", payment_status: "paid" },
      rejected: { status: "pending", payment_status: "failed" },
      cancelled: { status: "cancelled", payment_status: "failed" },
      refunded: { status: "cancelled", payment_status: "refunded" },
    };

    const newStatus = statusMap[payment.status || ""] || null;
    if (!newStatus) return NextResponse.json({ ok: true });

    // Update order
    await supabase.from("orders").update(newStatus).eq("id", orderId);

    // Send email on payment approval
    if (payment.status === "approved") {
      const { data: order } = await supabase
        .from("orders")
        .select(`*, customer:customers(name, email), items:order_items(*)`)
        .eq("id", orderId)
        .single();

      if (order?.customer?.email) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "pedidos@feminnita.com.br",
          to: order.customer.email,
          subject: `Pagamento confirmado — Pedido #${order.order_number}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#8C2F39;padding:24px;text-align:center">
                <h1 style="color:white;margin:0;letter-spacing:4px">FEMINNITA</h1>
              </div>
              <div style="padding:32px">
                <h2>Pagamento confirmado! ✅</h2>
                <p>Olá, ${order.customer.name.split(" ")[0]}!</p>
                <p>Seu pagamento foi aprovado e o pedido <strong>#${order.order_number}</strong> está sendo processado.</p>
                <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0">
                  <p style="margin:0;color:#166534;font-weight:bold">✓ Pagamento aprovado</p>
                  <p style="margin:4px 0 0;color:#166534">Em breve você receberá o código de rastreamento.</p>
                </div>
                <p style="color:#666;font-size:13px">Obrigado pela sua compra na Feminnita!</p>
              </div>
            </div>
          `,
        }).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
