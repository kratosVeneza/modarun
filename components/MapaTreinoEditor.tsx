"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { type LatLngExpression } from "leaflet";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = { lat: number; lng: number };

type Props = {
  pontoEncontro: LatLng | null;
  setPontoEncontro: (value: LatLng | null) => void;
  rotaCoords: LatLng[];
  setRotaCoords: (value: LatLng[]) => void;
  onDistanciaChange?: (km: number) => void;
};

type CliqueProps = {
  onClique: (ponto: LatLng) => void;
};

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function calcularDistanciaTotal(pontoEncontro: LatLng | null, rota: LatLng[]): number {
  const todos = pontoEncontro ? [pontoEncontro, ...rota] : rota;
  let total = 0;
  for (let i = 1; i < todos.length; i++) {
    total += haversineKm(todos[i - 1], todos[i]);
  }
  return total;
}

const iconePontoEncontro = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconeRota = new L.DivIcon({
  className: "",
  html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid white;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function AjustarMapa() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

// Componente simples — só captura o clique e delega para o pai decidir o que fazer
function CliqueMapa({ onClique }: CliqueProps) {
  useMapEvents({
    click(e) {
      onClique({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapaTreinoEditor({
  pontoEncontro,
  setPontoEncontro,
  rotaCoords,
  setRotaCoords,
  onDistanciaChange,
}: Props) {
  const [mounted, setMounted] = useState(false);
  // Estado interno para a distância — garante re-render do badge dentro deste componente
  const [distanciaKm, setDistanciaKm] = useState(0);
  // Ref para sempre ter os valores mais recentes dentro do callback do mapa
  const pontoRef = useRef(pontoEncontro);
  const rotaRef = useRef(rotaCoords);
  pontoRef.current = pontoEncontro;
  rotaRef.current = rotaCoords;

  useEffect(() => { setMounted(true); }, []);

  // Sempre que pontoEncontro ou rotaCoords mudam (ex: desfazer), recalcula
  useEffect(() => {
    const d = calcularDistanciaTotal(pontoEncontro, rotaCoords);
    setDistanciaKm(d);
    onDistanciaChange?.(d);
  }, [pontoEncontro, rotaCoords]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClique(novoPonto: LatLng) {
    if (pontoRef.current === null) {
      setPontoEncontro(novoPonto);
      // Com só 1 ponto ainda não há distância — o useEffect cuida do recálculo
    } else {
      const novaRota = [...rotaRef.current, novoPonto];
      setRotaCoords(novaRota);
    }
  }

  function desfazerUltimoPonto() {
    setRotaCoords(rotaCoords.slice(0, -1));
  }

  function limparTudo() {
    setPontoEncontro(null);
    setRotaCoords([]);
  }

  const center = useMemo<LatLngExpression>(() => {
    if (pontoEncontro) return [pontoEncontro.lat, pontoEncontro.lng];
    return [-3.7657, -49.6725];
  }, [pontoEncontro]);

  const positions: LatLngExpression[] = [
    ...(pontoEncontro ? [[pontoEncontro.lat, pontoEncontro.lng] as LatLngExpression] : []),
    ...rotaCoords.map((p) => [p.lat, p.lng] as LatLngExpression),
  ];

  if (!mounted) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Mapa do treino</p>
          <p className="mt-1 text-sm text-slate-500">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Mapa do treino</p>
            <p className="mt-1 text-sm text-slate-500">
              {pontoEncontro === null
                ? "Clique no mapa para marcar o ponto de encontro."
                : "Clique para adicionar pontos ao percurso."}
            </p>
          </div>

          {distanciaKm > 0 && (
            <div className="shrink-0 rounded-2xl bg-orange-50 border border-orange-200 px-3 py-2 text-center">
              <p className="text-xs text-orange-500 font-medium">Percurso</p>
              <p className="text-lg font-bold text-orange-600 leading-tight">
                {distanciaKm.toFixed(2)} km
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div style={{ height: "420px", width: "100%" }}>
          <MapContainer
            key="mapa-treino-editor"
            center={center}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <AjustarMapa />
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <CliqueMapa onClique={handleClique} />

            {pontoEncontro && (
              <Marker
                position={[pontoEncontro.lat, pontoEncontro.lng]}
                icon={iconePontoEncontro}
              />
            )}
            {rotaCoords.map((p, i) => (
              <Marker
                key={`${p.lat}-${p.lng}-${i}`}
                position={[p.lat, p.lng]}
                icon={iconeRota}
              />
            ))}
            {positions.length >= 2 && (
              <Polyline positions={positions} pathOptions={{ color: "#f97316", weight: 5 }} />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={desfazerUltimoPonto}
          disabled={rotaCoords.length === 0}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Desfazer último ponto
        </button>
        <button
          type="button"
          onClick={limparTudo}
          disabled={pontoEncontro === null && rotaCoords.length === 0}
          className="rounded-2xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Limpar rota
        </button>
      </div>
    </div>
  );
}
