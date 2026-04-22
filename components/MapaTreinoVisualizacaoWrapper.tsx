"use client";

import dynamic from "next/dynamic";

const MapaTreinoVisualizacao = dynamic(
  () => import("@/components/MapaTreinoVisualizacao"),
  { ssr: false, loading: () => (
    <div className="flex h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
      <p className="text-sm text-slate-400">Carregando mapa...</p>
    </div>
  )}
);

type Props = {
  pontoEncontro: { lat: number; lng: number } | null;
  rotaCoords: { lat: number; lng: number }[];
};

export default function MapaTreinoVisualizacaoWrapper(props: Props) {
  return <MapaTreinoVisualizacao {...props} />;
}
