"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit, Trash2, Save, X, Image, Video, GripVertical, Eye, EyeOff } from "lucide-react";

type Slide = {
  id: string;
  type: string;
  src: string;
  alt: string | null;
  poster: string | null;
  cta_text: string | null;
  cta_href: string | null;
  order_index: number;
  active: boolean;
  created_at: string;
};

const emptySlide = (): Omit<Slide, "id" | "created_at"> => ({
  type: "image",
  src: "",
  alt: "",
  poster: null,
  cta_text: "",
  cta_href: "",
  order_index: 0,
  active: true,
});

export default function SlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editing, setEditing] = useState<(Omit<Slide, "id" | "created_at"> & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hero_slides")
      .select("*")
      .order("order_index");
    setSlides(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !editing.src) return;
    setSaving(true);

    const payload = {
      type: editing.type,
      src: editing.src,
      alt: editing.alt || null,
      poster: editing.poster || null,
      cta_text: editing.cta_text || null,
      cta_href: editing.cta_href || null,
      order_index: editing.order_index,
      active: editing.active,
    };

    if (editing.id) {
      await supabase.from("hero_slides").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hero_slides").insert(payload);
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    load();
  };

  const toggleActive = async (slide: Slide) => {
    await supabase.from("hero_slides").update({ active: !slide.active }).eq("id", slide.id);
    load();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Carrossel Hero</h1>
          <p className="text-gray-500 mt-1">Gerencie os slides da página inicial</p>
        </div>
        <button
          onClick={() => setEditing({ ...emptySlide(), order_index: slides.length })}
          className="flex items-center gap-2 bg-[#8C2F39] text-white px-5 py-3 rounded-lg font-semibold hover:bg-[#7a2832]"
        >
          <Plus size={18} />
          Novo Slide
        </button>
      </div>

      {/* Edit panel */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editing.id ? "Editar" : "Novo"} Slide</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de mídia</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, type: "image" })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      editing.type === "image"
                        ? "bg-[#8C2F39] border-[#8C2F39] text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Image size={16} />
                    Imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing({ ...editing, type: "video" })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                      editing.type === "video"
                        ? "bg-[#8C2F39] border-[#8C2F39] text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Video size={16} />
                    Vídeo
                  </button>
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da {editing.type === "image" ? "imagem" : "vídeo"} *
                </label>
                <input
                  type="text"
                  value={editing.src}
                  onChange={(e) => setEditing({ ...editing, src: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder={editing.type === "image" ? "https://..." : "https://...mp4"}
                />
              </div>

              {/* Alt text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto alternativo (acessibilidade)</label>
                <input
                  type="text"
                  value={editing.alt || ""}
                  onChange={(e) => setEditing({ ...editing, alt: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  placeholder="Descrição da imagem"
                />
              </div>

              {/* Poster (only for video) */}
              {editing.type === "video" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL da capa do vídeo (poster)</label>
                  <input
                    type="text"
                    value={editing.poster || ""}
                    onChange={(e) => setEditing({ ...editing, poster: e.target.value || null })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    placeholder="https://...jpg"
                  />
                </div>
              )}

              {/* CTA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Texto do botão</label>
                  <input
                    type="text"
                    value={editing.cta_text || ""}
                    onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    placeholder="VER COLEÇÃO"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link do botão</label>
                  <input
                    type="text"
                    value={editing.cta_href || ""}
                    onChange={(e) => setEditing({ ...editing, cta_href: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                    placeholder="/produtos"
                  />
                </div>
              </div>

              {/* Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posição (ordem)</label>
                  <input
                    type="number"
                    min="0"
                    value={editing.order_index}
                    onChange={(e) => setEditing({ ...editing, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#8C2F39]"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                      className="w-4 h-4 accent-[#8C2F39]"
                    />
                    <span className="text-sm font-medium text-gray-700">Slide ativo</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editing.src}
                  className="flex items-center gap-2 bg-[#8C2F39] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7a2832] disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="px-5 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slides list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#8C2F39] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          <Image size={56} className="mx-auto mb-4" />
          <p className="text-lg font-medium">Nenhum slide cadastrado</p>
          <p className="text-sm mt-1">Adicione slides ao carrossel da página inicial</p>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${
                slide.active ? "border-gray-100" : "border-gray-200 opacity-60"
              }`}
            >
              <GripVertical size={18} className="text-gray-300 shrink-0" />

              {/* Preview */}
              <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {slide.type === "image" && slide.src ? (
                  <img src={slide.src} alt={slide.alt || ""} className="w-full h-full object-cover" />
                ) : slide.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Video size={20} className="text-white" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image size={20} className="text-gray-300" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    slide.type === "video" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {slide.type === "video" ? <Video size={11} /> : <Image size={11} />}
                    {slide.type === "video" ? "Vídeo" : "Imagem"}
                  </span>
                  <span className="text-xs text-gray-400">Posição: {slide.order_index}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate">{slide.alt || slide.src}</p>
                {slide.cta_text && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Botão: {slide.cta_text} → {slide.cta_href}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(slide)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title={slide.active ? "Desativar slide" : "Ativar slide"}
                >
                  {slide.active
                    ? <Eye size={16} className="text-green-600" />
                    : <EyeOff size={16} className="text-gray-400" />
                  }
                </button>
                <button
                  onClick={() => setEditing({ ...slide })}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Edit size={16} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
