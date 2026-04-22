"use client";

import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };

type Props = {
  pontoEncontro: LatLng | null;
  rotaCoords: LatLng[];
};

export default function MapaTreinoVisualizacao({ pontoEncontro, rotaCoords }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!pontoEncontro || !containerRef.current || mapRef.current) return;

    // Import dinâmico só no browser — resolve o "window is not defined"
    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix ícones
      const DefaultIcon = L.default.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete DefaultIcon._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.default.map(containerRef.current!, {
        center: [pontoEncontro.lat, pontoEncontro.lng],
        zoom: 14,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // Marcador ponto de encontro
      L.default.marker([pontoEncontro.lat, pontoEncontro.lng]).addTo(map);

      // Marcadores da rota
      const iconeRota = L.default.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;background:#2563eb;border:2px solid white;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      rotaCoords.forEach((p) => {
        L.default.marker([p.lat, p.lng], { icon: iconeRota }).addTo(map);
      });

      // Polyline
      if (rotaCoords.length > 0) {
        const pontos: [number, number][] = [
          [pontoEncontro.lat, pontoEncontro.lng],
          ...rotaCoords.map((p) => [p.lat, p.lng] as [number, number]),
        ];
        L.default.polyline(pontos, { color: "#f97316", weight: 4 }).addTo(map);
      }

      // Ajusta tamanho
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pontoEncontro) return null;

  return (
    <div
      ref={containerRef}
      style={{ height: "300px", width: "100%" }}
      className="rounded-2xl overflow-hidden border border-slate-200"
    />
  );
}
