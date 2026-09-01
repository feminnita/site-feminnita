"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiPost } from "../../services/api";

type Status = "idle" | "sending" | "success" | "error";

export function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const update =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatus("sending");

    try {
      await apiPost("/api/store/contact", form);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar sua mensagem agora. Tente novamente.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 size={26} className="text-green-600" />
        </div>
        <h2 className="mb-2 text-lg font-bold text-gray-800">
          Mensagem enviada!
        </h2>
        <p className="text-sm text-gray-600">
          Recebemos sua mensagem e vamos responder pelo e-mail informado. Obrigada!
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-sm font-semibold text-[#8C2F39] hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nome
        </label>
        <input
          type="text"
          value={form.name}
          onChange={update("name")}
          required
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
          placeholder="Seu nome"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
            placeholder="seu@email.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={update("phone")}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Assunto
        </label>
        <input
          type="text"
          value={form.subject}
          onChange={update("subject")}
          required
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
          placeholder="Sobre o que você quer falar?"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Mensagem
        </label>
        <textarea
          value={form.message}
          onChange={update("message")}
          required
          rows={5}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#8C2F39]"
          placeholder="Escreva sua mensagem"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#8C2F39] py-3 font-semibold text-white transition-colors hover:bg-[#7a2832] disabled:opacity-50"
      >
        {status === "sending" ? (
          <Loader2 size={18} className="animate-spin" />
        ) : null}
        {status === "sending" ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
