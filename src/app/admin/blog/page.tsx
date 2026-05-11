"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

type Post = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id, slug, title, category, published, published_at, created_at")
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (post: Post) => {
    const update: any = { published: !post.published };
    if (!post.published) update.published_at = new Date().toISOString();
    await supabase.from("blog_posts").update(update).eq("id", post.id);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, ...update } : p));
  };

  const deletePost = async (id: string) => {
    if (!confirm("Excluir este post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie posts do blog</p>
        </div>
        <Link
          href="/admin/blog/novo"
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-2.5 rounded-lg hover:bg-[#7a2832] transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Novo post
        </Link>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="mb-3">Nenhum post ainda</p>
            <Link href="/admin/blog/novo" className="text-[#8C2F39] underline text-sm">Criar primeiro post</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Título</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Categoria</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Data</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{post.title}</p>
                    <p className="text-xs text-gray-400">/blog/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.category || "—"}</td>
                  <td className="px-4 py-3">
                    {post.published ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Publicado</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Rascunho</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString("pt-BR")
                      : new Date(post.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => togglePublish(post)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                        title={post.published ? "Despublicar" : "Publicar"}
                      >
                        {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
