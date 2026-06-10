"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, ExternalLink, Zap } from "lucide-react";
import { BLING_CLIENT_ID, BLING_REDIRECT_URI } from "@/lib/bling-config";

type SyncLog = {
  id: string;
  started_at: string;
  finished_at: string | null;
  products_synced: number;
  products_created: number;
  products_updated: number;
  errors: number;
  status: string;
};

const BLING_AUTH_URL = `https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${BLING_CLIENT_ID}&redirect_uri=${encodeURIComponent(BLING_REDIRECT_URI)}&state=${Math.random().toString(36).slice(2)}`;

export default function IntegracoesPage() {
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [importingCustomers, setImportingCustomers] = useState(false);
  const [customerResult, setCustomerResult] = useState<any>(null);

  useEffect(() => {
    loadLogs();
    const params = new URLSearchParams(window.location.search);
    if (params.get("bling") === "success") {
      setSyncResult({ ok: true, message: "Bling conectado com sucesso! Sincronização iniciada." });
    } else if (params.get("bling") === "error") {
      setSyncResult({ ok: false, message: `Erro ao conectar: ${params.get("msg") || "desconhecido"}` });
    }
  }, []);

  const loadLogs = async () => {
    const res = await fetch("/api/bling/sync");
    if (res.ok) setLogs(await res.json());
  };

  const runSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/bling/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      loadLogs();
    } catch (e: any) {
      setSyncResult({ ok: false, error: e.message });
    }
    setSyncing(false);
  };

  const runImportCustomers = async () => {
    setImportingCustomers(true);
    setCustomerResult(null);
    try {
      const res = await fetch("/api/bling/import-customers", { method: "POST" });
      setCustomerResult(await res.json());
    } catch (e: any) {
      setCustomerResult({ ok: false, error: e.message });
    }
    setImportingCustomers(false);
  };

  const lastLog = logs[0];
  const isConnected = logs.length > 0;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrações</h1>
      <p className="text-gray-500 mb-8">Conecte o Bling para sincronizar produtos automaticamente</p>

      {/* Bling Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">B</div>
            <div>
              <h2 className="font-bold text-lg">Bling ERP</h2>
              <p className="text-sm text-gray-500">Sincroniza produtos, preços, estoque, variações e clientes</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {isConnected ? <><CheckCircle size={13} /> Conectado</> : <><AlertCircle size={13} /> Não conectado</>}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {syncResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              syncResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {syncResult.ok ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
              <div>
                {syncResult.message && <p>{syncResult.message}</p>}
                {syncResult.total !== undefined && (
                  <p>{syncResult.total} produtos processados · {syncResult.created} criados · {syncResult.updated} atualizados · {syncResult.errors} erros</p>
                )}
                {syncResult.error && <p>{syncResult.error}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <a
              href={BLING_AUTH_URL}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 text-sm"
            >
              <ExternalLink size={15} />
              {isConnected ? "Reconectar Bling" : "Conectar Bling"}
            </a>
            {isConnected && (
              <button
                onClick={runSync}
                disabled={syncing}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-700 text-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Sincronizando..." : "Sincronizar produtos"}
              </button>
            )}
            {isConnected && (
              <button
                onClick={runImportCustomers}
                disabled={importingCustomers}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-200 text-sm disabled:opacity-50"
              >
                <RefreshCw size={15} className={importingCustomers ? "animate-spin" : ""} />
                {importingCustomers ? "Importando clientes..." : "Importar clientes"}
              </button>
            )}
          </div>

          {customerResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl text-sm ${
              customerResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {customerResult.ok ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
              <div>
                {customerResult.total !== undefined && (
                  <p>{customerResult.total} contatos lidos · {customerResult.created} criados · {customerResult.updated} atualizados · {customerResult.skipped} ignorados · {customerResult.errors} erros</p>
                )}
                {customerResult.error && <p>{customerResult.error}</p>}
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 space-y-1">
            <p><strong>O que é sincronizado:</strong> nome, código, preços, imagens, variações (cor/tamanho), estoque, categorias, peso e dimensões</p>
            <p><strong>Frequência automática:</strong> a cada 6 horas via cron (Vercel)</p>
          </div>
        </div>
      </div>

      {/* Sync History */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-700">Histórico de sincronizações</h3>
            <button onClick={loadLogs} className="text-gray-400 hover:text-gray-600">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="px-6 py-4 flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {log.status === "done" && <CheckCircle size={13} className="text-green-500" />}
                    {log.status === "error" && <XCircle size={13} className="text-red-500" />}
                    {log.status === "running" && <RefreshCw size={13} className="text-blue-500 animate-spin" />}
                    <span className="font-medium text-gray-700">
                      {log.products_created} criados · {log.products_updated} atualizados
                      {log.errors > 0 && <span className="text-red-500"> · {log.errors} erros</span>}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.started_at).toLocaleString("pt-BR")}
                    {log.finished_at && ` — ${Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  log.status === "done" ? "bg-green-100 text-green-700" :
                  log.status === "error" ? "bg-red-100 text-red-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {log.status === "done" ? "Concluído" : log.status === "error" ? "Erro" : "Rodando"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Asaas */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-[#8C2F39] rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Asaas</h2>
            <p className="text-sm text-gray-500">Gateway de pagamento (PIX, Boleto, Cartão)</p>
          </div>
          <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
            process.env.NEXT_PUBLIC_ASAAS_CONFIGURED === "true"
              ? "bg-green-100 text-green-700"
              : "bg-green-100 text-green-700"
          }`}>
            <CheckCircle size={13} /> Configurado via Vercel
          </div>
        </div>
        <p className="text-xs text-gray-400">Chave configurada via variável de ambiente <code>ASAAS_API_KEY</code> no Vercel</p>
      </div>
    </div>
  );
}
