import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog de Moda Fitness | Feminnita",
  description: "Dicas de moda fitness, looks para treino, tendências e muito mais para mulheres ativas.",
};

export const revalidate = 3600;

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image, category, published_at, reading_time")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const featured = posts?.[0];
  const rest = posts?.slice(1) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-light mb-2">Blog Feminnita</h1>
          <p className="text-gray-500">Moda, estilo e inspiração para mulheres ativas</p>
        </div>

        {/* Featured */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="grid md:grid-cols-2 gap-8 bg-[#FAF6F2] rounded-2xl overflow-hidden">
              {featured.cover_image && (
                <div className="relative aspect-[16/10] md:aspect-auto min-h-64">
                  <Image
                    src={featured.cover_image}
                    alt={featured.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                </div>
              )}
              <div className="p-8 flex flex-col justify-center">
                <span className="text-xs font-semibold text-[#8C2F39] uppercase tracking-widest mb-3">
                  {featured.category || "Destaque"}
                </span>
                <h2 className="text-2xl md:text-3xl font-light mb-4 group-hover:text-[#8C2F39] transition-colors">
                  {featured.title}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 line-clamp-3">
                  {featured.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{new Date(featured.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
                  {featured.reading_time && <><span>·</span><span>{featured.reading_time} min de leitura</span></>}
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Grid */}
        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                {post.cover_image && (
                  <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden rounded-xl mb-4">
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <span className="text-xs font-semibold text-[#8C2F39] uppercase tracking-widest">
                  {post.category}
                </span>
                <h3 className="text-lg font-light mt-1 mb-2 group-hover:text-[#8C2F39] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{post.excerpt}</p>
                <p className="text-xs text-gray-400">
                  {new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                  {post.reading_time && ` · ${post.reading_time} min`}
                </p>
              </Link>
            ))}
          </div>
        )}

        {!posts?.length && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-xl mb-2">Em breve</p>
            <p className="text-sm">Os primeiros posts estão a caminho!</p>
          </div>
        )}
      </div>
    </div>
  );
}
