import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { blingGet } from "@/lib/bling";

// Lista paginada de contatos do Bling (dados básicos)
async function fetchAllContatos(): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const data = await blingGet("/contatos", {
      pagina: String(page),
      limite: "100",
    });
    const items = data?.data || [];
    if (!items.length) break;
    all.push(...items);
    if (items.length < 100) break;
    page++;
  }
  return all;
}

// Detalhe do contato (endereço, data de nascimento, tipos de contato)
async function fetchContatoDetail(id: number): Promise<any> {
  try {
    const data = await blingGet(`/contatos/${id}`);
    return data?.data || {};
  } catch {
    return {};
  }
}

// Importa só quem é Cliente. Se o contato não tiver tipos definidos, importa
// mesmo assim (desde que tenha e-mail); exclui quem é só Fornecedor/Transportador.
function isCliente(detail: any): boolean {
  const tipos: any[] = detail.tiposContato || [];
  if (!tipos.length) return true;
  return tipos.some((t) => (t?.descricao || "").toLowerCase().includes("cliente"));
}

export async function POST(_req: NextRequest) {
  let supabase: ReturnType<typeof createAdminClient>;
  try {
    supabase = createAdminClient();
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }

  let created = 0, updated = 0, skipped = 0, errors = 0;

  try {
    const contatos = await fetchAllContatos();

    for (const item of contatos) {
      try {
        const detail = await fetchContatoDetail(item.id);
        const c = { ...item, ...detail };

        const email = (c.email || "").trim().toLowerCase();
        if (!email) { skipped++; continue; }          // customers.email é NOT NULL/UNIQUE
        if (!isCliente(c)) { skipped++; continue; }    // só clientes

        const phone = c.celular || c.telefone || null;
        const cpf = c.tipo === "F" ? (c.numeroDocumento || null) : null;
        const birthDate = /^\d{4}-\d{2}-\d{2}$/.test(c.dataNascimento || "")
          ? c.dataNascimento
          : null;

        const payload: any = {
          name: c.nome || "Cliente",
          email,
          phone,
          cpf,
          birth_date: birthDate,
          bling_id: item.id,
        };

        // Upsert por e-mail (chave única natural da tabela)
        const { data: existing } = await supabase
          .from("customers")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        let customerId: string;
        if (existing) {
          await supabase.from("customers").update(payload).eq("id", existing.id);
          customerId = existing.id;
          updated++;
        } else {
          const { data: inserted } = await supabase
            .from("customers")
            .insert(payload)
            .select("id")
            .single();
          customerId = inserted?.id;
          created++;
        }

        // Endereço principal (só insere se o cliente ainda não tiver nenhum)
        const geral = c.endereco?.geral || {};
        if (customerId && geral.cep && geral.endereco) {
          const { count } = await supabase
            .from("addresses")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", customerId);

          if (!count) {
            await supabase.from("addresses").insert({
              customer_id: customerId,
              cep: String(geral.cep),
              street: geral.endereco,
              number: String(geral.numero || "S/N"),
              complement: geral.complemento || null,
              neighborhood: geral.bairro || "—",
              city: geral.municipio || "—",
              state: geral.uf || "—",
              is_default: true,
            });
          }
        }

        await new Promise((r) => setTimeout(r, 150)); // respeita rate limit do Bling
      } catch (itemErr) {
        console.error(`Bling import-customers erro no contato ${item.id}:`, itemErr);
        errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: contatos.length,
      created,
      updated,
      skipped,
      errors,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true });
    return NextResponse.json({ customers: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
