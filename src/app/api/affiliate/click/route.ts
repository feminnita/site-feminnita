import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ ok: false });

    const supabase = await createClient();

    // Verifica se o afiliado existe e está ativo
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, total_clicks, active")
      .eq("code", code.toUpperCase())
      .single();

    if (!affiliate?.active) return NextResponse.json({ ok: false });

    // Incrementa total_clicks
    await supabase
      .from("affiliates")
      .update({ total_clicks: (affiliate.total_clicks ?? 0) + 1 })
      .eq("id", affiliate.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
