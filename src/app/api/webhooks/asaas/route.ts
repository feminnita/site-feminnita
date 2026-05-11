import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  // Validate webhook token
  const token = req.headers.get("asaas-access-token");
  if (process.env.ASAAS_WEBHOOK_TOKEN && token !== process.env.ASAAS_WEBHOOK_TOKEN) {
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

    await supabase.from("orders").update(updateData).eq("id", orderId);

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
