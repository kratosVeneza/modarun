"use client";

import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { useMemo } from "react";
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
    click(event) {
      const novoPonto: LatLng = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      console.log("CLICOU NO MAPA", novoPonto);

      if (pontoEncontro === null) {
        setPontoEncontro(novoPonto);
      } else {
        setRotaCoords([...rotaCoords, novoPonto]);
      }
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
    if (pontoEncontro) return [pontoEncontro.lat, pontoEncontro.lng];
    return [-3.7657, -49.6725];
  }, [pontoEncontro]);

  const positions: LatLngExpression[] = [
    ...(pontoEncontro ? [[pontoEncontro.lat, pontoEncontro.lng] as [number, number]] : []),
    ...rotaCoords.map((p) => [p.lat, p.lng] as [number, number]),
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Mapa do treino</p>
        <p className="mt-1 text-sm text-slate-500">
          Clique uma vez para marcar o ponto de encontro. Depois, clique novamente para desenhar o percurso.
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
                fillOpacity: 1,
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
                fillOpacity: 1,
              }}
            />
          ))}

          {positions.length >= 2 && (
            <Polyline
              positions={positions}
              pathOptions={{ color: "#f97316", weight: 4 }}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRotaCoords(rotaCoords.slice(0, -1))}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Desfazer último ponto
        </button>

        <button
          type="button"
          onClick={() => {
            setPontoEncontro(null);
            setRotaCoords([]);
          }}
          className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Limpar rota
        </button>
      </div>
    </div>
  );
}