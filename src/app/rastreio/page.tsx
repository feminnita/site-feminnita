"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Truck, Search, Package, CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";

type TrackingEvent = {
  status: string;
  description: string;
  location?: string;
  date: string;
};

type TrackingResult = {
  status: string;
  tracking: string | null;
  trackingUrl: string | null;
  events: TrackingEvent[];
};

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "Aguardando pagamento", color: "text-amber-600", icon: AlertCircle },
  paid: { label: "Pagamento confirmado", color: "text-blue-600", icon: CheckCircle },
  label_generated: { label: "Etiqueta gerada", color: "text-blue-600", icon: Package },
  shipped: { label: "Enviado", color: "text-purple-600", icon: Truck },
  delivered: { label: "Entregue", color: "text-green-600", icon: CheckCircle },
  unknown: { label: "Consultando...", color: "text-gray-500", icon: Loader2 },
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("pedido") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState("");

  const search = async () => {
    if (!orderId.trim()) { setError("Informe o número do pedido"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/shipping/tracking?orderId=${encodeURIComponent(orderId.trim())}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError("Não foi possível encontrar o rastreio. Verifique o número do pedido.");
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = result ? (STATUS_LABELS[result.status] || STATUS_LABELS.unknown) : null;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <Truck size={40} className="text-[#8C2F39] mx-auto mb-3" />
          <h1 className="text-3xl font-light mb-2">Rastrear pedido</h1>
          <p className="text-gray-500">Acompanhe a entrega do seu pedido em tempo real</p>
        </div>

        <div className="bg-[#FAF6F2] rounded-2xl p-6 mb-8">
          <div className="grid gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número do pedido</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                placeholder="FEM-ABC123-XYZ"
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C2F39]/30"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={search}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#8C2F39] text-white py-3 rounded-xl font-medium hover:bg-[#7a2832] transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {loading ? "Consultando..." : "Rastrear"}
          </button>
        </div>

        {result && statusInfo && (
          <div className="bg-white border rounded-2xl overflow-hidden">
            {/* Status header */}
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <statusInfo.icon size={24} className={statusInfo.color} />
                <div>
                  <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                  {result.tracking && (
                    <p className="text-sm text-gray-500 mt-0.5">Código: <span className="font-mono font-medium">{result.tracking}</span></p>
                  )}
                </div>
                {result.trackingUrl && (
                  <a href={result.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs text-[#8C2F39] hover:underline">
                    Rastrear no site dos Correios <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Events timeline */}
            {result.events.length > 0 ? (
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wide">Histórico</h3>
                <div className="space-y-4">
                  {result.events.map((ev, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? "bg-[#8C2F39]" : "bg-gray-300"}`} />
                        {i < result.events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium">{ev.description || ev.status}</p>
                        {ev.location && <p className="text-xs text-gray-500">{ev.location}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(ev.date).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-400 text-sm">
                <Package size={32} className="mx-auto mb-2 text-gray-200" />
                <p>O rastreio ainda não foi atualizado pelos Correios.</p>
                <p className="mt-1">Tente novamente em algumas horas.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RastreioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white"><Header /></div>}>
      <TrackingContent />
    </Suspense>
  );
}
