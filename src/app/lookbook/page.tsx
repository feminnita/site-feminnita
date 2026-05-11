import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lookbook | Feminnita",
  description: "Inspire-se com os looks da Feminnita. Composições completas de moda fitness para o seu treino.",
};

export const revalidate = 3600;

export default async function LookbookPage() {
  const supabase = await createClient();
  const { data: looks } = await supabase
    .from("lookbook_entries")
    .select("id, slug, title, cover_image, season, products_featured")
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light mb-2">Lookbook</h1>
          <p className="text-gray-500">Composições completas para cada momento do seu dia</p>
        </div>

        {!looks?.length ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-xl mb-2">Em breve</p>
            <p className="text-sm">Novos looks chegando!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {looks.map((look: any, i: number) => (
              <Link
                key={look.id}
                href={`/lookbook/${look.slug}`}
                className={`group relative overflow-hidden rounded-xl ${
                  i === 0 ? "col-span-2 md:col-span-1 md:row-span-2" : ""
                }`}
              >
                <div className={`relative bg-gray-100 ${i === 0 ? "aspect-[3/4]" : "aspect-[2/3]"}`}>
                  {look.cover_image && (
                    <Image
                      src={look.cover_image}
                      alt={look.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    {look.season && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1">
                        {look.season}
                      </p>
                    )}
                    <h3 className="font-light text-lg leading-tight">{look.title}</h3>
                    {look.products_featured > 0 && (
                      <p className="text-xs text-white/60 mt-1">{look.products_featured} peças</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
