import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/LandingPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lançamentos | Feminnita",
  description: "Confira as novidades da Feminnita. As últimas peças de moda fitness feminina acabaram de chegar.",
};

export const revalidate = 300;

export default async function LancamentosPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price, pix_price, images, category, slug")
    .eq("is_new", true)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <LandingPage
      theme="launch"
      title="LANÇAMENTOS"
      subtitle="As novidades mais recentes chegaram"
      badge="Nova coleção"
      accentColor="#8C2F39"
      products={products || []}
    />
  );
}
