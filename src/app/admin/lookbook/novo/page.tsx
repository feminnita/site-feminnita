"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SEASONS = ["Verão 2025", "Outono 2025", "Inverno 2025", "Primavera 2025", "Verão 2026"];

export default function NovoLookbookPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "", title: "", description: "", cover_image: "", season: "", published: false,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const autoSlug = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("lookbook_entries").insert(form);
    setSaving(false);
    if (!error) router.push("/admin/lookbook");
    else alert("Erro: " + error.message);
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/lookbook" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={18} /></Link>
        <h1 className="text-2xl font-semibold">Novo look</h1>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input type="text" value={form.title}
            onChange={(e) => { set("title", e.target.value); set("slug", autoSlug(e.target.value)); }}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
          <input type="text" value={form.slug} onChange={(e) => set("slug", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39] resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Imagem de capa (URL)</label>
          <input type="text" value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)}
            placeholder="https://..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coleção / Estação</label>
          <select value={form.season} onChange={(e) => set("season", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]">
            <option value="">Selecionar...</option>
            {SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)}
            className="w-4 h-4 accent-[#8C2F39]" />
          <label htmlFor="pub" className="text-sm text-gray-700">Publicar imediatamente</label>
        </div>
        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-[#8C2F39] text-white py-3 rounded-lg hover:bg-[#7a2832] font-medium disabled:opacity-50">
          <Save size={16} /> {saving ? "Salvando..." : "Criar look"}
        </button>
      </div>
    </div>
  );
}
