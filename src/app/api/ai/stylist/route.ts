import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type CartProduct = { id: string; name: string; category: string; price: number };

export async function POST(req: NextRequest) {
  try {
    const { message, products, history } = await req.json();

    // Build product catalog summary for context
    const catalog = (products as CartProduct[])
      .slice(0, 60)
      .map((p) => `ID:${p.id} | ${p.name} | ${p.category} | R$${p.price}`)
      .join("\n");

    const systemPrompt = `Você é a Nita, a estilista virtual da Feminnita — marca de moda fitness feminina premium.
Seu objetivo é montar looks e recomendar produtos do catálogo de forma personalizada e entusiasmada.

Regras:
- Sempre sugira produtos específicos do catálogo pelo ID (ex: [id:abc123])
- Monte looks completos (top + legging ou short) quando fizer sentido
- Seja calorosa, use emojis com moderação
- Pergunte sobre ocasião (academia, yoga, corrida, casual) e preferência de cor se não informado
- Responda em português do Brasil
- Se o usuário mencionar tamanho, incorpore na recomendação
- Máximo 3 produtos por sugestão para não sobrecarregar

Catálogo disponível (ID | Nome | Categoria | Preço):
${catalog}`;

    const messages = [
      ...(history || []),
      { role: "user" as const, content: message },
    ];

    const stream = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 600,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages,
      stream: true,
    });

    // Return SSE stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullText = "";
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, full: fullText })}\n\n`));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Stylist API error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
