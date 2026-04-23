"use client";

import { useEffect, useRef, useCallback } from "react";

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
  if (!ponto) return 0;
  const todos = [ponto, ...rota];
  let total = 0;
  for (let i = 1; i < todos.length; i++) total += haversine(todos[i - 1], todos[i]);
  return total;
}

export default function MapaTreinoEditor({ pontoEncontro, setPontoEncontro, rotaCoords, setRotaCoords, onDistanciaChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const pontoMarkerRef = useRef<unknown>(null);
  const rotaMarcadoresRef = useRef<unknown[]>([]);
  const polylineRef = useRef<unknown>(null);
  const LRef = useRef<unknown>(null);

  // Use ref to always call latest onDistanciaChange
  const onDistanciaRef = useRef(onDistanciaChange);
  onDistanciaRef.current = onDistanciaChange;
  const atualizarDistancia = useCallback((ponto: LatLng | null, rota: LatLng[]) => {
    onDistanciaRef.current(calcularDistancia(ponto, rota));
  }, []);

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

      // Default to Tucuruí/PA
      const map = L.default.map(containerRef.current!, { center: [-3.767, -49.672], zoom: 14, zoomControl: true });
      mapRef.current = map;

      // OpenStreetMap standard tile - best readability
      L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const latlng: LatLng = { lat: e.latlng.lat, lng: e.latlng.lng };
        const L2 = LRef.current as typeof L.default;
        const map2 = mapRef.current as ReturnType<typeof L.default.map>;

        if (!pontoMarkerRef.current) {
          // Primeiro clique = ponto de encontro
          const greenIcon = L2.divIcon({
            className: "",
            html: `<div style="width:20px;height:20px;background:#5CC800;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(92,200,0,0.6);"></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10],
          });
          pontoMarkerRef.current = L2.marker([latlng.lat, latlng.lng], { icon: greenIcon }).addTo(map2);
          setPontoEncontro(latlng);
          atualizarDistancia(latlng, rotaCoords);
        } else {
          // Cliques seguintes = rota
          const rotaIcon = L2.divIcon({
            className: "",
            html: `<div style="width:12px;height:12px;background:#FF6B00;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(255,107,0,0.5);"></div>`,
            iconSize: [12, 12], iconAnchor: [6, 6],
          });
          const marker = L2.marker([latlng.lat, latlng.lng], { icon: rotaIcon }).addTo(map2);
          rotaMarcadoresRef.current.push(marker);
          const novaRota = [...rotaCoords, latlng];
          setRotaCoords(novaRota);

          // Update polyline
          if (polylineRef.current) (polylineRef.current as { remove: () => void }).remove();
          const ponto = pontoEncontro;
          if (ponto) {
            const pontos: [number, number][] = [[ponto.lat, ponto.lng], ...novaRota.map(p => [p.lat, p.lng] as [number, number])];
            polylineRef.current = L2.polyline(pontos, { color: "#5CC800", weight: 3, opacity: 0.8, dashArray: "8, 4" }).addTo(map2);
          }
          atualizarDistancia(pontoEncontro, novaRota);
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

  function desfazerUltimoPonto() {
    if (rotaMarcadoresRef.current.length > 0) {
      const ultimo = rotaMarcadoresRef.current.pop();
      (ultimo as { remove: () => void }).remove();
      const novaRota = rotaCoords.slice(0, -1);
      setRotaCoords(novaRota);
      if (polylineRef.current) (polylineRef.current as { remove: () => void }).remove();
      if (pontoEncontro && novaRota.length > 0) {
        const L2 = LRef.current as { polyline: (p: [number,number][], opts: object) => { addTo: (m: unknown) => unknown } };
        const pontos: [number, number][] = [[pontoEncontro.lat, pontoEncontro.lng], ...novaRota.map(p => [p.lat, p.lng] as [number, number])];
        polylineRef.current = L2.polyline(pontos, { color: "#5CC800", weight: 3, opacity: 0.8, dashArray: "8, 4" }).addTo(mapRef.current as unknown);
      }
      atualizarDistancia(pontoEncontro, novaRota);
    } else if (pontoMarkerRef.current) {
      (pontoMarkerRef.current as { remove: () => void }).remove();
      pontoMarkerRef.current = null;
      setPontoEncontro(null);
      atualizarDistancia(null, []);
    }
  }

  function limparRota() {
    rotaMarcadoresRef.current.forEach(m => (m as { remove: () => void }).remove());
    rotaMarcadoresRef.current = [];
    if (pontoMarkerRef.current) {
      (pontoMarkerRef.current as { remove: () => void }).remove();
      pontoMarkerRef.current = null;
    }
    if (polylineRef.current) {
      (polylineRef.current as { remove: () => void }).remove();
      polylineRef.current = null;
    }
    setRotaCoords([]);
    setPontoEncontro(null);
    atualizarDistancia(null, []);
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(92,200,0,0.2)" }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ background: "#21262D", borderBottom: "1px solid rgba(92,200,0,0.15)" }}>
          <div>
            <p className="text-xs font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>🗺 MAPA DO TREINO</p>
            <p className="text-xs" style={{ color: "#8B949E" }}>
              {!pontoEncontro ? "1° clique = ponto de encontro 📍" : "Próximos cliques = traçar rota 🟠"}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={desfazerUltimoPonto}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              style={{ background: "rgba(255,184,0,0.1)", color: "#FFB800", border: "1px solid rgba(255,184,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              ↩ DESFAZER
            </button>
            <button type="button" onClick={limparRota}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              🗑 LIMPAR
            </button>
          </div>
        </div>
        <div ref={containerRef} style={{ height: "280px", width: "100%" }} />
      </div>
    </div>
  );
}
