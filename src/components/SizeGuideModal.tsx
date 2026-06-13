"use client";

import { X } from "lucide-react";

// Guia de medidas padrão Feminnita (medidas do corpo em cm).
const ROWS = [
  { tam: "P", manequim: "34", busto: "86-90", cintura: "67-73", quadril: "94-98" },
  { tam: "M", manequim: "36-38", busto: "91-94", cintura: "74-80", quadril: "99-103" },
  { tam: "G", manequim: "40-42", busto: "95-100", cintura: "81-87", quadril: "104-108" },
  { tam: "GG", manequim: "44-46", busto: "101-104", cintura: "88-94", quadril: "109-113" },
];

export function SizeGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b">
          <h2 className="text-lg font-semibold text-[#8C2F39]">Guia de Medidas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          {/* Tabela */}
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm text-center">
              <thead>
                <tr className="bg-[#8C2F39] text-white">
                  <th className="py-3 px-2 font-semibold">Tam</th>
                  <th className="py-3 px-2 font-semibold">Busto</th>
                  <th className="py-3 px-2 font-semibold">Cintura</th>
                  <th className="py-3 px-2 font-semibold">Quadril</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r, i) => (
                  <tr key={r.tam} className={i % 2 === 0 ? "bg-white" : "bg-[#FAF6F2]"}>
                    <td className="py-3 px-2 border-t border-gray-100">
                      <span className="font-bold text-[#8C2F39]">{r.tam}</span>
                      <span className="block text-[11px] text-gray-500">{r.manequim}</span>
                    </td>
                    <td className="py-3 px-2 border-t border-gray-100">{r.busto}</td>
                    <td className="py-3 px-2 border-t border-gray-100">{r.cintura}</td>
                    <td className="py-3 px-2 border-t border-gray-100">{r.quadril}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-4 leading-relaxed">
            Medidas do corpo em centímetros (cm). Em caso de dúvida entre dois tamanhos,
            recomendamos escolher o maior para um caimento mais confortável.
          </p>

          {/* Como medir */}
          <div className="mt-5 space-y-2 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Como medir:</p>
            <p><span className="font-medium text-[#8C2F39]">Busto:</span> meça na parte mais cheia do busto.</p>
            <p><span className="font-medium text-[#8C2F39]">Cintura:</span> meça na parte mais fina da cintura.</p>
            <p><span className="font-medium text-[#8C2F39]">Quadril:</span> meça na parte mais larga do quadril.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
