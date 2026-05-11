import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Black Friday Feminnita | Até 60% OFF",
  description: "Black Friday Feminnita: os maiores descontos do ano em moda fitness feminina. Não perca!",
};

export const revalidate = 60;

export default async function BlackFridayPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, pix_price, images, category, slug")
    .eq("active", true)
    .order("discount_percent", { ascending: false })
    .limit(32);

  return (
    <LandingPage
      theme="black-friday"
      title="BLACK FRIDAY"
      subtitle="Os maiores descontos do ano"
      badge="Até 60% OFF"
      accentColor="#111111"
      products={products || []}
      countdown={new Date("2025-11-29T23:59:59")}
    />
  );
}
