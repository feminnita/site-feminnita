import { NextRequest, NextResponse } from "next/server";
import { saveBlingTokens } from "@/lib/bling";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/admin/integracoes?bling=error&msg=${error || "sem_codigo"}`, req.url)
    );
  }

  const ok = await saveBlingTokens(code);

  if (!ok) {
    return NextResponse.redirect(
      new URL("/admin/integracoes?bling=error&msg=token_falhou", req.url)
    );
  }

  // Trigger initial sync after connecting
  fetch(new URL("/api/bling/sync", req.url).toString(), { method: "POST" }).catch(() => {});

  return NextResponse.redirect(new URL("/admin/integracoes?bling=success", req.url));
}
