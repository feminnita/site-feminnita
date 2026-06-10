import { createClient } from "@/lib/supabase/server";
import { BLING_CLIENT_ID, BLING_CLIENT_SECRET, BLING_REDIRECT_URI } from "@/lib/bling-config";

export { BLING_CLIENT_ID, BLING_CLIENT_SECRET, BLING_REDIRECT_URI };

const BLING_BASE = "https://api.bling.com.br/Api/v3";

// ── Token management ─────────────────────────────────────────────────────────

export async function getBlingToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bling_tokens")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  // Refresh if expiring in less than 5 minutes
  if (new Date(data.expires_at) < new Date(Date.now() + 5 * 60 * 1000)) {
    return refreshBlingToken(data.refresh_token);
  }

  return data.access_token;
}

export async function refreshBlingToken(refreshToken: string): Promise<string | null> {
  const res = await fetch(`${BLING_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;
  const json = await res.json();

  const supabase = await createClient();
  await supabase.from("bling_tokens").upsert({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scope: json.scope,
    updated_at: new Date().toISOString(),
  });

  return json.access_token;
}

export async function saveBlingTokens(code: string): Promise<boolean> {
  const res = await fetch(`${BLING_BASE}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${BLING_CLIENT_ID}:${BLING_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: BLING_REDIRECT_URI,
    }),
  });

  if (!res.ok) return false;
  const json = await res.json();

  const supabase = await createClient();
  await supabase.from("bling_tokens").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("bling_tokens").insert({
    access_token: json.access_token,
    refresh_token: json.refresh_token,
    expires_at: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scope: json.scope,
  });

  return true;
}

// ── API helper ───────────────────────────────────────────────────────────────

export async function blingGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const token = await getBlingToken();
  if (!token) throw new Error("Bling não autenticado");

  const url = new URL(`${BLING_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Bling API ${res.status}`);
  }
  return res.json();
}

export async function blingPost(path: string, body: object): Promise<any> {
  const token = await getBlingToken();
  if (!token) throw new Error("Bling não autenticado");

  const res = await fetch(`${BLING_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Bling API ${res.status}`);
  }
  return res.json();
}
