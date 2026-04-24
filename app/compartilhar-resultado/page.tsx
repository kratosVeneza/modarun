"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type Registro = {
  id: number;
  data: string;
  tipo: string;
  distancia_km?: number;
  duracao_min?: number;
  pace_medio?: string;
  fc_media?: number;
  elevacao_m?: number;
  calorias?: number;
};

const TEMAS = [
  {
    id: "verde",
    label: "Moda Run",
    bg1: "#0D1117", bg2: "#1a3a0a",
    accent: "#5CC800", accent2: "#FF6B00",
    text: "#E6EDF3", sub: "#8B949E",
  },
  {
    id: "laranja",
    label: "Fire",
    bg1: "#0D0A00", bg2: "#2d1000",
    accent: "#FF6B00", accent2: "#FFB800",
    text: "#E6EDF3", sub: "#9B8B7E",
  },
  {
    id: "azul",
    label: "Night Run",
    bg1: "#050A1A", bg2: "#0a1a3a",
    accent: "#3B82F6", accent2: "#8B5CF6",
    text: "#E6EDF3", sub: "#6B7A8D",
  },
  {
    id: "dourado",
    label: "Champion",
    bg1: "#0D0900", bg2: "#1a1200",
    accent: "#FFB800", accent2: "#FF6B00",
    text: "#E6EDF3", sub: "#8B7E5E",
  },
];

function formatarData(d: string) {
  const [ano, m, dia] = d.split("-");
  return `${dia}/${m}/${ano}`;
}

function formatarDuracao(min: number) {
  if (min >= 60) return `${Math.floor(min / 60)}h${min % 60 > 0 ? String(min % 60).padStart(2, "0") : ""}`;
  return `${min}min`;
}

