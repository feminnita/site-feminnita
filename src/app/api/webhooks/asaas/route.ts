import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMetaEvent } from "@/lib/meta-capi";

// Map Asaas payment status → our internal status
const STATUS_MAP: Record<string, string> = {
  CONFIRMED: "paid",
  RECEIVED: "paid",
  RECEIVED_IN_CASH: "paid",
  OVERDUE: "overdue",
  REFUNDED: "refunded",
  REFUND_REQUESTED: "refunded",
  CHARGEBACK_REQUESTED: "disputed",
  CHARGEBACK_DISPUTE: "disputed",
  AWAITING_CHARGEBACK_REVERSAL: "disputed",
  DUNNING_REQUESTED: "pending",
  DUNNING_RECEIVED: "paid",
  AWAITING_RISK_ANALYSIS: "pending",
};

const ORDER_STATUS_MAP: Record<string, string> = {
  CONFIRMED: "confirmed",
  RECEIVED: "confirmed",
  RECEIVED_IN_CASH: "confirmed",
  OVERDUE: "pending",
  REFUNDED: "cancelled",
};

export async function POST(req: NextRequest) {
  // Validate webhook token — FAIL-CLOSED: se o token não estiver configurado, REJEITA
  // (antes: a checagem era pulada quando o env faltava, permitindo webhook "pago" forjado).
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expectedToken) {
    console.error("[asaas webhook] ASAAS_WEBHOOK_TOKEN não configurado — rejeitando (fail-closed)");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const token = req.headers.get("asaas-access-token");
  if (token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, payment } = body;

    if (!payment?.externalReference) {
      // Not an order payment we track
      return NextResponse.json({ ok: true });
    }

    const supabase = await createClient();
    const orderId = payment.externalReference;
    const paymentStatus = STATUS_MAP[payment.status] || "pending";
    const orderStatus = ORDER_STATUS_MAP[payment.status];

    const updateData: Record<string, any> = {
      payment_status: paymentStatus,
      asaas_payment_id: payment.id,
    };

    if (orderStatus) updateData.status = orderStatus;

    // Log the event
    console.log(`Asaas webhook: ${event} | order ${orderId} | status ${payment.status}`);

    // Status ANTERIOR (antes de gravar), pra detectar a transição pending -> paid e disparar o CAPI só 1x
    const { data: prevOrder } = await supabase
      .from("orders")
      .select("payment_status")
      .eq("id", orderId)
      .single();
    const wasPaid = prevOrder?.payment_status === "paid";

    await supabase.from("orders").update(updateData).eq("id", orderId);

    // Meta CAPI Purchase — SÓ na transição pra pago (dinheiro real), event_id = orders.id (dedup c/ pixel do navegador).
    // Cobre Pix/boleto (que o navegador NÃO dispara) e o cartão (deduplica com o disparo do navegador).
    if (paymentStatus === "paid" && !wasPaid) {
      try {
        const { data: order } = await supabase
          .from("orders")
          .select("id, order_number, total, customer_email, customer_name, customer_phone")
          .eq("id", orderId)
          .single();
        if (order) {
          const { data: oItems } = await supabase
            .from("order_items")
            .select("product_id, quantity, unit_price")
            .eq("order_id", orderId);
          const contents = (oItems || [])
            .filter((it: any) => it.product_id)
            .map((it: any) => ({
              id: String(it.product_id),
              quantity: it.quantity,
              item_price: Number(it.unit_price),
            }));
          const nameParts = (order.customer_name || "").trim().split(/\s+/);
          await sendMetaEvent({
            eventName: "Purchase",
            eventId: String(order.id),
            eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://feminnita.com.br"}/pedido-confirmado`,
            email: order.customer_email || undefined,
            phone: order.customer_phone || undefined,
            firstName: nameParts[0] || undefined,
            lastName: nameParts.slice(1).join(" ") || undefined,
            value: Number(order.total),
            currency: "BRL",
            contents,
          });
        }
      } catch (capiErr) {
        console.error("Meta CAPI (non-fatal):", capiErr);
      }
    }

    // For confirmed payments, trigger post-purchase email
    if (paymentStatus === "paid") {
      const { data: order } = await supabase
        .from("orders")
        .select("customer_email, customer_name, order_number, id")
        .eq("id", orderId)
        .single();

      if (order) {
        // Fire post-purchase email (non-blocking)
        fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "https://feminnita.com.br"}/api/email/post-purchase`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id }),
          }
        ).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Asaas webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
