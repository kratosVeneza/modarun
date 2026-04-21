"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapaTreinoEditor = dynamic(() => import("@/components/MapaTreinoEditor"), {
  ssr: false,
});

type LatLng = {
  lat: number;
  lng: number;
};

const tiposTreino = [
  "Caminhada longa",
  "Corrida leve",
  "Corrida moderada",
  "Longão",
  "Tiro",
  "Fartlek",
  "Intervalado",
  "Regenerativo",
  "Subida",
  "Trail",
  "Outro",
];

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
    tipo_treino: "",
    km_planejado: "",
  });

  const [pontoEncontro, setPontoEncontro] = useState<LatLng | null>(null);
  const [rotaCoords, setRotaCoords] = useState<LatLng[]>([]);

  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        body: JSON.stringify({
          ...form,
          ponto_encontro_lat: pontoEncontro?.lat ?? null,
          ponto_encontro_lng: pontoEncontro?.lng ?? null,
          rota_coords: rotaCoords,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMensagem(result.error || "Erro ao criar treino.");
        setLoading(false);
        return;
      }

      setMensagem("Treino marcado com sucesso!");

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
        tipo_treino: "",
        km_planejado: "",
      });

      setPontoEncontro(null);
      setRotaCoords([]);
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
        <h2 className="text-2xl font-bold text-slate-900">Marcar treino</h2>
        <p className="mt-1 text-sm text-slate-500">
          Defina o treino, o ponto de encontro e o percurso no mapa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="titulo"
            placeholder="Título do treino"
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

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tipo de treino
            </label>
            <select
              name="tipo_treino"
              value={form.tipo_treino}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Selecione</option>
              {tiposTreino.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <CampoInput
            name="km_planejado"
            type="number"
            placeholder="KM planejado"
            value={form.km_planejado}
            onChange={handleChange}
          />

          <CampoInput
            name="distancia"
            placeholder="Distância (ex: 5 km)"
            value={form.distancia}
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
          placeholder="Nome do ponto de encontro"
          value={form.local_saida}
          onChange={handleChange}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <CampoInput
            name="ritmo"
            placeholder="Ritmo (ex: leve, moderado, forte)"
            value={form.ritmo}
            onChange={handleChange}
          />
          <CampoInput
            name="percurso"
            placeholder="Descrição do percurso"
            value={form.percurso}
            onChange={handleChange}
          />
        </div>

        <div>
          <textarea
            name="observacoes"
            placeholder="Observações"
            value={form.observacoes}
            onChange={handleChange}
            className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </div>

        <MapaTreinoEditor
          pontoEncontro={pontoEncontro}
          setPontoEncontro={setPontoEncontro}
          rotaCoords={rotaCoords}
          setRotaCoords={setRotaCoords}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Marcar treino"}
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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