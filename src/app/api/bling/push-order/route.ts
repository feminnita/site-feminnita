import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { blingPost } from "@/lib/bling";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    const supabase = await createClient();

    const { data: order } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

    const addr = order.shipping_address || {};

    const blingOrder = {
      numero: order.order_number,
      data: new Date(order.created_at).toISOString().slice(0, 10),
      dataSaida: new Date().toISOString().slice(0, 10),
      dataPrevista: null,
      totalProdutos: order.subtotal,
      totalDesconto: order.discount || 0,
      contato: {
        nome: order.customer_name,
        email: order.customer_email,
        cpfCnpj: (order.customer_cpf || "").replace(/\D/g, ""),
        telefone: (order.customer_phone || "").replace(/\D/g, ""),
        endereco: {
          endereco: addr.street || "",
          numero: addr.number || "S/N",
          complemento: addr.complement || "",
          bairro: addr.neighborhood || "",
          cep: (addr.cep || "").replace(/\D/g, ""),
          municipio: addr.city || "",
          uf: addr.state || "",
        },
      },
      itens: (order.items || []).map((item: any) => ({
        produto: {
          codigo: item.sku_code || "",
          descricao: item.product_name,
          valor: item.unit_price,
        },
        quantidade: item.quantity,
        valor: item.unit_price,
        desconto: 0,
      })),
      parcelas: [
        {
          dataVencimento: new Date().toISOString().slice(0, 10),
          valor: order.total,
          formaPagamento: {
            descricao:
              order.payment_method === "pix"
                ? "PIX"
                : order.payment_method === "boleto"
                ? "Boleto"
                : "Cartão de Crédito",
          },
        },
      ],
      transporte: {
        fretePorConta: "D",
        frete: order.shipping_cost || 0,
        codigoRastreamento: order.tracking_code || "",
      },
      observacoes: `Pedido via site Feminnita | ${order.payment_method?.toUpperCase()} | ID: ${order.id}`,
    };

    const result = await blingPost("/pedidos/vendas", blingOrder);
    const blingOrderId = result?.data?.id;

    if (blingOrderId) {
      await supabase
        .from("orders")
        .update({ bling_order_id: blingOrderId })
        .eq("id", orderId);
    }

    return NextResponse.json({ ok: true, blingOrderId });
  } catch (err: any) {
    console.error("Bling push-order error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
