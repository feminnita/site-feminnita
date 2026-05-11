import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_sku_availability")
    .select("size, color, available_qty, stock_status")
    .eq("product_id", id)
    .order("size");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || [], {
    headers: { "Cache-Control": "no-store" },
  });
}
