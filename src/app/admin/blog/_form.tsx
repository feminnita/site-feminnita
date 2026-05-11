"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Save, Eye, ArrowLeft } from "lucide-react";
import Link from "next/link";

type PostData = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  reading_time: string;
  published: boolean;
};

const CATEGORIES = ["Moda", "Treino", "Nutrição", "Lifestyle", "Tendências", "Dicas"];

export function BlogPostForm({ initial }: { initial?: Partial<PostData> }) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PostData>({
    slug: initial?.slug || "",
    title: initial?.title || "",
    excerpt: initial?.excerpt || "",
    content: initial?.content || "",
    cover_image: initial?.cover_image || "",
    category: initial?.category || "",
    reading_time: String(initial?.reading_time || ""),
    published: initial?.published || false,
  });

  const set = (k: keyof PostData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const autoSlug = (title: string) =>
    title.toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

  const save = async (publish = false) => {
    setSaving(true);
    const payload: any = {
      ...form,
      reading_time: form.reading_time ? parseInt(form.reading_time) : null,
      published: publish ? true : form.published,
      published_at: publish && !form.published ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (initial?.id) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", initial.id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }

    setSaving(false);
    if (!error) router.push("/admin/blog");
    else alert("Erro ao salvar: " + error.message);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{initial?.id ? "Editar post" : "Novo post"}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {!form.published && (
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
            >
              <Eye size={16} /> Publicar
            </button>
          )}
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-2.5 rounded-lg hover:bg-[#7a2832] text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Salvando..." : "Salvar rascunho"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  set("title", e.target.value);
                  if (!initial?.id) set("slug", autoSlug(e.target.value));
                }}
                placeholder="Título do post"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="titulo-do-post"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resumo (excerpt)</label>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={2}
                placeholder="Breve descrição exibida na listagem e redes sociais"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo (HTML)</label>
              <textarea
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                rows={20}
                placeholder="<p>Conteúdo do post em HTML...</p>"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] resize-y font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Aceita HTML. Em breve: editor visual.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 space-y-4">
            <h3 className="font-semibold text-sm">Imagem de capa</h3>
            <input
              type="text"
              value={form.cover_image}
              onChange={(e) => set("cover_image", e.target.value)}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
            />
            {form.cover_image && (
              <img src={form.cover_image} alt="" className="w-full aspect-video object-cover rounded-lg" />
            )}
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-4">
            <h3 className="font-semibold text-sm">Categoria</h3>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
            >
              <option value="">Selecionar...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-3">Tempo de leitura</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.reading_time}
                onChange={(e) => set("reading_time", e.target.value)}
                min="1"
                placeholder="5"
                className="w-20 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]"
              />
              <span className="text-sm text-gray-500">minutos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
