import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Verifica sessão admin (mesma regra do middleware: usuário logado + linha em admin_users)
// para proteger rotas de API sensíveis que usam service_role.
// Retorna `null` se autorizado; caso contrário, um NextResponse de erro pra dar `return`.
export async function requireAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
