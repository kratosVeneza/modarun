"use client";

import { useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type LatLng = {
  lat: number;
  lng: number;
};

type Props = {
  pontoEncontro: LatLng | null;
  setPontoEncontro: (value: LatLng | null) => void;
  rotaCoords: LatLng[];
  setRotaCoords: (value: LatLng[]) => void;
};

function CliqueMapa({
  pontoEncontro,
  setPontoEncontro,
  rotaCoords,
  setRotaCoords,
}: Props) {
  useMapEvents({
    click(e) {
      const novoPonto: LatLng = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };

      if (!pontoEncontro) {
        setPontoEncontro(novoPonto);
        return;
      }

      setRotaCoords([...rotaCoords, novoPonto]);
    },
  });

  return null;
}

export default function MapaTreinoEditor({
  pontoEncontro,
  setPontoEncontro,
  rotaCoords,
  setRotaCoords,
}: Props) {
  const center = useMemo<LatLngExpression>(() => {
    if (pontoEncontro) {
      return [pontoEncontro.lat, pontoEncontro.lng];
    }

    return [-3.7657, -49.6725];
  }, [pontoEncontro]);

  const polylinePositions: LatLngExpression[] = rotaCoords.map((p) => [
    p.lat,
    p.lng,
  ]);

  function desfazerUltimoPonto() {
    setRotaCoords(rotaCoords.slice(0, -1));
  }

  function limparTudo() {
    setPontoEncontro(null);
    setRotaCoords([]);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Mapa do treino</p>
        <p className="mt-1 text-sm text-slate-500">
          Clique uma vez para marcar o ponto de encontro. Depois, clique no mapa
          para adicionar os pontos do percurso.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "380px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <CliqueMapa
            pontoEncontro={pontoEncontro}
            setPontoEncontro={setPontoEncontro}
            rotaCoords={rotaCoords}
            setRotaCoords={setRotaCoords}
          />

          {pontoEncontro && (
            <CircleMarker
              center={[pontoEncontro.lat, pontoEncontro.lng]}
              radius={10}
              pathOptions={{
                color: "#f97316",
                fillColor: "#f97316",
                fillOpacity: 0.9,
              }}
            />
          )}

          {rotaCoords.map((p, index) => (
            <CircleMarker
              key={`${p.lat}-${p.lng}-${index}`}
              center={[p.lat, p.lng]}
              radius={6}
              pathOptions={{
                color: "#0f172a",
                fillColor: "#0f172a",
                fillOpacity: 0.85,
              }}
            />
          ))}

          {pontoEncontro && rotaCoords.length > 0 && (
            <Polyline
              positions={[[pontoEncontro.lat, pontoEncontro.lng], ...polylinePositions]}
              pathOptions={{ color: "#f97316", weight: 4 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={desfazerUltimoPonto}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Desfazer último ponto
        </button>

        <button
          type="button"
          onClick={limparTudo}
          className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Limpar rota
        </button>
      </div>
    </div>
  );
}