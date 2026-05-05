"use client";

import React, { useEffect, useState } from "react";
import { Flag, ShieldOff, Loader2, X } from "lucide-react";

type TipoDenuncia = "post" | "comentario" | "usuario" | "mensagem";

type DenunciarButtonProps = {
  tipo: TipoDenuncia;
  alvoId: string | number;
  alvoUserId?: string | null;
  postId?: number | null;
  comentarioId?: number | null;
  label?: string;
  compact?: boolean;
  className?: string;
};

const MOTIVOS = [
  { id: "spam", label: "Spam ou golpe" },
  { id: "ofensivo", label: "Conteúdo ofensivo" },
  { id: "assedio", label: "Assédio ou ataque pessoal" },
  { id: "inapropriado", label: "Conteúdo impróprio" },
  { id: "perfil_falso", label: "Perfil falso" },
  { id: "outro", label: "Outro motivo" },
];

function tituloTipo(tipo: TipoDenuncia) {
  if (tipo === "post") return "publicação";
  if (tipo === "comentario") return "comentário";
  if (tipo === "usuario") return "usuário";
  return "mensagem";
}

export function DenunciarButton({ tipo, alvoId, alvoUserId, postId, comentarioId, label, compact, className }: DenunciarButtonProps) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("spam");
  const [detalhes, setDetalhes] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  async function enviarDenuncia() {
    setErro("");
    setEnviando(true);
    try {
      const res = await fetch("/api/moderacao/denuncias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tipo,
          alvo_id: String(alvoId),
          alvo_user_id: alvoUserId || null,
          post_id: postId || (tipo === "post" ? Number(alvoId) : null),
          comentario_id: comentarioId || (tipo === "comentario" ? Number(alvoId) : null),
          motivo,
          detalhes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível enviar a denúncia.");
      setSucesso(true);
      setTimeout(() => {
        setAberto(false);
        setSucesso(false);
        setDetalhes("");
      }, 1300);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao denunciar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={className || "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-colors hover:bg-orange-500/10"}
        style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}
        title={`Denunciar ${tituloTipo(tipo)}`}
      >
        <Flag size={compact ? 12 : 14} strokeWidth={2} />
        {!compact && (label || "DENUNCIAR")}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.25)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <p className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>DENÚNCIA</p>
                <h3 className="font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>Denunciar {tituloTipo(tipo)}</h3>
              </div>
              <button onClick={() => setAberto(false)} className="rounded-lg p-1 hover:bg-white/5" style={{ color: "#8B949E" }}><X size={18} /></button>
            </div>

            <div className="space-y-3 p-4">
              {sucesso ? (
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(92,200,0,0.08)", border: "1px solid rgba(92,200,0,0.25)", color: "#5CC800" }}>
                  Denúncia enviada para análise do admin.
                </div>
              ) : (
                <>
                  <p className="text-sm" style={{ color: "#8B949E" }}>Escolha o motivo. O conteúdo não será removido automaticamente; o admin irá avaliar.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {MOTIVOS.map(m => (
                      <button key={m.id} type="button" onClick={() => setMotivo(m.id)}
                        className="rounded-xl px-3 py-2 text-left text-sm transition-colors"
                        style={{ background: motivo === m.id ? "rgba(255,107,0,0.12)" : "#21262D", border: motivo === m.id ? "1px solid rgba(255,107,0,0.4)" : "1px solid rgba(255,255,255,0.06)", color: motivo === m.id ? "#FF6B00" : "#C9D1D9" }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <textarea value={detalhes} onChange={e => setDetalhes(e.target.value)} rows={3}
                    placeholder="Detalhes opcionais para o admin..."
                    className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "#21262D", border: "1px solid rgba(255,255,255,0.08)", color: "#E6EDF3" }} />
                  {erro && <p className="text-sm" style={{ color: "#FF6B00" }}>{erro}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setAberto(false)} className="flex-1 rounded-xl px-4 py-2 text-sm font-black" style={{ color: "#8B949E", background: "#21262D", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                    <button onClick={enviarDenuncia} disabled={enviando} className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-60" style={{ color: "#fff", background: "linear-gradient(135deg,#FF6B00,#cc5500)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {enviando && <Loader2 size={14} className="animate-spin" />} ENVIAR
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function BloquearUsuarioButton({ userId, nome, onBloqueado }: { userId: string; nome?: string | null; onBloqueado?: () => void }) {
  const [bloqueado, setBloqueado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [checado, setChecado] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch(`/api/moderacao/bloqueios?user_id=${encodeURIComponent(userId)}`, { credentials: "include", cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (ativo && data) setBloqueado(!!data.bloqueado); })
      .finally(() => { if (ativo) setChecado(true); });
    return () => { ativo = false; };
  }, [userId]);

  async function alternar() {
    const acao = bloqueado ? "desbloquear" : "bloquear";
    if (!bloqueado && !confirm(`Bloquear ${nome || "este usuário"}? Ele será removido dos seus seguidores/seguindo e você evitará interações indesejadas.`)) return;
    setCarregando(true);
    const res = await fetch("/api/moderacao/bloqueios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ bloqueado_id: userId, acao }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) alert(data.error || "Não foi possível atualizar o bloqueio.");
    else {
      setBloqueado(!!data.bloqueado);
      if (data.bloqueado) onBloqueado?.();
    }
    setCarregando(false);
  }

  if (!checado) return null;

  return (
    <button type="button" onClick={alternar} disabled={carregando}
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110 disabled:opacity-60"
      style={{ background: bloqueado ? "rgba(92,200,0,0.1)" : "rgba(255,107,0,0.1)", color: bloqueado ? "#5CC800" : "#FF6B00", border: bloqueado ? "1px solid rgba(92,200,0,0.3)" : "1px solid rgba(255,107,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
      {carregando ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={15} strokeWidth={2} />}
      {bloqueado ? "DESBLOQUEAR" : "BLOQUEAR"}
    </button>
  );
}
