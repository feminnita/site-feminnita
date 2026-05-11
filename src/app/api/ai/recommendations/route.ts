import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { viewedProducts, cartProducts, currentProductId, allProducts } = await req.json();

    const catalog = (allProducts as any[])
      .slice(0, 80)
      .map((p: any) => `ID:${p.id}|${p.name}|${p.category}|R$${p.pixPrice ?? p.pix_price ?? p.price}`)
      .join("\n");

    const context = [
      viewedProducts?.length ? `Produtos visualizados: ${viewedProducts.slice(-8).join(", ")}` : "",
      cartProducts?.length ? `No carrinho: ${cartProducts.map((p: any) => p.name).join(", ")}` : "",
      currentProductId ? `Produto atual: ${currentProductId}` : "",
    ].filter(Boolean).join("\n");

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 300,
      thinking: { type: "adaptive" },
      messages: [{
        role: "user",
        content: `Baseado no comportamento desta cliente de moda fitness, selecione 4 IDs de produtos mais relevantes do catálogo.

Contexto:
${context}

Catálogo:
${catalog}

Responda apenas com JSON: {"ids": ["id1","id2","id3","id4"], "reason": "frase curta explicando a seleção"}
Prefira variedade de categorias. Não repita produtos do carrinho.`,
      }],
    });

    const text = message.content.find((b) => b.type === "text")?.text || "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{"ids":[]}');

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ ids: [], error: err.message }, { status: 500 });
  }
}
