"use client";
import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Step = "identificacao" | "entrega" | "pagamento";

const steps: { key: Step; label: string }[] = [
  { key: "identificacao", label: "Identificação" },
  { key: "entrega", label: "Entrega" },
  { key: "pagamento", label: "Pagamento" },
];

export default function CheckoutPage() {
  const [step, setStep] = useState<Step>("identificacao");

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Steps indicator */}
      <div className="border-b border-gray-100">
        <div className="max-w-[900px] mx-auto px-4 py-4 flex items-center justify-center gap-0">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold"
                  style={{
                    background: i <= stepIndex ? "#8C2F39" : "#e0e0e0",
                    color: i <= stepIndex ? "#fff" : "#999",
                  }}
                >
                  {i < stepIndex ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className="text-[12px] uppercase tracking-wider hidden sm:block"
                  style={{ color: i <= stepIndex ? "#333" : "#aaa" }}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="w-16 h-px mx-3" style={{ background: i < stepIndex ? "#8C2F39" : "#e0e0e0" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2">
          {step === "identificacao" && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-700 mb-6">
                Seus Dados
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Nome</label>
                    <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Sobrenome</label>
                    <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">E-mail</label>
                  <input type="email" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">CPF</label>
                  <input type="text" placeholder="000.000.000-00" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Telefone / WhatsApp</label>
                  <input type="tel" placeholder="(11) 99999-9999" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                </div>
              </div>
              <button
                onClick={() => setStep("entrega")}
                className="mt-6 w-full py-4 text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
                style={{ background: "#8C2F39" }}
              >
                Continuar para Entrega
              </button>
            </div>
          )}

          {step === "entrega" && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-700 mb-6">
                Endereço de Entrega
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">CEP</label>
                    <input type="text" placeholder="00000-000" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <button className="mt-5 px-5 border border-gray-300 text-[12px] text-gray-600 hover:border-gray-500 transition-colors self-end py-3">
                    Buscar
                  </button>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Rua</label>
                  <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Número</label>
                    <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Complemento</label>
                    <input type="text" placeholder="Apto, bloco..." className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Bairro</label>
                  <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Cidade</label>
                    <input type="text" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Estado</label>
                    <input type="text" maxLength={2} placeholder="SP" className="w-full border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  </div>
                </div>

                {/* Frete options */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-3">Opção de Frete</label>
                  <div className="space-y-2">
                    {[
                      { id: "pac", label: "PAC — 5 a 8 dias úteis", price: "R$ 19,90" },
                      { id: "sedex", label: "SEDEX — 1 a 3 dias úteis", price: "R$ 34,90" },
                    ].map((opt) => (
                      <label key={opt.id} className="flex items-center justify-between border border-gray-200 px-4 py-3 cursor-pointer hover:border-gray-400 transition-colors">
                        <div className="flex items-center gap-3">
                          <input type="radio" name="frete" value={opt.id} className="accent-[#8C2F39]" />
                          <span className="text-[13px] text-gray-700">{opt.label}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-gray-700">{opt.price}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep("identificacao")} className="px-8 py-4 border border-gray-200 text-[12px] uppercase tracking-wider text-gray-500 hover:border-gray-400 transition-colors">
                  Voltar
                </button>
                <button
                  onClick={() => setStep("pagamento")}
                  className="flex-1 py-4 text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#8C2F39" }}
                >
                  Continuar para Pagamento
                </button>
              </div>
            </div>
          )}

          {step === "pagamento" && (
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-700 mb-6">
                Forma de Pagamento
              </h2>
              <div className="space-y-3">
                {[
                  { id: "pix", label: "PIX — 10% de desconto", badge: "10% OFF" },
                  { id: "credito", label: "Cartão de Crédito — em até 10x sem juros", badge: null },
                  { id: "boleto", label: "Boleto Bancário — vence em 3 dias úteis", badge: null },
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center justify-between border border-gray-200 px-4 py-4 cursor-pointer hover:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3">
                      <input type="radio" name="pagamento" value={opt.id} className="accent-[#8C2F39]" />
                      <span className="text-[13px] text-gray-700">{opt.label}</span>
                    </div>
                    {opt.badge && (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5" style={{ background: "#8C2F39" }}>
                        {opt.badge}
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* Coupon */}
              <div className="mt-6">
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">Cupom de Desconto</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Digite seu cupom" className="flex-1 border border-gray-200 px-4 py-3 text-[14px] outline-none focus:border-gray-400 transition-colors" />
                  <button className="px-5 border border-gray-300 text-[12px] uppercase tracking-wider text-gray-600 hover:border-gray-500 transition-colors">
                    Aplicar
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep("entrega")} className="px-8 py-4 border border-gray-200 text-[12px] uppercase tracking-wider text-gray-500 hover:border-gray-400 transition-colors">
                  Voltar
                </button>
                <Link
                  href="/pedido-confirmado"
                  className="flex-1 py-4 text-center text-white text-[12px] uppercase tracking-[0.2em] font-semibold hover:opacity-90 transition-opacity"
                  style={{ background: "#8C2F39" }}
                >
                  Finalizar Pedido
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="border border-gray-100 p-5 sticky top-[80px]">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-gray-700 mb-4">
              Resumo do Pedido
            </h3>
            <div className="text-[13px] text-gray-500 space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ 0,00</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>—</span>
              </div>
              <div className="flex justify-between">
                <span>Desconto</span>
                <span>—</span>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-gray-800">
              <span>Total</span>
              <span>R$ 0,00</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Pagamento 100% seguro</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
