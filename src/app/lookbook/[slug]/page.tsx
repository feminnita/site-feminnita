import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ShopTheLook } from "@/components/ShopTheLook";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("lookbook_entries")
    .select("title, description, cover_image")
    .eq("slug", slug)
    .single();

  if (!data) return {};
  return {
    title: `${data.title} | Lookbook Feminnita`,
    description: data.description,
    openGraph: { images: data.cover_image ? [data.cover_image] : [] },
  };
}

export default async function LookbookEntryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: look } = await supabase
    .from("lookbook_entries")
    .select("*, lookbook_products(product_id, hotspot_x, hotspot_y, products(id, name, pix_price, images, category))")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!look) notFound();

  const products = (look.lookbook_products || [])
    .map((lp: any) => lp.products ? { ...lp.products, hotspot_x: lp.hotspot_x, hotspot_y: lp.hotspot_y } : null)
    .filter(Boolean);

  const hasHotspots = products.some((p: any) => p.hotspot_x != null && p.hotspot_y != null);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <nav className="text-sm text-gray-400 mb-8 flex gap-2">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/lookbook" className="hover:text-gray-600">Lookbook</Link>
          <span>/</span>
          <span className="text-gray-700">{look.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Image — with hotspots if available, plain otherwise */}
          {look.cover_image && (
            hasHotspots ? (
              <ShopTheLook image={look.cover_image} alt={look.title} products={products} />
            ) : (
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden">
                <Image
                  src={look.cover_image}
                  alt={look.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            )
          )}

          <div className="flex flex-col justify-center">
            {look.season && (
              <p className="text-xs font-semibold text-[#8C2F39] uppercase tracking-widest mb-3">
                {look.season}
              </p>
            )}
            <h1 className="text-3xl font-light mb-4">{look.title}</h1>
            {look.description && (
              <p className="text-gray-600 leading-relaxed mb-8">{look.description}</p>
            )}
            {look.gallery && look.gallery.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {look.gallery.slice(0, 3).map((img: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image src={img} alt={`${look.title} ${i + 1}`} fill sizes="128px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Products grid (always shown below) */}
        {products.length > 0 && (
          <div>
            <h2 className="text-xl font-light mb-6">Peças do look</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <Link key={product.id} href={`/produto/${product.id}`} className="group">
                  <div className="relative aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden mb-3">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-sm text-[#8C2F39] font-semibold">
                    R$ {product.pix_price?.toFixed(2).replace(".", ",")}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
