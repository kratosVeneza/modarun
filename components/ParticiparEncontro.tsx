"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ParticiparEncontro({
  encontroId,
}: {
  encontroId: number;
}) {
  const router = useRouter();

  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function enviarParticipacao(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    try {
      const response = await fetch("/api/participar-encontro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          encontro_id: encontroId,
          nome,
          whatsapp,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMensagem(result.error || "Erro ao participar.");
        setLoading(false);
        return;
      }

      setMensagem("Participação confirmada!");
      setNome("");
      setWhatsapp("");
      router.refresh();

      setTimeout(() => {
        setAberto(false);
        setMensagem("");
      }, 1200);
    } catch {
      setMensagem("Erro ao enviar participação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        Participar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Participar do encontro
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Preencha seus dados para confirmar sua participação.
              </p>
            </div>

            <form onSubmit={enviarParticipacao} className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />

              <input
                type="text"
                placeholder="WhatsApp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
                >
                  {loading ? "Enviando..." : "Confirmar"}
                </button>
              </div>

              {mensagem && (
                <p
                  className={`text-sm ${
                    mensagem.toLowerCase().includes("confirmada")
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {mensagem}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}