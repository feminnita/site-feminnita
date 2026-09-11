import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// ── Asaas API helper ──────────────────────────────────────────────────────────
const ASAAS_BASE =
  process.env.ASAAS_SANDBOX === "true"
    ? "https://sandbox.asaas.com/api/v3"
    : "https://api.asaas.com/api/v3";

async function asaasPost(path: string, body: object) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: process.env.ASAAS_API_KEY || "",
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = (json.errors as any[])?.[0]?.description || `Asaas ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

async function asaasGet(path: string) {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    headers: { access_token: process.env.ASAAS_API_KEY || "" },
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = (json.errors as any[])?.[0]?.description || `Asaas ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// Find or create Asaas customer
async function ensureAsaasCustomer(customer: {
  name: string;
  email: string;
  cpf?: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
}) {
  // Try to find existing customer by email
  const search = await asaasGet(`/customers?email=${encodeURIComponent(customer.email)}&limit=1`);
  if (search.data?.length > 0) return search.data[0].id as string;

  const payload: Record<string, any> = {
    name: customer.name,
    email: customer.email,
    notificationDisabled: false,
  };
  if (customer.cpf) payload.cpfCnpj = customer.cpf.replace(/\D/g, "");
  if (customer.phone) payload.mobilePhone = customer.phone.replace(/\D/g, "");
  if (customer.cep) payload.postalCode = customer.cep.replace(/\D/g, "");
  if (customer.street) payload.address = customer.street;
  if (customer.number) payload.addressNumber = customer.number;
  if (customer.complement) payload.complement = customer.complement;
  if (customer.neighborhood) payload.province = customer.neighborhood;

  const created = await asaasPost("/customers", payload);
  return created.id as string;
}

