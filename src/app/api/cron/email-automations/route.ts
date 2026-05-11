import { NextRequest, NextResponse } from "next/server";

// Triggered daily by Vercel Cron (see vercel.json)
// Runs all email automation jobs in parallel
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://feminnita.com.br";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  const [birthdayRes, reorderRes] = await Promise.allSettled([
    fetch(`${base}/api/email/birthday`, { method: "POST", headers, body: "{}" }),
    fetch(`${base}/api/email/reorder`, { method: "POST", headers, body: "{}" }),
  ]);

  const results = {
    birthday: birthdayRes.status === "fulfilled" ? await birthdayRes.value.json() : { error: "failed" },
    reorder: reorderRes.status === "fulfilled" ? await reorderRes.value.json() : { error: "failed" },
    timestamp: new Date().toISOString(),
  };

  console.log("Email automation cron results:", results);
  return NextResponse.json(results);
}
