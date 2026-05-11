import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { height, weight, bust, waist, hip, referenceSize, referenceBrand, category } = await req.json();

    if (!height || !weight) {
      return NextResponse.json({ error: "Altura e peso são obrigatórios" }, { status: 400 });
    }

    const prompt = `Você é especialista em moda fitness feminina da Feminnita. Com base nas medidas abaixo, indique o tamanho ideal e dê uma explicação curta e gentil em português.

Tabela de medidas Feminnita:
- PP: busto 78-82cm, cintura 60-64cm, quadril 84-88cm
- P: busto 83-87cm, cintura 65-69cm, quadril 89-93cm
- M: busto 88-92cm, cintura 70-74cm, quadril 94-98cm
- G: busto 93-97cm, cintura 75-79cm, quadril 99-103cm
- GG: busto 98-102cm, cintura 80-84cm, quadril 104-108cm
- XG: busto 103-108cm, cintura 85-90cm, quadril 109-114cm

Informações da cliente:
- Altura: ${height}cm
- Peso: ${weight}kg
${bust ? `- Busto: ${bust}cm` : ""}
${waist ? `- Cintura: ${waist}cm` : ""}
${hip ? `- Quadril: ${hip}cm` : ""}
${referenceSize && referenceBrand ? `- Usa tamanho ${referenceSize} na ${referenceBrand}` : ""}
${category ? `- Categoria: ${category}` : ""}

Responda em JSON com:
{
  "size": "M",
  "confidence": "alta|média|baixa",
  "explanation": "texto explicativo de 1-2 frases, gentil e encorajador",
  "fitNote": "dica de ajuste se houver (ex: se busto maior, pode precisar de G nos tops)",
  "alternative": "tamanho alternativo se estiver entre dois tamanhos (ou null)"
}`;

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 400,
      thinking: { type: "adaptive" },
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content.find((b) => b.type === "text")?.text || "";
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("Size recommendation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