// ISO date string for due date (today + N days)
function dueDateStr(days = 1) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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
      shippingCost,
      installments,
      affiliate_code,
    } = body;
    // NOTA DE SEGURANÇA: subtotal/discount/total/preços do cliente são IGNORADOS de propósito.
    // Tudo que é dinheiro é recalculado no servidor abaixo, a partir do banco.

    const supabase = await createClient();
    const orderNumber = generateOrderNumber();

    // ── SEGURANÇA: recalcula TODO valor monetário no servidor (nunca confiar no cliente) ──
    const rawIds = (items || []).map((i: any) => i.id).filter(Boolean);
    if (!rawIds.length) {
      return NextResponse.json({ error: "Carrinho vazio ou inválido" }, { status: 400 });
    }
    const { data: dbProducts } = await supabase
      .from("products")
      .select("id, base_price, pix_price, sale_price")
      .in("id", rawIds);
    const priceById = new Map((dbProducts || []).map((p: any) => [p.id, p]));

    let computedSubtotal = 0;
    const secureItems = (items || []).map((item: any) => {
      const p = priceById.get(item.id);
      if (!p) throw new Error(`Produto inválido no carrinho: ${item.id}`);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const cardPrice = Number(p.sale_price ?? p.base_price);
      const unit = paymentMethod === "pix" ? Number(p.pix_price ?? cardPrice) : cardPrice;
      computedSubtotal += unit * qty;
      // sobrescreve price/pixPrice com o valor do banco (email e afins mostram o autoritativo)
      return { ...item, quantity: qty, price: unit, pixPrice: unit, __unitPrice: unit };
    });
    computedSubtotal = +computedSubtotal.toFixed(2);

    // Frete: clamp ≥ 0 (revalidar contra /api/shipping/calculate = melhoria futura). Desconto: 10% no Pix (mesma regra do front), no SERVIDOR.
    const safeShipping = Math.max(0, Number(shippingCost) || 0);
    const computedDiscount = paymentMethod === "pix" ? +(computedSubtotal * 0.1).toFixed(2) : 0;
    const computedTotal = +(computedSubtotal + safeShipping - computedDiscount).toFixed(2);
    if (computedTotal <= 0) {
      return NextResponse.json({ error: "Total inválido" }, { status: 400 });
    }

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
        subtotal: computedSubtotal,
        shipping_cost: safeShipping,
        discount: computedDiscount,
        total: computedTotal,
        shipping_method: selectedShipping?.name || null,
        affiliate_code: affiliate_code || null,
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
    const orderItems = secureItems.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.id || null,
      product_name: item.name,
      product_image: item.images?.[0] || item.image || null,
      color: item.selectedColor || null,
      size: item.selectedSize || null,
      quantity: item.quantity,
      unit_price: item.__unitPrice,
      total_price: +(item.__unitPrice * item.quantity).toFixed(2),
    }));

    await supabase.from("order_items").insert(orderItems);

    // 3. Atualiza totais do afiliado (non-fatal)
    if (affiliate_code) {
      try {
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id, total_orders, total_revenue, total_commission, commission_pct")
          .eq("code", affiliate_code.toUpperCase())
          .eq("active", true)
          .single();

        if (aff) {
          const commission = computedTotal * (aff.commission_pct / 100);
          await supabase.from("affiliates").update({
            total_orders:    (aff.total_orders    ?? 0) + 1,
            total_revenue:   (aff.total_revenue   ?? 0) + computedTotal,
            total_commission:(aff.total_commission?? 0) + commission,
          }).eq("id", aff.id);
        }
      } catch (affErr) {
        console.error("Affiliate update error (non-fatal):", affErr);
      }
    }

    // 4. Send confirmation email (non-fatal)
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "pedidos@feminnita.com.br",
        to: customer.email,
        subject: `Pedido #${orderNumber} recebido — Feminnita 🎉`,
        html: confirmationEmailHtml(orderNumber, customer.name, secureItems, computedTotal, paymentMethod),
      });
    } catch (emailErr) {
      console.error("Confirmation email error (non-fatal):", emailErr);
    }

    // 4. Payment processing via Asaas
    const response: any = {
      orderId: orderData.id,
      orderNumber,
      paymentMethod,
      total: computedTotal,
      status: "pending",
    };

    if (process.env.ASAAS_API_KEY) {
      try {
        const asaasCustomerId = await ensureAsaasCustomer({
          name: customer.name,
          email: customer.email,
          cpf: customer.cpf,
          phone: customer.phone,
          cep: customer.cep,
          street: customer.street,
          number: customer.number,
          complement: customer.complement,
          neighborhood: customer.neighborhood,
        });

        const chargeBase: Record<string, any> = {
          customer: asaasCustomerId,
          value: computedTotal,
          description: `Pedido ${orderNumber} — Feminnita`,
          externalReference: orderData.id,
          postalService: false,
        };

        if (paymentMethod === "pix") {
          const charge = await asaasPost("/payments", {
            ...chargeBase,
            billingType: "PIX",
            dueDate: dueDateStr(1),
          });

          const pixData = await asaasGet(`/payments/${charge.id}/pixQrCode`);

          // Persist Asaas charge ID
          await supabase
            .from("orders")
            .update({ asaas_payment_id: charge.id })
            .eq("id", orderData.id);

          response.pixQrCode = pixData.payload;
          response.pixQrCodeBase64 = pixData.encodedImage;
          response.pixExpiration = pixData.expirationDate;
          response.asaasChargeId = charge.id;

        } else if (paymentMethod === "boleto") {
          const charge = await asaasPost("/payments", {
            ...chargeBase,
            billingType: "BOLETO",
            dueDate: dueDateStr(3),
          });

          await supabase
            .from("orders")
            .update({ asaas_payment_id: charge.id })
            .eq("id", orderData.id);

          response.boletoUrl = charge.bankSlipUrl;
          response.boletoBarCode = charge.nossoNumero || null;
          response.boletoDueDate = charge.dueDate;
          response.asaasChargeId = charge.id;

        } else if (paymentMethod === "card") {
          const { card } = body; // { holderName, number, expiryMonth, expiryYear, ccv }
          const numInstallments = parseInt(installments) || 1;

          const charge = await asaasPost("/payments", {
            ...chargeBase,
            billingType: "CREDIT_CARD",
            dueDate: dueDateStr(0),
            installmentCount: numInstallments > 1 ? numInstallments : undefined,
            installmentValue: numInstallments > 1 ? +(computedTotal / numInstallments).toFixed(2) : undefined,
            creditCard: {
              holderName: card?.holderName || customer.name,
              number: card?.number?.replace(/\s/g, ""),
              expiryMonth: card?.expiryMonth,
              expiryYear: card?.expiryYear,
              ccv: card?.ccv,
            },
            creditCardHolderInfo: {
              name: customer.name,
              email: customer.email,
              cpfCnpj: (customer.cpf || "").replace(/\D/g, ""),
              postalCode: (customer.cep || "").replace(/\D/g, ""),
              addressNumber: customer.number || "S/N",
              phone: (customer.phone || "").replace(/\D/g, ""),
            },
          });

          await supabase
            .from("orders")
            .update({
              asaas_payment_id: charge.id,
              payment_status: charge.status === "CONFIRMED" ? "paid" : "pending",
            })
            .eq("id", orderData.id);

          response.cardApproved = charge.status === "CONFIRMED";
          response.cardStatus = charge.status;
          response.asaasChargeId = charge.id;
          if (charge.status === "CONFIRMED") response.status = "paid";
        }
      } catch (asaasErr: any) {
        console.error("Asaas error (non-fatal, order saved):", asaasErr);
        // Order is saved — return it without payment data; webhook will update later
        response.paymentError = asaasErr.message;
      }
    } else {
      // No API key yet — return friendly placeholders
      if (paymentMethod === "pix") {
        response.pixQrCode = null;
        response.pixMessage = "PIX em configuração — você receberá o QR Code por email em breve.";
      }
      if (paymentMethod === "boleto") {
        response.boletoMessage = "Boleto em configuração — link chegará por email em breve.";
      }
      if (paymentMethod === "card") {
        response.cardApproved = true;
      }
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
