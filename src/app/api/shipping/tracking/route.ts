import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ME_BASE = "https://melhorenvio.com.br/api/v2";

function meHeaders() {
  return {
    Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
    Accept: "application/json",
    "User-Agent": "Feminnita/1.0 (feminnita@gmail.com)",
  };
}

// GET /api/shipping/tracking?orderId=xxx
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  const trackingCode = req.nextUrl.searchParams.get("code");

  try {
    const supabase = await createClient();

    let meOrderId = req.nextUrl.searchParams.get("meOrderId");

    if (orderId && !meOrderId) {
      const { data: order } = await supabase
        .from("orders")
        .select("me_order_id, tracking_code")
        .eq("id", orderId)
        .single();
      meOrderId = order?.me_order_id || null;
    }

    if (!meOrderId && !trackingCode) {
      return NextResponse.json({ error: "meOrderId or trackingCode required" }, { status: 400 });
    }

    // Track via Melhor Envio
    if (meOrderId) {
      const res = await fetch(`${ME_BASE}/me/shipment/tracking`, {
        method: "POST",
        headers: { ...meHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ orders: [meOrderId] }),
      });

      const data = await res.json();
      const tracking = data[meOrderId];

      // Update order with tracking code if available
      if (orderId && tracking?.tracking) {
        await supabase.from("orders").update({
          tracking_code: tracking.tracking,
          tracking_url: tracking.tracking ? `https://www.melhorrastreio.com.br/rastreio/${tracking.tracking}` : null,
        }).eq("id", orderId);
      }

      return NextResponse.json({
        status: tracking?.status || "unknown",
        tracking: tracking?.tracking || null,
        trackingUrl: tracking?.tracking ? `https://www.melhorrastreio.com.br/rastreio/${tracking.tracking}` : null,
        events: tracking?.tracking_history || [],
      });
    }

    // Fallback: direct Correios-style tracking URL
    return NextResponse.json({
      status: "unknown",
      tracking: trackingCode,
      trackingUrl: `https://www.melhorrastreio.com.br/rastreio/${trackingCode}`,
      events: [],
    });
  } catch (err: any) {
    console.error("Tracking error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
