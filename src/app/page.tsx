import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Newsletter } from "@/components/Newsletter";
import { InstagramFeed } from "@/components/InstagramFeed";
import { HeroCarousel } from "@/components/HeroCarousel";
import { createClient } from "@/lib/supabase/server";

async function getHomeProducts() {
  try {
    const supabase = await createClient();
    const { data: products } = await supabase
      .from("products")
      .select("*, product_variants(color, size), categories(name,slug)")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!products?.length) return { novidades: [], destaques: [], outlet: [] };

    const map = (p: any) => {
      const colors = [...new Set((p.product_variants ?? []).map((v: any) => v.color).filter(Boolean))];
      const sizes  = [...new Set((p.product_variants ?? []).map((v: any) => v.size).filter(Boolean))];
      const price  = p.base_price ?? 0;
      const pixPrice = p.pix_price ?? +(price * 0.9).toFixed(2);
      return {
        id: p.id, code: p.code ?? "", name: p.name, slug: p.slug,
        price, pixPrice,
        installments: price >= 50 ? 6 : 1,
        installmentPrice: +(price / (price >= 50 ? 6 : 1)).toFixed(2),
        images: Array.isArray(p.images) ? p.images : [],
        colors: colors.length ? colors : ["rose"],
        sizes:  sizes.length  ? sizes  : ["P","M","G"],
        category: p.categories?.name ?? "",
      };
    };

    return {
      novidades: products.filter((p) => p.is_new).slice(0, 4).map(map),
      destaques: products.filter((p) => p.featured || p.is_bestseller).slice(0, 4).map(map),
      outlet:    products.filter((p) => p.sale_price).slice(0, 4).map(map),
      all:       products.slice(0, 8).map(map),
    };
  } catch {
    return { novidades: [], destaques: [], outlet: [], all: [] };
  }
}

export default async function Home() {
  const { novidades, destaques, outlet, all } = await getHomeProducts() as any;
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Lançamentos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-light text-center mb-12">lançamentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(novidades.length ? novidades : all.slice(0,4)).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Banner Intermediário */}
      <section className="relative h-[400px] bg-gray-200">
        <Image
          src="https://ext.same-assets.com/2738959979/1774049605.webp"
          alt="Coleção Flowing"
          fill
          className="object-cover"
        />
      </section>

      {/* Mais Vendidos */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-light text-center mb-12">mais vendidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(destaques.length ? destaques : all.slice(0,4)).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Vídeo */}
      <section className="bg-black py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-12 text-white">nossa essência</h2>
          <div className="max-w-5xl mx-auto aspect-video bg-gray-800 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Feminnita Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Outlet */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light mb-2">outlet</h2>
          <p className="text-red-600 font-semibold text-xl">até 50% OFF</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(outlet.length ? outlet : all.slice(0,4)).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Grid de Imagens */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image src="https://source.unsplash.com/400x400/?fitness,woman,gym" alt="Fitness" fill className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image src="https://source.unsplash.com/400x400/?yoga,woman" alt="Yoga" fill className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image src="https://source.unsplash.com/400x400/?workout,woman" alt="Workout" fill className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-lg">
            <Image src="https://source.unsplash.com/400x400/?sports,woman" alt="Sports" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Newsletter */}
      <Newsletter />

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4">feminnita</h3>
              <p className="text-sm text-gray-600">
                Moda fitness feminina com design inovador e qualidade excepcional
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Institucional</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/sobre" className="hover:underline">Sobre Nós</Link></li>
                <li><Link href="/contato" className="hover:underline">Contato</Link></li>
                <li><Link href="/termos" className="hover:underline">Termos de Uso</Link></li>
                <li><Link href="/privacidade" className="hover:underline">Política de Privacidade</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Minha Conta</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/meus-pedidos" className="hover:underline">Meus Pedidos</Link></li>
                <li><Link href="/favoritos" className="hover:underline">Favoritos</Link></li>
                <li><Link href="/comparar" className="hover:underline">Comparar Produtos</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Atendimento</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>WhatsApp: (21) 99999-9999</li>
                <li>Email: contato@feminnita.com</li>
                <li>Seg-Sex: 9h às 18h</li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-8 text-center">
            <p className="text-sm text-gray-600">
              © 2026 Feminnita. Todos os direitos reservados.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}
