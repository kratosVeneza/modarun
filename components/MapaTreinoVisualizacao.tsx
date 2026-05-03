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
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      // CARTO Voyager — mostra POIs (lojas, mercados, praças) com nomes
      L.default.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      // Marcador ponto de encontro (com estilo Moda Run — verde)
      const greenIcon = L.default.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;background:#5CC800;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(92,200,0,0.7);"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.default.marker([pontoEncontro.lat, pontoEncontro.lng], { icon: greenIcon }).addTo(map);

      // Marcadores da rota
      const iconeRota = L.default.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:#FF6B00;border:2px solid white;border-radius:50%;box-shadow:0 0 8px rgba(255,107,0,0.6);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
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
        L.default.polyline(pontos, { color: "#5CC800", weight: 4, opacity: 0.9 }).addTo(map);

        // Ajusta viewport para mostrar toda a rota
        const bounds = L.default.latLngBounds(pontos);
        map.fitBounds(bounds, { padding: [30, 30] });
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
      className="rounded-2xl overflow-hidden"
    />
  );
}
