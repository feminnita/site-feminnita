"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

type Look = {
  id: string;
  slug: string;
  title: string;
  cover_image: string | null;
  season: string | null;
  published: boolean;
  created_at: string;
};

export default function AdminLookbookPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    setLoading(true);
    supabase.from("lookbook_entries")
      .select("id, slug, title, cover_image, season, published, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setLooks((data as Look[]) || []); setLoading(false); });
  }, []);

  const togglePublish = async (look: Look) => {
    await supabase.from("lookbook_entries").update({ published: !look.published }).eq("id", look.id);
    setLooks((prev) => prev.map((l) => l.id === look.id ? { ...l, published: !l.published } : l));
  };

  const deleteLook = async (id: string) => {
    if (!confirm("Excluir este look?")) return;
    await supabase.from("lookbook_entries").delete().eq("id", id);
    setLooks((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Lookbook</h1>
          <p className="text-gray-500 mt-1">Gerencie os looks editoriais da loja</p>
        </div>
        <Link
          href="/admin/lookbook/novo"
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-2.5 rounded-lg hover:bg-[#7a2832] transition-colors text-sm font-medium"
        >
          <Plus size={16} /> Novo look
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : looks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-3">Nenhum look ainda</p>
          <Link href="/admin/lookbook/novo" className="text-[#8C2F39] underline text-sm">Criar primeiro look</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {looks.map((look) => (
            <div key={look.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="relative aspect-[2/3] bg-gray-100">
                {look.cover_image && (
                  <Image src={look.cover_image} alt={look.title} fill sizes="256px" className="object-cover" />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => togglePublish(look)}
                    className="p-1.5 bg-white/90 rounded-lg shadow text-gray-600 hover:bg-white"
                  >
                    {look.published ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <Link href={`/admin/lookbook/${look.id}`} className="p-1.5 bg-white/90 rounded-lg shadow text-gray-600 hover:bg-white">
                    <Edit size={14} />
                  </Link>
                  <button
                    onClick={() => deleteLook(look.id)}
                    className="p-1.5 bg-white/90 rounded-lg shadow text-red-400 hover:bg-white"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{look.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-400">{look.season || "—"}</p>
                  {look.published ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicado</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
