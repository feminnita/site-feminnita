import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { JsonLd } from "@/components/JsonLd";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, excerpt, cover_image")
    .eq("slug", slug)
    .single();

  if (!data) return {};
  return {
    title: data.title,
    description: data.excerpt,
    openGraph: {
      title: data.title,
      description: data.excerpt,
      images: data.cover_image ? [data.cover_image] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image,
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    author: { "@type": "Organization", name: "Feminnita" },
    publisher: {
      "@type": "Organization",
      name: "Feminnita",
      logo: { "@type": "ImageObject", url: "https://feminnita.com.br/logo.png" },
    },
  };

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={articleSchema} />
      <Header />

      <article className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-8 flex gap-2">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-gray-600">Blog</Link>
          <span>/</span>
          <span className="text-gray-700">{post.title}</span>
        </nav>

        {post.category && (
          <span className="text-xs font-semibold text-[#8C2F39] uppercase tracking-widest">
            {post.category}
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-light mt-2 mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 text-sm text-gray-400 mb-8">
          <span>{new Date(post.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          {post.reading_time && <><span>·</span><span>{post.reading_time} min de leitura</span></>}
        </div>

        {post.cover_image && (
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-10">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        <div
          className="prose prose-lg max-w-none prose-headings:font-light prose-a:text-[#8C2F39] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-12 pt-8 border-t">
          <Link
            href="/blog"
            className="text-sm text-[#8C2F39] hover:underline flex items-center gap-2"
          >
            ← Voltar para o blog
          </Link>
        </div>
      </article>
    </div>
  );
}
