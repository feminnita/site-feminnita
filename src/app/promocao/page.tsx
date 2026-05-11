import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Promoção | Feminnita",
  description: "As melhores ofertas em moda fitness feminina. Aproveite os descontos exclusivos Feminnita.",
};

export const revalidate = 300;

export default async function PromocaoPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, pix_price, images, category, slug")
    .eq("on_sale", true)
    .eq("active", true)
    .order("discount_percent", { ascending: false })
    .limit(24);

  return (
    <LandingPage
      theme="promo"
      title="PROMOÇÃO"
      subtitle="Peças selecionadas com desconto especial"
      badge="Oferta por tempo limitado"
      accentColor="#C41E3A"
      products={products || []}
    />
  );
}
