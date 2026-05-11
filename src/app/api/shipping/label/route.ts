import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ME_BASE = "https://melhorenvio.com.br/api/v2";

function meHeaders() {
  return {
    Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Feminnita/1.0 (feminnita@gmail.com)",
  };
}

// POST /api/shipping/label — add order to Melhor Envio cart, purchase and generate label
export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const supabase = await createClient();

    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    const addr = order.shipping_address as any;

    // 1. Add to cart
    const cartBody = {
      service: order.shipping_service_id || 1, // Correios PAC default
      agency: null,
      from: {
        name: "Feminnita",
        phone: process.env.FEMINNITA_PHONE || "11999999999",
        email: "pedidos@feminnita.com.br",
        document: process.env.FEMINNITA_CNPJ || "",
        address: process.env.FEMINNITA_ADDRESS || "Rua Exemplo",
        complement: process.env.FEMINNITA_COMPLEMENT || null,
        number: process.env.FEMINNITA_NUMBER || "100",
        district: process.env.FEMINNITA_DISTRICT || "Centro",
        city: process.env.FEMINNITA_CITY || "São Paulo",
        country_id: "BR",
        postal_code: process.env.FEMINNITA_CEP || "01310100",
        state_abbr: process.env.FEMINNITA_STATE || "SP",
      },
      to: {
        name: order.customer_name,
        phone: order.customer_phone || "",
        email: order.customer_email,
        document: order.customer_cpf || "",
        address: addr.street,
        complement: addr.complement || null,
        number: addr.number,
        district: addr.neighborhood,
        city: addr.city,
        country_id: "BR",
        postal_code: addr.cep?.replace(/\D/g, ""),
        state_abbr: addr.state,
      },
      products: order.order_items.map((item: any) => ({
        name: item.product_name,
        quantity: item.quantity,
        unitary_value: item.unit_price,
      })),
      volumes: [
        {
          height: 5,
          width: 20,
          length: 30,
          weight: 0.5 * order.order_items.reduce((s: number, i: any) => s + i.quantity, 0),
        },
      ],
      options: {
        insurance_value: order.total,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: false,
      },
    };

    const cartRes = await fetch(`${ME_BASE}/me/cart`, {
      method: "POST",
      headers: meHeaders(),
      body: JSON.stringify(cartBody),
    });

    if (!cartRes.ok) {
      const err = await cartRes.text();
      return NextResponse.json({ error: `Melhor Envio cart error: ${err}` }, { status: 400 });
    }

    const cartData = await cartRes.json();
    const meOrderId = cartData.id;

    // 2. Checkout (purchase) the label
    const checkoutRes = await fetch(`${ME_BASE}/me/shipment/checkout`, {
      method: "POST",
      headers: meHeaders(),
      body: JSON.stringify({ orders: [meOrderId] }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      return NextResponse.json({ error: `Melhor Envio checkout error: ${err}` }, { status: 400 });
    }

    // 3. Generate label
    const labelRes = await fetch(`${ME_BASE}/me/shipment/generate`, {
      method: "POST",
      headers: meHeaders(),
      body: JSON.stringify({ orders: [meOrderId] }),
    });

    // 4. Get label URL
    const printRes = await fetch(`${ME_BASE}/me/shipment/print`, {
      method: "POST",
      headers: meHeaders(),
      body: JSON.stringify({ mode: "private", orders: [meOrderId] }),
    });

    const printData = await printRes.json();
    const labelUrl = printData.url || null;

    // 5. Update order with ME id and label url
    await supabase.from("orders").update({
      me_order_id: meOrderId,
      label_url: labelUrl,
      status: "label_generated",
    }).eq("id", orderId);

    return NextResponse.json({ meOrderId, labelUrl });
  } catch (err: any) {
    console.error("Label generation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
