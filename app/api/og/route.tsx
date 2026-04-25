// app/api/og/route.tsx
// OG Image dinâmica — usa next/og nativo (sem dependência extra)
// Rota: /api/og?titulo=Meu+Treino&cidade=Belem&estado=PA&data=12/05&tipo=Corrida&km=10

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const titulo   = searchParams.get("titulo") || "Treino em Grupo";
  const cidade   = searchParams.get("cidade") || "";
  const estado   = searchParams.get("estado") || "";
  const data     = searchParams.get("data")   || "";
  const tipo     = searchParams.get("tipo")   || "Corrida";
  const km       = searchParams.get("km")     || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "linear-gradient(135deg, #0D1117 0%, #161B22 60%, #0D1117 100%)",
          display: "flex",
          flexDirection: "column",
          padding: "60px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Linha topo */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
          <div style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", borderRadius: "12px", padding: "10px 16px", color: "#fff", fontWeight: 900, fontSize: "20px", letterSpacing: "2px" }}>
            MR
          </div>
          <div style={{ color: "#5CC800", fontWeight: 900, fontSize: "22px", letterSpacing: "3px" }}>
            MODA{" "}<span style={{ color: "#FF6B00" }}>RUN</span>
          </div>
        </div>

        {/* Badge tipo */}
        <div style={{ display: "flex", background: "rgba(92,200,0,0.15)", border: "1px solid rgba(92,200,0,0.4)", borderRadius: "999px", padding: "8px 20px", width: "fit-content", color: "#5CC800", fontWeight: 700, fontSize: "16px", letterSpacing: "2px", marginBottom: "24px" }}>
          {tipo.toUpperCase()}{km ? ` · ${km}KM` : ""}
        </div>

        {/* Título */}
        <div style={{ color: "#E6EDF3", fontWeight: 900, fontSize: "62px", lineHeight: 1.05, marginBottom: "28px", maxWidth: "900px" }}>
          {titulo}
        </div>

        {/* Info chips */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {cidade && estado && (
            <div style={{ background: "#21262D", borderRadius: "12px", padding: "10px 20px", color: "#8B949E", fontSize: "20px", fontWeight: 700 }}>
              {cidade}/{estado}
            </div>
          )}
          {data && (
            <div style={{ background: "#21262D", borderRadius: "12px", padding: "10px 20px", color: "#5CC800", fontSize: "20px", fontWeight: 700 }}>
              {data}
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{ position: "absolute", bottom: "60px", right: "60px", background: "linear-gradient(135deg, #5CC800, #4aaa00)", borderRadius: "16px", padding: "16px 32px", color: "#fff", fontWeight: 900, fontSize: "22px", letterSpacing: "2px" }}>
          CONFIRMAR PRESENCA
        </div>

        {/* URL */}
        <div style={{ position: "absolute", bottom: "72px", left: "60px", color: "rgba(255,255,255,0.25)", fontSize: "16px" }}>
          modarun.com.br
        </div>

        {/* Linha bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #5CC800, #FF6B00)" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
