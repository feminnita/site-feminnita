import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

// Called daily by /api/cron/email-automations to send birthday discounts
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = await createClient();

    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find customers with birthday today who haven't received a coupon this year
    const { data: customers } = await supabase
      .from("customers")
      .select("id, name, email, birthday")
      .not("birthday", "is", null)
      .not("email", "is", null)
      .filter("birthday_month", "eq", month)
      .filter("birthday_day", "eq", day);

    if (!customers?.length) return NextResponse.json({ sent: 0 });

    let sent = 0;

    for (const customer of customers) {
      // Generate birthday coupon code
      const couponCode = `ANIVERSARIO${customer.id.toString().slice(-4).toUpperCase()}`;
      const firstName = customer.name?.split(" ")[0] || "você";

      // Save coupon to Supabase
      await supabase.from("coupons").upsert({
        code: couponCode,
        type: "percent",
        value: 15,
        customer_email: customer.email,
        expires_at: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(), // end of birth month
        single_use: true,
        used: false,
      });

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "contato@feminnita.com.br",
          to: customer.email,
          subject: `Feliz aniversário, ${firstName}! 🎂 Seu presente especial`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1A1A1A">
              <div style="background:linear-gradient(135deg,#8C2F39,#C41E3A);padding:40px;text-align:center">
                <p style="color:white;font-size:36px;margin:0">🎂</p>
                <h1 style="color:white;margin:8px 0 0;font-size:28px;letter-spacing:4px">FEMINNITA</h1>
              </div>
              <div style="padding:40px 32px;text-align:center">
                <h2 style="font-size:28px;margin:0 0 8px">Feliz aniversário, ${firstName}!</h2>
                <p style="color:#666;font-size:16px;margin:0 0 32px">Você merece se presentear no seu dia especial ✨</p>

                <div style="background:#FAF6F2;border:2px dashed #8C2F39;border-radius:12px;padding:28px;margin:0 auto 32px;max-width:360px">
                  <p style="margin:0 0 8px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px">Seu presente</p>
                  <p style="margin:0 0 8px;font-size:48px;font-weight:900;color:#8C2F39">15%</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#666">de desconto em qualquer compra</p>
                  <div style="background:#8C2F39;color:white;padding:12px 24px;border-radius:8px;display:inline-block">
                    <p style="margin:0;font-size:11px;letter-spacing:2px;text-transform:uppercase">Cupom</p>
                    <p style="margin:4px 0 0;font-size:22px;font-weight:bold;letter-spacing:3px">${couponCode}</p>
                  </div>
                  <p style="margin:12px 0 0;font-size:12px;color:#999">Válido até o final deste mês</p>
                </div>

                <a href="https://feminnita.com.br/produtos"
                   style="background:#8C2F39;color:white;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
                  USAR MEU PRESENTE
                </a>

                <p style="margin-top:32px;color:#999;font-size:12px">
                  Use o cupom <strong>${couponCode}</strong> no checkout.<br/>
                  Desconto válido em toda a loja, não cumulativo com outras promoções.
                </p>
              </div>
              <div style="background:#FAF6F2;padding:16px;text-align:center">
                <p style="margin:0;font-size:12px;color:#999">Feminnita Moda Fitness — contato@feminnita.com.br</p>
              </div>
            </div>
          `,
        });
        sent++;
      } catch (e) {
        console.error(`Birthday email failed for ${customer.email}:`, e);
      }
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error("Birthday email cron error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
