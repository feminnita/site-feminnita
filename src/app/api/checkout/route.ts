import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `FEM-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
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
      cardToken,
      installments,
    } = body;

    const supabase = await createClient();
    const orderNumber = generateOrderNumber();

    // 1. Save order to Supabase
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        status: "pending",
        payment_method: paymentMethod === "card" ? "credit_card" : paymentMethod,
        payment_status: "pending",
        subtotal,
        shipping_cost: shippingCost,
        discount,
        total,
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
      product_image: item.image || null,
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
    }));

    await supabase.from("order_items").insert(orderItems);

    // 3. Create Mercado Pago payment
    const paymentClient = new Payment(mp);
    const idempotencyKey = `${orderNumber}-${Date.now()}`;

    const mpPayload: any = {
      transaction_amount: total,
      description: `Pedido Feminnita #${orderNumber}`,
      external_reference: orderData.id,
      payer: {
        email: customer.email,
        first_name: customer.name.split(" ")[0],
        last_name: customer.name.split(" ").slice(1).join(" ") || customer.name,
        identification: {
          type: "CPF",
          number: customer.cpf.replace(/\D/g, ""),
        },
      },
    };

    if (paymentMethod === "pix") {
      mpPayload.payment_method_id = "pix";
      mpPayload.date_of_expiration = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (paymentMethod === "boleto") {
      mpPayload.payment_method_id = "bolbradesco";
      mpPayload.date_of_expiration = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (paymentMethod === "card") {
      mpPayload.token = cardToken;
      mpPayload.installments = parseInt(installments) || 1;
      mpPayload.payment_method_id = "visa"; // will be overridden by the token
    }

    const mpPayment = await paymentClient.create({
      body: mpPayload,
      requestOptions: { idempotencyKey },
    });

    // 4. Update order with MP payment ID
    await supabase
      .from("orders")
      .update({
        payment_status: mpPayment.status === "approved" ? "paid" : "pending",
        status: mpPayment.status === "approved" ? "paid" : "pending",
      })
      .eq("id", orderData.id);

    // 5. Send confirmation email
    try {
      const itemsList = items
        .map((i: any) => `<li>${i.quantity}× ${i.name} — R$ ${(i.price * i.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</li>`)
        .join("");

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "pedidos@feminnita.com.br",
        to: customer.email,
        subject: `Pedido #${orderNumber} recebido — Feminnita`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#8C2F39;padding:24px;text-align:center">
              <h1 style="color:white;margin:0;letter-spacing:4px">FEMINNITA</h1>
            </div>
            <div style="padding:32px">
              <h2>Olá, ${customer.name.split(" ")[0]}! 🎉</h2>
              <p>Seu pedido foi recebido com sucesso.</p>
              <div style="background:#f9f9f9;border-radius:8px;padding:20px;margin:20px 0">
                <p><strong>Pedido:</strong> #${orderNumber}</p>
                <p><strong>Total:</strong> R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                <p><strong>Forma de pagamento:</strong> ${paymentMethod === "pix" ? "PIX" : paymentMethod === "boleto" ? "Boleto" : "Cartão de Crédito"}</p>
              </div>
              <h3>Itens do pedido:</h3>
              <ul>${itemsList}</ul>
              <p style="color:#8C2F39;font-weight:bold">
                ${paymentMethod === "pix" ? "Realize o pagamento via PIX para confirmar seu pedido." :
                  paymentMethod === "boleto" ? "Seu boleto foi gerado. Pague até o vencimento para confirmar o pedido." :
                  "Pagamento aprovado! Seu pedido será processado em breve."}
              </p>
              <hr style="margin:24px 0"/>
              <p style="color:#666;font-size:13px">Dúvidas? Fale conosco pelo WhatsApp ou email contato@feminnita.com.br</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Email error (non-fatal):", emailErr);
    }

    // 6. Build response
    const response: any = {
      orderId: orderData.id,
      orderNumber,
      paymentMethod,
      total,
    };

    if (paymentMethod === "pix" && mpPayment.point_of_interaction?.transaction_data) {
      response.pixQrCode = mpPayment.point_of_interaction.transaction_data.qr_code;
      response.pixQrCodeBase64 = mpPayment.point_of_interaction.transaction_data.qr_code_base64;
    }

    if (paymentMethod === "boleto" && mpPayment.transaction_details) {
      response.boletoUrl = mpPayment.transaction_details.external_resource_url;
      response.boletoBarcode = (mpPayment as any).barcode?.content;
    }

    if (paymentMethod === "card") {
      response.cardApproved = mpPayment.status === "approved";
      response.cardStatusDetail = mpPayment.status_detail;
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
