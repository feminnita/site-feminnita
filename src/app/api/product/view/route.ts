import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ ok: false });

    const supabase = await createClient();

    const { data: product } = await supabase
      .from("products")
      .select("id, view_count")
      .eq("id", productId)
      .single();

    if (!product) return NextResponse.json({ ok: false });

    await supabase
      .from("products")
      .update({ view_count: (product.view_count ?? 0) + 1 })
      .eq("id", productId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
