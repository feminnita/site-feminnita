import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { email, name, items, total, cartUrl } = await req.json();

    if (!email || !items?.length) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const itemsList = items
      .map((i: any) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee">
            ${i.quantity}× ${i.name}
            ${i.selectedColor ? `<span style="color:#999;font-size:12px"> — ${i.selectedColor}</span>` : ""}
          </td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">
            R$ ${(i.price * i.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </td>
        </tr>
      `)
      .join("");

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "contato@feminnita.com.br",
      to: email,
      subject: "Você esqueceu algo no seu carrinho 🛍️",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#8C2F39;padding:24px;text-align:center">
            <h1 style="color:white;margin:0;letter-spacing:4px">FEMINNITA</h1>
          </div>
          <div style="padding:32px">
            <h2>Ei, ${name || "você"}! Seu carrinho está esperando 👀</h2>
            <p style="color:#666">Você adicionou itens ao seu carrinho mas não finalizou a compra. Ainda está disponível!</p>

            <table style="width:100%;border-collapse:collapse;margin:24px 0">
              ${itemsList}
              <tr>
                <td style="padding:12px 8px;font-weight:bold;font-size:16px">Total</td>
                <td style="padding:12px 8px;font-weight:bold;font-size:16px;text-align:right;color:#8C2F39">
                  R$ ${total?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </table>

            <div style="text-align:center;margin:32px 0">
              <a href="${cartUrl || "https://feminnita.com.br/carrinho"}"
                 style="background:#8C2F39;color:white;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                FINALIZAR MINHA COMPRA
              </a>
            </div>

            <div style="background:#fdf8f0;border:1px solid #D4A956;border-radius:8px;padding:16px;text-align:center">
              <p style="margin:0;color:#8C2F39;font-weight:bold">💳 10% de desconto no PIX</p>
              <p style="margin:4px 0 0;color:#666;font-size:13px">Pague com PIX e economize ainda mais</p>
            </div>

            <p style="color:#999;font-size:12px;text-align:center;margin-top:24px">
              Não quer receber esses e-mails? <a href="#" style="color:#999">Cancelar inscrição</a>
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Abandoned cart email error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