export default function CompartilharResultadoPage(): React.JSX.Element {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [temaAtivo, setTemaAtivo] = useState("verde");
  const [registroSelecionado, setRegistroSelecionado] = useState<Registro | null>(null);
  const [nomeAtleta, setNomeAtleta] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [gerado, setGerado] = useState(false);

  // Inputs manuais (caso não tenha histórico)
  const [manual, setManual] = useState({
    tipo: "Corrida",
    distancia: "",
    duracao: "",
    pace: "",
    fc: "",
    data: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
        const nome = user.user_metadata?.nome_exibicao || user.email?.split("@")[0] || "";
        setNomeAtleta(nome);
        if (user.email) {
          const { data: adm } = await supabase.from("admins").select("email").eq("email", user.email.toLowerCase()).single();
          setIsAdmin(!!adm);
        }
        const { data } = await supabase.from("historico_treinos").select("*").eq("user_id", user.id).order("data", { ascending: false }).limit(20);
        setRegistros(data || []);
      }
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line

  const tema = TEMAS.find(t => t.id === temaAtivo)!;

  const gerarImagem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Formato Stories (1080x1920) escalado para 540x960
    const W = 540, H = 960;
    canvas.width = W;
    canvas.height = H;

    // Fonte padrão (system)
    const fontBold = "bold 900 ";
    const fontNormal = "600 ";

    // Background gradiente
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, tema.bg1);
    grad.addColorStop(1, tema.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Grid pattern decorativo
    ctx.strokeStyle = tema.accent + "15";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Círculo decorativo direita
    const radGrad = ctx.createRadialGradient(W + 50, 200, 0, W + 50, 200, 350);
    radGrad.addColorStop(0, tema.accent + "25");
    radGrad.addColorStop(1, "transparent");
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, W, H);

    // Círculo decorativo esquerda embaixo
    const radGrad2 = ctx.createRadialGradient(-50, H - 100, 0, -50, H - 100, 250);
    radGrad2.addColorStop(0, tema.accent2 + "15");
    radGrad2.addColorStop(1, "transparent");
    ctx.fillStyle = radGrad2;
    ctx.fillRect(0, 0, W, H);

    // ─── HEADER ───────────────────────────────────────────
    // Linha accent topo
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
    lineGrad.addColorStop(0, tema.accent);
    lineGrad.addColorStop(1, tema.accent2);
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, 0, W, 4);

    // Logo texto
    ctx.fillStyle = tema.accent;
    ctx.font = fontBold + "28px 'Arial Black', sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillText("MODA", 40, 65);
    ctx.fillStyle = tema.accent2;
    ctx.fillText("RUN", 120, 65);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = tema.sub;
    ctx.font = fontNormal + "11px Arial, sans-serif";
    ctx.fillText("RUNNING & PERFORMANCE", 40, 82);

    // ─── BADGE ATIVIDADE ──────────────────────────────────
    const r = registroSelecionado;
    const distKm = r ? r.distancia_km : parseFloat(manual.distancia) || 0;
    const duracaoMin = r ? r.duracao_min : parseInt(manual.duracao) || 0;
    const paceStr = r ? r.pace_medio : manual.pace;
    const fcMedia = r ? r.fc_media : parseInt(manual.fc) || 0;
    const tipo = r ? r.tipo : manual.tipo;
    const dataStr = r ? r.data : manual.data;

    // Tipo de treino pill
    const pillW = 180;
    ctx.fillStyle = tema.accent + "20";
    ctx.beginPath();
    ctx.roundRect(40, 105, pillW, 32, 16);
    ctx.fill();
    ctx.strokeStyle = tema.accent + "40";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = tema.accent;
    ctx.font = fontBold + "14px 'Arial Black', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(tipo.toUpperCase(), 56, 127);
    ctx.letterSpacing = "0px";

    // Data
    ctx.fillStyle = tema.sub;
    ctx.font = fontNormal + "13px Arial, sans-serif";
    ctx.fillText(formatarData(dataStr), W - 40 - ctx.measureText(formatarData(dataStr)).width, 127);

    // ─── DISTÂNCIA PRINCIPAL ──────────────────────────────
    const distDisplay = distKm > 0 ? distKm.toFixed(2) : "—";
    ctx.fillStyle = tema.text;
    ctx.font = fontBold + "120px 'Arial Black', sans-serif";
    const distW = ctx.measureText(distDisplay).width;
    ctx.fillText(distDisplay, (W - distW) / 2, 310);
    ctx.fillStyle = tema.accent;
    ctx.font = fontBold + "28px 'Arial Black', sans-serif";
    ctx.letterSpacing = "4px";
    const kmW = ctx.measureText("KM").width;
    ctx.fillText("KM", (W - kmW) / 2, 350);
    ctx.letterSpacing = "0px";

    // Linha divisória
    const divGrad = ctx.createLinearGradient(0, 0, W, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.3, tema.accent + "60");
    divGrad.addColorStop(0.7, tema.accent2 + "60");
    divGrad.addColorStop(1, "transparent");
    ctx.fillStyle = divGrad;
    ctx.fillRect(40, 375, W - 80, 1);

    // ─── STATS GRID ───────────────────────────────────────
    const stats = [
      { label: "TEMPO", value: duracaoMin > 0 ? formatarDuracao(duracaoMin) : "—", icon: "⏱" },
      { label: "PACE", value: paceStr ? `${paceStr}/km` : "—", icon: "🎯" },
      { label: "FC MÉD.", value: fcMedia > 0 ? `${fcMedia} bpm` : "—", icon: "❤️" },
    ];

    const statW = (W - 80) / 3;
    stats.forEach((s, i) => {
      const x = 40 + i * statW;
      const y = 395;

      // Card
      ctx.fillStyle = "#FFFFFF08";
      ctx.beginPath();
      ctx.roundRect(x + 2, y, statW - 4, 90, 12);
      ctx.fill();

      // Label
      ctx.fillStyle = tema.sub;
      ctx.font = fontNormal + "11px Arial, sans-serif";
      ctx.letterSpacing = "1px";
      const lW = ctx.measureText(s.label).width;
      ctx.fillText(s.label, x + (statW - lW) / 2, y + 20);
      ctx.letterSpacing = "0px";

      // Value
      ctx.fillStyle = tema.text;
      ctx.font = fontBold + "22px 'Arial Black', sans-serif";
      const vW = ctx.measureText(s.value).width;
      ctx.fillText(s.value, x + (statW - vW) / 2, y + 62);
    });

    // ─── NOME DO ATLETA ───────────────────────────────────
    if (nomeAtleta) {
      ctx.fillStyle = tema.text;
      ctx.font = fontBold + "36px 'Arial Black', sans-serif";
      ctx.letterSpacing = "2px";
      const nameW = ctx.measureText(nomeAtleta.toUpperCase()).width;
      ctx.fillText(nomeAtleta.toUpperCase(), (W - nameW) / 2, 560);
      ctx.letterSpacing = "0px";
    }

    // ─── MENSAGEM PERSONALIZADA ───────────────────────────
    if (mensagem) {
      ctx.fillStyle = tema.sub;
      ctx.font = "italic 600 18px Georgia, serif";
      const msgW = ctx.measureText(`"${mensagem}"`).width;
      if (msgW < W - 80) {
        ctx.fillText(`"${mensagem}"`, (W - msgW) / 2, 600);
      } else {
        // Quebra de linha simples
        const palavras = mensagem.split(" ");
        let linha = "";
        let y = 595;
        for (const p of palavras) {
          const test = linha ? linha + " " + p : p;
          if (ctx.measureText(`"${test}"`).width > W - 80) {
            ctx.fillText(`"${linha}"`, (W - ctx.measureText(`"${linha}"`).width) / 2, y);
            y += 28;
            linha = p;
          } else {
            linha = test;
          }
        }
        if (linha) ctx.fillText(`"${linha}"`, (W - ctx.measureText(`"${linha}"`).width) / 2, y);
      }
    }

    // ─── MOTIVATIONAL BAR ─────────────────────────────────
    const barGrad = ctx.createLinearGradient(0, 0, W, 0);
    barGrad.addColorStop(0, tema.accent);
    barGrad.addColorStop(1, tema.accent2);
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(40, H - 220, W - 80, 60, 16);
    ctx.fill();

    ctx.fillStyle = "#000000aa";
    ctx.font = fontBold + "24px 'Arial Black', sans-serif";
    ctx.letterSpacing = "4px";
    const motW = ctx.measureText("CORRA NA MODA. VENÇA COM ESTILO.").width;
    ctx.fillText("CORRA NA MODA. VENÇA COM ESTILO.", (W - motW) / 2, H - 183);
    ctx.letterSpacing = "0px";

    // ─── FOOTER ───────────────────────────────────────────
    ctx.fillStyle = tema.sub;
    ctx.font = fontNormal + "13px Arial, sans-serif";
    const footer = "modarun.com.br";
    const fW = ctx.measureText(footer).width;
    ctx.fillText(footer, (W - fW) / 2, H - 60);

    // Linha accent bottom
    ctx.fillStyle = lineGrad;
    ctx.fillRect(0, H - 4, W, 4);

    setGerado(true);
  }, [tema, registroSelecionado, nomeAtleta, mensagem, manual]);

  function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `moda-run-resultado.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function compartilharWhatsApp() {
    const texto = encodeURIComponent("🏃 Treino concluído! Confira meu resultado no Moda Run 🔥\n\nmodarun.com.br");
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full" style={{ border: "3px solid rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #FF6B00, transparent)" }} />
          <div className="relative mx-auto max-w-4xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-black"
              style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.3)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>
              📸 COMPARTILHAR
            </div>
            <h1 className="text-4xl font-black sm:text-5xl" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", lineHeight: 1 }}>
              COMPARTILHAR <span style={{ color: "#FF6B00" }}>RESULTADO</span>
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#8B949E" }}>
              Gere uma imagem bonita para Stories, Instagram ou WhatsApp.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Configurações */}
            <div className="space-y-5">

              {/* Tema */}
              <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.12)" }}>
                <p className="font-black text-sm mb-3" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>🎨 TEMA</p>
                <div className="grid grid-cols-4 gap-2">
                  {TEMAS.map(t => (
                    <button key={t.id} onClick={() => { setTemaAtivo(t.id); setGerado(false); }}
                      className="rounded-xl py-3 px-2 text-xs font-black transition-all"
                      style={{
                        background: temaAtivo === t.id ? `${t.accent}20` : "#21262D",
                        border: `1px solid ${temaAtivo === t.id ? t.accent : "transparent"}`,
                        color: temaAtivo === t.id ? t.accent : "#8B949E",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        letterSpacing: "0.03em",
                      }}>
                      <div className="w-4 h-4 rounded-full mx-auto mb-1" style={{ background: t.accent }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selecionar do histórico ou manual */}
              <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.12)" }}>
                <p className="font-black text-sm mb-3" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>📊 DADOS DO TREINO</p>

                {registros.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-bold mb-2" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em" }}>SELECIONAR DO HISTÓRICO</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      <button onClick={() => { setRegistroSelecionado(null); setGerado(false); }}
                        className="w-full text-left rounded-xl px-3 py-2.5 text-xs font-bold transition-all"
                        style={{ background: !registroSelecionado ? "rgba(255,107,0,0.15)" : "#21262D", color: !registroSelecionado ? "#FF6B00" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        ✏️ Inserir manualmente
                      </button>
                      {registros.map(r => (
                        <button key={r.id} onClick={() => { setRegistroSelecionado(r); setGerado(false); }}
                          className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
                          style={{ background: registroSelecionado?.id === r.id ? "rgba(255,107,0,0.15)" : "#21262D", border: `1px solid ${registroSelecionado?.id === r.id ? "rgba(255,107,0,0.4)" : "transparent"}` }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black" style={{ color: registroSelecionado?.id === r.id ? "#FF6B00" : "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{r.tipo}</span>
                            <span className="text-xs" style={{ color: "#8B949E" }}>{formatarData(r.data)}</span>
                          </div>
                          <div className="flex gap-2 mt-0.5">
                            {r.distancia_km && <span className="text-xs" style={{ color: "#5CC800" }}>{r.distancia_km}km</span>}
                            {r.duracao_min && <span className="text-xs" style={{ color: "#8B949E" }}>{formatarDuracao(r.duracao_min)}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual */}
                {!registroSelecionado && (
                  <div className="grid gap-3">
                    {[
                      { label: "TIPO", field: "tipo" as const, type: "text", placeholder: "Ex: Corrida" },
                      { label: "DISTÂNCIA (km)", field: "distancia" as const, type: "number", placeholder: "Ex: 10.5" },
                      { label: "DURAÇÃO (min)", field: "duracao" as const, type: "number", placeholder: "Ex: 55" },
                      { label: "PACE MÉDIO", field: "pace" as const, type: "text", placeholder: "Ex: 5:30" },
                      { label: "FC MÉDIA", field: "fc" as const, type: "number", placeholder: "Ex: 155" },
                    ].map(f => (
                      <div key={f.field}>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8B949E", marginBottom: "4px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={manual[f.field]}
                          onChange={e => { setManual({ ...manual, [f.field]: e.target.value }); setGerado(false); }}
                          style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.2)", color: "#E6EDF3", borderRadius: "10px", padding: "8px 12px", fontSize: "13px", outline: "none", width: "100%", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nome e mensagem */}
              <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.12)" }}>
                <p className="font-black text-sm mb-3" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>✍️ PERSONALIZAR</p>
                <div className="space-y-3">
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8B949E", marginBottom: "4px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>SEU NOME</label>
                    <input type="text" placeholder="Ex: João Silva" value={nomeAtleta}
                      onChange={e => { setNomeAtleta(e.target.value); setGerado(false); }}
                      style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.2)", color: "#E6EDF3", borderRadius: "10px", padding: "8px 12px", fontSize: "14px", outline: "none", width: "100%", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#8B949E", marginBottom: "4px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>MENSAGEM (opcional)</label>
                    <input type="text" placeholder="Ex: Primeiro 10km da vida!" value={mensagem} maxLength={60}
                      onChange={e => { setMensagem(e.target.value); setGerado(false); }}
                      style={{ background: "#21262D", border: "1px solid rgba(255,107,0,0.2)", color: "#E6EDF3", borderRadius: "10px", padding: "8px 12px", fontSize: "14px", outline: "none", width: "100%", fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600 }} />
                  </div>
                </div>
              </div>

              <button onClick={gerarImagem} className="w-full rounded-xl py-4 font-black text-base transition-all hover:brightness-110 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #FF6B00, #cc5500)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", boxShadow: "0 4px 20px rgba(255,107,0,0.25)" }}>
                🎨 GERAR IMAGEM
              </button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="sticky top-24">
                <p className="font-black text-xs mb-3" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" }}>👁 PREVIEW</p>
                <div className="rounded-2xl overflow-hidden" style={{ background: "#21262D", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <canvas ref={canvasRef} className="w-full" style={{ display: "block", aspectRatio: "9/16" }} />
                  {!gerado && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(0,0,0,0.7)" }}>
                      <div className="text-center">
                        <p className="text-3xl mb-2">🎨</p>
                        <p className="text-sm font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>Clique em GERAR IMAGEM</p>
                      </div>
                    </div>
                  )}
                </div>

                {gerado && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button onClick={baixar}
                      className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-black text-sm transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                      ⬇️ BAIXAR
                    </button>
                    <button onClick={compartilharWhatsApp}
                      className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-black text-sm transition-all hover:brightness-110"
                      style={{ background: "linear-gradient(135deg, #25D366, #1ebe5d)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                      💬 WHATSAPP
                    </button>
                  </div>
                )}

                <p className="mt-3 text-xs text-center" style={{ color: "#8B949E" }}>
                  Imagem 1080×1920px • Formato Stories • PNG
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Link href="/historico" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
              <p className="text-xl mb-1">📈</p>
              <p className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>HISTÓRICO</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Ver meus treinos</p>
            </Link>
            <Link href="/calculadora-pace" className="rounded-xl p-4 transition-all hover:-translate-y-0.5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
              <p className="text-xl mb-1">⏱</p>
              <p className="font-black text-sm" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>CALCULADORA PACE</p>
              <p className="text-xs" style={{ color: "#8B949E" }}>Calcular ritmo</p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
