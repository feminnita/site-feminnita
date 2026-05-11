"use client";

import { useState } from "react";
import { Ruler, Loader2, Check, ChevronDown } from "lucide-react";

type Result = {
  size: string;
  confidence: "alta" | "média" | "baixa";
  explanation: string;
  fitNote?: string;
  alternative?: string | null;
};

const BRANDS = ["Lupo", "Olympikus", "Under Armour", "Nike", "Adidas", "Puma", "2XU", "Fila", "Outra"];

export function SizeRecommender({ onSizeSelect }: { onSizeSelect?: (size: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [form, setForm] = useState({
    height: "", weight: "", bust: "", waist: "", hip: "",
    referenceSize: "", referenceBrand: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.height || !form.weight) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/size-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ size: "M", confidence: "baixa", explanation: "Não foi possível calcular. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const confidenceColor = {
    alta: "text-green-600 bg-green-50",
    média: "text-yellow-600 bg-yellow-50",
    baixa: "text-orange-600 bg-orange-50",
  };

  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Ruler size={16} className="text-[#8C2F39]" />
          Descobrir meu tamanho com IA
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="border-t px-4 py-4 bg-[#FAF6F2]">
          {!result ? (
            <>
              <p className="text-xs text-gray-500 mb-4">Informe suas medidas para uma recomendação precisa</p>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Altura (cm) *</label>
                  <input type="number" value={form.height} onChange={(e) => set("height", e.target.value)}
                    placeholder="165" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Peso (kg) *</label>
                  <input type="number" value={form.weight} onChange={(e) => set("weight", e.target.value)}
                    placeholder="62" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Busto (cm)</label>
                  <input type="number" value={form.bust} onChange={(e) => set("bust", e.target.value)}
                    placeholder="88" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cintura (cm)</label>
                  <input type="number" value={form.waist} onChange={(e) => set("waist", e.target.value)}
                    placeholder="72" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Quadril (cm)</label>
                  <input type="number" value={form.hip} onChange={(e) => set("hip", e.target.value)}
                    placeholder="96" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Marca de referência</label>
                  <select value={form.referenceBrand} onChange={(e) => set("referenceBrand", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white">
                    <option value="">Selecionar...</option>
                    {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Seu tamanho lá</label>
                  <select value={form.referenceSize} onChange={(e) => set("referenceSize", e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30 bg-white">
                    <option value="">Selecionar...</option>
                    {["PP", "P", "M", "G", "GG", "XG", "34", "36", "38", "40", "42", "44"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={submit} disabled={loading || !form.height || !form.weight}
                className="w-full flex items-center justify-center gap-2 bg-[#8C2F39] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#7a2832] transition-colors disabled:opacity-50">
                {loading ? <><Loader2 size={15} className="animate-spin" /> Calculando...</> : "Calcular meu tamanho"}
              </button>
            </>
          ) : (
            <div>
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500 mb-1">Seu tamanho recomendado</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-bold text-[#8C2F39]">{result.size}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${confidenceColor[result.confidence]}`}>
                    Confiança {result.confidence}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700 text-center mb-3">{result.explanation}</p>

              {result.fitNote && (
                <p className="text-xs text-[#8C2F39] bg-[#8C2F39]/5 rounded-lg px-3 py-2 mb-3">{result.fitNote}</p>
              )}

              {result.alternative && (
                <p className="text-xs text-gray-500 text-center mb-3">
                  Fica entre dois tamanhos? Considere também o <strong>{result.alternative}</strong>
                </p>
              )}

              <div className="flex gap-2">
                {onSizeSelect && (
                  <button onClick={() => { onSizeSelect(result.size); setOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#8C2F39] text-white py-2 rounded-lg text-sm font-medium">
                    <Check size={14} /> Selecionar {result.size}
                  </button>
                )}
                <button onClick={() => setResult(null)}
                  className="flex-1 text-center border py-2 rounded-lg text-sm hover:bg-white transition-colors">
                  Refazer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
