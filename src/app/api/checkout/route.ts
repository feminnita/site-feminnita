import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `FEM-${ts}-${rand}`;
}

function fmtBRL(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

function confirmationEmailHtml(orderNumber: string, customerName: string, items: any[], total: number, paymentMethod: string) {
  const firstName = customerName.split(" ")[0];
  const itemsHtml = items
    .map(
      (i: any) => `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee">
          ${i.quantity}× ${i.name}
          ${i.selectedSize ? `<span style="color:#999;font-size:12px"> — Tam. ${i.selectedSize}</span>` : ""}
          ${i.selectedColor ? `<span style="color:#999;font-size:12px"> — ${i.selectedColor}</span>` : ""}
        </td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold">
          R$ ${fmtBRL(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const paymentNote =
    paymentMethod === "pix"
      ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0">
           <p style="margin:0;color:#16a34a;font-weight:bold;font-size:16px">✅ PIX gerado com sucesso</p>
           <p style="margin:6px 0 0;color:#15803d;font-size:14px">Use o QR Code ou copie o código PIX para concluir o pagamento. Válido por 24 horas.</p>
         </div>`
      : paymentMethod === "boleto"
      ? `<div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin:20px 0">
           <p style="margin:0;color:#854d0e;font-weight:bold">📄 Boleto gerado</p>
           <p style="margin:6px 0 0;color:#92400e;font-size:14px">Pague até o vencimento para confirmar seu pedido.</p>
         </div>`
      : `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin:20px 0">
           <p style="margin:0;color:#16a34a;font-weight:bold">💳 Pagamento aprovado!</p>
           <p style="margin:6px 0 0;color:#15803d;font-size:14px">Seu pedido será processado em breve.</p>
         </div>`;

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A">
      <div style="background:#8C2F39;padding:28px;text-align:center">
        <h1 style="color:white;margin:0;font-size:28px;letter-spacing:6px;font-weight:900">FEMINNITA</h1>
      </div>
      <div style="padding:36px 32px">
        <h2 style="margin:0 0 8px">Olá, ${firstName}! 🎉</h2>
        <p style="color:#666;margin:0 0 24px">Seu pedido foi recebido e está sendo processado.</p>

        <div style="background:#FAF6F2;border-radius:8px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 6px;font-size:13px;color:#666">NÚMERO DO PEDIDO</p>
          <p style="margin:0;font-size:22px;font-weight:bold;color:#8C2F39;letter-spacing:2px">#${orderNumber}</p>
        </div>

        ${paymentNote}

        <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#666;margin:24px 0 12px">Itens do pedido</h3>
        <table style="width:100%;border-collapse:collapse">
          ${itemsHtml}
          <tr>
            <td style="padding:14px 8px;font-weight:bold;font-size:16px">Total</td>
            <td style="padding:14px 8px;font-weight:bold;font-size:18px;text-align:right;color:#8C2F39">R$ ${fmtBRL(total)}</td>
          </tr>
        </table>

        <div style="border-top:2px solid #FAF6F2;margin-top:32px;padding-top:24px">
          <p style="color:#666;font-size:13px;margin:0">Dúvidas? Fale conosco:</p>
          <p style="margin:4px 0 0;font-size:13px">
            📱 WhatsApp: <a href="https://wa.me/5511999999999" style="color:#8C2F39">Clique aqui</a> &nbsp;|&nbsp;
            📧 contato@feminnita.com.br
          </p>
        </div>
      </div>
      <div style="background:#FAF6F2;padding:16px;text-align:center">
        <p style="margin:0;font-size:12px;color:#999">Feminnita Moda Fitness — contato@feminnita.com.br</p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const body = await req.json();
    const {
      customer,
      items,
      paymentMethod,
      selectedShipping,
      subtotal,
      shippingCost,
      discount,
      total,
      installments,
    } = body;

    const supabase = await createClient();
    const orderNumber = generateOrderNumber();

    // 1. Save order
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        customer_cpf: customer.cpf || null,
        status: "pending",
        payment_method: paymentMethod === "card" ? "credit_card" : paymentMethod,
        payment_status: "pending",
        installments: paymentMethod === "card" ? parseInt(installments) || 1 : null,
        subtotal,
        shipping_cost: shippingCost,
        discount,
        total,
        shipping_method: selectedShipping?.name || null,
        shipping_address: {
          street: customer.street,
          number: customer.number,
          complement: customer.complement || null,
          neighborhood: customer.neighborhood,
          city: customer.city,
          state: customer.state,
          cep: customer.cep,
        },
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Save order items
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id || null,
      product_name: item.name,
      product_image: item.images?.[0] || item.image || null,
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      quantity: item.quantity,
      unit_price: item.pixPrice ?? item.price,
      total_price: (item.pixPrice ?? item.price) * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    // 3. Send confirmation email (non-fatal)
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "pedidos@feminnita.com.br",
        to: customer.email,
        subject: `Pedido #${orderNumber} recebido — Feminnita 🎉`,
        html: confirmationEmailHtml(orderNumber, customer.name, items, total, paymentMethod),
      });
    } catch (emailErr) {
      console.error("Confirmation email error (non-fatal):", emailErr);
    }

    // 4. Payment processing — Asaas integration (coming soon)
    // For now, return order saved confirmation.
    // The Asaas charge creation will be added here once the API key is provided.
    const response: any = {
      orderId: orderData.id,
      orderNumber,
      paymentMethod,
      total,
      status: "pending",
    };

    // Placeholder responses so the checkout UI works correctly
    if (paymentMethod === "pix") {
      response.pixQrCode = "AGUARDANDO_INTEGRACAO_ASAAS";
      response.pixQrCodeBase64 = null;
      response.pixMessage = "Integração PIX em configuração. Em breve você receberá o QR Code por email.";
    }

    if (paymentMethod === "boleto") {
      response.boletoMessage = "Boleto em configuração. Em breve você receberá o link por email.";
    }

    if (paymentMethod === "card") {
      response.cardApproved = true;
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Erro ao processar pedido" },
      { status: 500 }
    );
  }
}
