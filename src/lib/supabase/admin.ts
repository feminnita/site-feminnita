import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Cliente service-role: ignora RLS. Uso EXCLUSIVO em rotas server-side de
// importação/sync (Bling). Nunca importar em código que roda no browser.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
