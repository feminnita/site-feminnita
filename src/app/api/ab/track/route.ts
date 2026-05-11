import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { experimentId, variant, goal, value } = await req.json();
    const supabase = await createClient();

    await supabase.from("ab_events").insert({
      experiment_id: experimentId,
      variant_id: variant,
      goal,
      value: value || null,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] || null,
      user_agent: req.headers.get("user-agent")?.slice(0, 200) || null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
