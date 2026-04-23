"use client";

import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };
type Props = {
  pontoEncontro: LatLng | null;
  setPontoEncontro: (p: LatLng | null) => void;
  rotaCoords: LatLng[];
  setRotaCoords: (r: LatLng[]) => void;
  onDistanciaChange: (d: number) => void;
};

function haversine(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function calcularDistancia(ponto: LatLng | null, rota: LatLng[]): number {
  if (!ponto || rota.length === 0) return 0;
  const todos = [ponto, ...rota];
  let total = 0;
  for (let i = 1; i < todos.length; i++) total += haversine(todos[i - 1], todos[i]);
  return total;
}

export default function MapaTreinoEditor({ pontoEncontro, setPontoEncontro, rotaCoords, setRotaCoords, onDistanciaChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const LRef = useRef<unknown>(null);
  const polylineRef = useRef<unknown>(null);
  const pontoMarkerRef = useRef<unknown>(null);
  const rotaMarcadoresRef = useRef<unknown[]>([]);

  // Always-fresh refs for state and callbacks
  const pontoRef = useRef(pontoEncontro);
  const rotaRef = useRef(rotaCoords);
  const setPontoRef = useRef(setPontoEncontro);
  const setRotaRef = useRef(setRotaCoords);
  const onDistanciaRef = useRef(onDistanciaChange);

  // Keep refs in sync with props
  pontoRef.current = pontoEncontro;
  rotaRef.current = rotaCoords;
  setPontoRef.current = setPontoEncontro;
  setRotaRef.current = setRotaCoords;
  onDistanciaRef.current = onDistanciaChange;

  function atualizarPolyline(L2: unknown, map2: unknown, ponto: LatLng | null, rota: LatLng[]) {
    if (polylineRef.current) (polylineRef.current as { remove: () => void }).remove();
    polylineRef.current = null;
    if (!ponto || rota.length === 0) return;
    const pontos: [number, number][] = [[ponto.lat, ponto.lng], ...rota.map(p => [p.lat, p.lng] as [number, number])];
    const L = L2 as { polyline: (p: [number,number][], opts: object) => { addTo: (m: unknown) => unknown } };
    polylineRef.current = L.polyline(pontos, { color: "#5CC800", weight: 4, opacity: 0.9 }).addTo(map2 as unknown);
  }

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    import("leaflet").then((L) => {
      if (mapRef.current || !containerRef.current) return;
      LRef.current = L.default;

      const DefaultIcon = L.default.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete DefaultIcon._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.default.map(containerRef.current!, { center: [-3.767, -49.672], zoom: 14, zoomControl: true });
      mapRef.current = map;

      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const latlng: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        const L2 = LRef.current as typeof L.default;

        if (!pontoMarkerRef.current) {
          // Primeiro clique = ponto de encontro
          const greenIcon = L2.divIcon({
            className: "",
            html: `<div style="width:22px;height:22px;background:#5CC800;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(92,200,0,0.7);"></div>`,
            iconSize: [22, 22], iconAnchor: [11, 11],
          });
          pontoMarkerRef.current = L2.marker([latlng.lat, latlng.lng], { icon: greenIcon }).addTo(map);
          setPontoRef.current(latlng);
          onDistanciaRef.current(0); // ponto só, sem rota ainda

        } else {
          // Cliques seguintes = rota
          const rotaIcon = L2.divIcon({
            className: "",
            html: `<div style="width:14px;height:14px;background:#FF6B00;border:2px solid #fff;border-radius:50%;box-shadow:0 0 8px rgba(255,107,0,0.6);"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
          });
          const marker = L2.marker([latlng.lat, latlng.lng], { icon: rotaIcon }).addTo(map);
          rotaMarcadoresRef.current.push(marker);

          const novaRota = [...rotaRef.current, latlng];
          setRotaRef.current(novaRota);

          // Draw polyline
          const ponto = pontoRef.current;
          atualizarPolyline(L2, map, ponto, novaRota);

          // Update distance
          const dist = calcularDistancia(ponto, novaRota);
          onDistanciaRef.current(dist);
        }
      });

      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        pontoMarkerRef.current = null;
        rotaMarcadoresRef.current = [];
        polylineRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function desfazer() {
    if (rotaMarcadoresRef.current.length > 0) {
      const ultimo = rotaMarcadoresRef.current.pop();
      (ultimo as { remove: () => void }).remove();
      const novaRota = rotaRef.current.slice(0, -1);
      setRotaRef.current(novaRota);
      atualizarPolyline(LRef.current, mapRef.current, pontoRef.current, novaRota);
      onDistanciaRef.current(calcularDistancia(pontoRef.current, novaRota));
    } else if (pontoMarkerRef.current) {
      (pontoMarkerRef.current as { remove: () => void }).remove();
      pontoMarkerRef.current = null;
      setPontoRef.current(null);
      onDistanciaRef.current(0);
    }
  }

  function limpar() {
    rotaMarcadoresRef.current.forEach(m => (m as { remove: () => void }).remove());
    rotaMarcadoresRef.current = [];
    if (pontoMarkerRef.current) { (pontoMarkerRef.current as { remove: () => void }).remove(); pontoMarkerRef.current = null; }
    if (polylineRef.current) { (polylineRef.current as { remove: () => void }).remove(); polylineRef.current = null; }
    setPontoRef.current(null);
    setRotaRef.current([]);
    onDistanciaRef.current(0);
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(92,200,0,0.2)" }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ background: "#21262D", borderBottom: "1px solid rgba(92,200,0,0.15)" }}>
          <div>
            <p className="text-xs font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>🗺 MAPA DO TREINO</p>
            <p className="text-xs" style={{ color: "#8B949E" }}>
              {!pontoEncontro ? "1° clique = ponto de encontro 📍" : rotaCoords.length === 0 ? "Próximos cliques = traçar rota 🟠" : `Rota: ${rotaCoords.length} ponto${rotaCoords.length > 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={desfazer}
              className="rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              ↩ DESFAZER
            </button>
            <button type="button" onClick={limpar}
              className="rounded-lg px-3 py-1.5 text-xs font-bold"
              style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              🗑 LIMPAR
            </button>
          </div>
        </div>
        <div ref={containerRef} style={{ height: "300px", width: "100%" }} />
      </div>
    </div>
  );
}
