"use client";

import { useState } from "react";
import { AtSign, Check, Loader2 } from "lucide-react";
import { Header } from "../../components/layout/Header";
import { apiPost } from "../../services/api";

type Resposta = { codigo?: string; jaInscrita?: boolean; mensagem?: string };

export default function SejaAfiliadaPage() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [instagram, setInstagram] = useState("");
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const [pronto, setPronto] = useState<Resposta | null>(null);

    async function enviar(e: React.FormEvent) {
        e.preventDefault();
        setErro("");
        setEnviando(true);
        try {
            const r = await apiPost<Resposta>("/api/store/afiliadas", {
                nome, email, telefone, instagram,
            });
            setPronto(r ?? {});
        } catch (err) {
            // A mensagem do servidor é escrita para ela ler; se não vier, uma
            // genérica — mas nunca deixar a tela muda, que é o pior caso.
            const msg = err instanceof Error ? err.message : "";
            setErro(msg || "Não foi possível enviar agora. Tente de novo em alguns minutos.");
        } finally {
            setEnviando(false);
        }
    }

    if (pronto) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="container mx-auto max-w-xl px-4 py-20 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <Check className="text-emerald-600" size={32} />
                    </div>
                    <h1 className="mb-3 text-3xl font-light">
                        {pronto.jaInscrita ? "Você já está na lista" : "Recebemos seu cadastro"}
                    </h1>
                    <p className="mb-8 text-gray-600">
                        {pronto.mensagem ??
                            "Vamos olhar seu perfil e responder no e-mail que você cadastrou."}
                    </p>

                    {pronto.codigo && (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-left">
                            <p className="mb-1 text-xs uppercase tracking-wide text-gray-400">
                                Seu código vai ser
                            </p>
                            <p className="mb-3 font-mono text-2xl text-gray-900">{pronto.codigo}</p>
                            {/* Dizer isto aqui evita o pior cenario: ela divulgar
                                o link antes da aprovacao e nao receber por nada. */}
                            <p className="text-sm text-gray-500">
                                Ele <strong>ainda não está valendo</strong>. Só comece a divulgar
                                depois que a gente aprovar — antes disso as vendas não ficam
                                registradas para você.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className="container mx-auto max-w-5xl px-4 py-16">
                <div className="grid gap-12 md:grid-cols-2">
                    <div>
                        <h1 className="mb-4 text-4xl font-light leading-tight">
                            Divulgue a Feminnita<br />e ganhe por venda
                        </h1>
                        <p className="mb-8 text-gray-600">
                            Você recebe um link só seu. Quem comprar por ele, você ganha uma
                            porcentagem — sem precisar comprar nada, sem estoque, sem envio.
                        </p>

                        <ol className="space-y-5">
                            {[
                                ["Você se cadastra", "Leva um minuto. A gente olha seu perfil e responde por e-mail."],
                                ["Recebe seu link", "Algo como feminnita.com.br/?ref=SEUNOME. É esse link que você divulga."],
                                ["Ganha por venda", "Toda compra feita por ele fica registrada para você, com a sua porcentagem."],
                            ].map(([titulo, texto], i) => (
                                <li key={titulo} className="flex gap-4">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8C2F39] text-sm text-white">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium text-gray-900">{titulo}</p>
                                        <p className="text-sm text-gray-500">{texto}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-8 text-xs text-gray-400">
                            A comissão é sobre o valor dos produtos, sem o frete, e conta a partir
                            do momento em que o pedido é pago. Cancelamento não gera comissão.
                        </p>
                    </div>

                    <form
                        onSubmit={enviar}
                        className="h-fit rounded-2xl border border-gray-200 p-8 shadow-sm"
                    >
                        <h2 className="mb-6 text-xl font-medium">Quero divulgar</h2>

                        <label className="mb-4 block">
                            <span className="mb-1 block text-sm text-gray-600">Seu nome *</span>
                            <input
                                required
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full rounded-lg border px-4 py-3 focus:border-[#8C2F39] focus:outline-none"
                            />
                        </label>

                        <label className="mb-4 block">
                            <span className="mb-1 block text-sm text-gray-600">E-mail *</span>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border px-4 py-3 focus:border-[#8C2F39] focus:outline-none"
                            />
                            <span className="mt-1 block text-xs text-gray-400">
                                É por aqui que a gente responde.
                            </span>
                        </label>

                        <label className="mb-4 block">
                            <span className="mb-1 block text-sm text-gray-600">WhatsApp</span>
                            <input
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="(22) 99999-9999"
                                className="w-full rounded-lg border px-4 py-3 focus:border-[#8C2F39] focus:outline-none"
                            />
                        </label>

                        <label className="mb-6 block">
                            <span className="mb-1 block text-sm text-gray-600">Seu Instagram</span>
                            <span className="relative block">
                                <AtSign
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    placeholder="@seuperfil"
                                    className="w-full rounded-lg border py-3 pl-9 pr-4 focus:border-[#8C2F39] focus:outline-none"
                                />
                            </span>
                            <span className="mt-1 block text-xs text-gray-400">
                                É de onde a gente tira o seu código.
                            </span>
                        </label>

                        {erro && (
                            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                                {erro}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={enviando}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8C2F39] py-3 font-medium text-white transition-colors hover:bg-[#7a2832] disabled:opacity-60"
                        >
                            {enviando && <Loader2 size={16} className="animate-spin" />}
                            {enviando ? "Enviando…" : "Quero meu link"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
