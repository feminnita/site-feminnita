import { NextRequest, NextResponse } from "next/server";

const MELHOR_ENVIO_URL = process.env.MELHOR_ENVIO_SANDBOX === "true"
  ? "https://sandbox.melhorenvio.com.br"
  : "https://melhorenvio.com.br";

// CEP de origem da loja (Nova Friburgo/RJ - configure conforme seu endereço)
const ORIGIN_CEP = process.env.STORE_CEP || "28600000";

export async function POST(req: NextRequest) {
  try {
    const { cep, products } = await req.json();

    if (!cep || cep.replace(/\D/g, "").length !== 8) {
      return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
    }

    // If no ME token, return fallback options
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return NextResponse.json({ options: getFallbackOptions(cep) });
    }

    // Calculate total weight and dimensions from products
    const totalWeight = products?.reduce((sum: number, p: any) =>
      sum + (p.weight || 0.3) * p.quantity, 0) || 0.5;

    const payload = {
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: cep.replace(/\D/g, "") },
      package: {
        height: 10,
        width: 20,
        length: 30,
        weight: Math.max(totalWeight, 0.1),
      },
      options: {
        insurance_value: 0,
        receipt: false,
        own_hand: false,
      },
      services: "1,2,3,4,7,8", // PAC, SEDEX, Mini, Jadlog, etc.
    };

    const response = await fetch(`${MELHOR_ENVIO_URL}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        "User-Agent": "Feminnita E-commerce (contato@feminnita.com.br)",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Melhor Envio error:", await response.text());
      return NextResponse.json({ options: getFallbackOptions(cep) });
    }

    const data = await response.json();

    const options = data
      .filter((s: any) => !s.error && s.price)
      .map((s: any) => ({
        id: String(s.id),
        name: s.name,
        company: s.company?.name || "",
        price: parseFloat(s.price),
        delivery_time: `${s.delivery_time} dias úteis`,
        logo: s.company?.picture || null,
      }))
      .sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({ options: options.length > 0 ? options : getFallbackOptions(cep) });
  } catch (err) {
    console.error("Shipping error:", err);
    return NextResponse.json({ options: getFallbackOptions("") });
  }
}

function getFallbackOptions(_cep: string) {
  return [
    { id: "pac", name: "PAC", company: "Correios", price: 19.9, delivery_time: "8-12 dias úteis" },
    { id: "sedex", name: "SEDEX", company: "Correios", price: 32.9, delivery_time: "3-5 dias úteis" },
    { id: "jadlog", name: "Jadlog .Package", company: "Jadlog", price: 14.9, delivery_time: "7-10 dias úteis" },
  ];
}
