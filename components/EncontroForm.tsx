"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EncontroForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    titulo: "",
    cidade: "",
    estado: "",
    data_encontro: "",
    horario: "",
    local_saida: "",
    percurso: "",
    distancia: "",
    ritmo: "",
    observacoes: "",
    organizador_nome: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    try {
      const response = await fetch("/api/encontros", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        setMensagem(result.error || "Erro ao criar encontro.");
        setLoading(false);
        return;
      }

      setMensagem("Encontro criado com sucesso!");

      setForm({
        titulo: "",
        cidade: "",
        estado: "",
        data_encontro: "",
        horario: "",
        local_saida: "",
        percurso: "",
        distancia: "",
        ritmo: "",
        observacoes: "",
        organizador_nome: "",
      });

      router.refresh();
    } catch {
      setMensagem("Erro ao enviar os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900">Criar encontro</h2>
        <p className="mt-1 text-sm text-slate-500">
          Organize um treino, ponto de corrida ou grupo para correr junto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="titulo"
            placeholder="Título do encontro"
            value={form.titulo}
            onChange={handleChange}
          />
          <CampoInput
            name="organizador_nome"
            placeholder="Seu nome"
            value={form.organizador_nome}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="cidade"
            placeholder="Cidade"
            value={form.cidade}
            onChange={handleChange}
          />
          <CampoInput
            name="estado"
            placeholder="Estado"
            value={form.estado}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="data_encontro"
            type="date"
            value={form.data_encontro}
            onChange={handleChange}
          />
          <CampoInput
            name="horario"
            type="time"
            value={form.horario}
            onChange={handleChange}
          />
        </div>

        <CampoInput
          name="local_saida"
          placeholder="Local de saída"
          value={form.local_saida}
          onChange={handleChange}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="distancia"
            placeholder="Distância (ex: 5 km)"
            value={form.distancia}
            onChange={handleChange}
          />
          <CampoInput
            name="ritmo"
            placeholder="Ritmo (ex: leve)"
            value={form.ritmo}
            onChange={handleChange}
          />
        </div>

        <CampoInput
          name="percurso"
          placeholder="Percurso"
          value={form.percurso}
          onChange={handleChange}
        />

        <div>
          <textarea
            name="observacoes"
            placeholder="Observações"
            value={form.observacoes}
            onChange={handleChange}
            className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Criar encontro"}
          </button>

          {mensagem && (
            <p
              className={`text-sm ${
                mensagem.toLowerCase().includes("sucesso")
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {mensagem}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function CampoInput({
  name,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  name: string;
  placeholder?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
    />
  );
}