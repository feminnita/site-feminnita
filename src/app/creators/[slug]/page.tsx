import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { ShoppingCart } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("creators").select("name, bio, avatar_url").eq("slug", slug).single();
  if (!data) return {};
  return {
    title: `${data.name} × Feminnita`,
    description: data.bio || `Seleção exclusiva de ${data.name} na Feminnita`,
    openGraph: { images: data.avatar_url ? [data.avatar_url] : [] },
  };
}

export default async function CreatorPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: creator } = await supabase
    .from("creators")
    .select("*, creator_products(product_id, position, note, products(id, name, price, pix_price, images, category))")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!creator) notFound();

  const products = (creator.creator_products || [])
    .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    .map((cp: any) => ({ ...cp.products, note: cp.note }))
    .filter(Boolean);

  const accentColor = creator.accent_color || "#8C2F39";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Creator Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)` }}>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-xl shrink-0">
              {creator.avatar_url ? (
                <Image src={creator.avatar_url} alt={creator.name} fill sizes="144px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white" style={{ background: accentColor }}>
                  {creator.name[0]}
                </div>
              )}
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
                Seleção exclusiva
              </p>
              <h1 className="text-3xl font-bold mb-2">{creator.name}</h1>
              {creator.bio && <p className="text-gray-600 max-w-lg">{creator.bio}</p>}
              <div className="flex gap-3 mt-4 justify-center md:justify-start">
                {creator.instagram && (
                  <a href={`https://instagram.com/${creator.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    @{creator.instagram}
                  </a>
                )}
                {creator.tiktok && (
                  <a href={`https://tiktok.com/@${creator.tiktok}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-800">
                    TikTok @{creator.tiktok}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-light">
            Favoritos de <span className="font-semibold">{creator.name.split(" ")[0]}</span>
          </h2>
          <span className="text-sm text-gray-400">{products.length} peças selecionadas</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: any) => (
            <div key={product.id} className="group">
              <Link href={`/produto/${product.id}?ref=${creator.slug}`}>
                <div className="relative aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
                  <Image
                    src={product.images?.[0] || ""}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.note && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                      <p className="text-white text-xs font-medium">{product.note}</p>
                    </div>
                  )}
                </div>
              </Link>
              <p className="text-sm font-medium truncate mb-1">{product.name}</p>
              <div className="flex items-center justify-between">
                <div>
                  {product.price > product.pix_price && (
                    <p className="text-xs text-gray-400 line-through">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                  )}
                  <p className="font-bold text-sm" style={{ color: accentColor }}>
                    R$ {product.pix_price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <CreatorAddToCart product={product} accentColor={accentColor} creatorSlug={creator.slug} />
              </div>
            </div>
          ))}
        </div>

        {creator.promo_code && (
          <div className="mt-12 bg-gray-50 rounded-2xl p-6 text-center border border-dashed">
            <p className="text-sm text-gray-500 mb-2">Cupom exclusivo de {creator.name.split(" ")[0]}</p>
            <p className="text-2xl font-bold tracking-widest" style={{ color: accentColor }}>{creator.promo_code}</p>
            <p className="text-xs text-gray-400 mt-1">Use no checkout para obter o desconto</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Client component for add-to-cart button
function CreatorAddToCart({ product, accentColor, creatorSlug }: { product: any; accentColor: string; creatorSlug: string }) {
  // This runs server-side and renders a form/link instead of interactive button
  // The actual cart logic needs to be a client component, so we'll use a Link to the product page
  return (
    <Link
      href={`/produto/${product.id}?ref=${creatorSlug}`}
      className="p-2 rounded-lg text-white hover:opacity-80 transition-opacity"
      style={{ backgroundColor: accentColor }}
    >
      <ShoppingCart size={15} />
    </Link>
  );
}
