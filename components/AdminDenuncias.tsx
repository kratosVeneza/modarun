"use client";

import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react";

type Denuncia = {
  id: number;
  created_at?: string;
  tipo: string;
  alvo_id: string;
  alvo_user_id?: string | null;
  post_id?: number | null;
  comentario_id?: number | null;
  motivo?: string | null;
  detalhes?: string | null;
  status?: string | null;
  denunciante_email?: string | null;
  acao_tomada?: string | null;
};

function dataBR(v?: string) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); }
  catch { return v; }
}

function labelTipo(tipo: string) {
  if (tipo === "post") return "Publicação";
  if (tipo === "comentario") return "Comentário";
  if (tipo === "usuario") return "Usuário";
  if (tipo === "mensagem") return "Mensagem";
  return tipo;
}

export default function AdminDenuncias(): React.JSX.Element {
  const [status, setStatus] = useState<"pendente" | "todas" | "resolvida" | "ignorada">("pendente");
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [acaoId, setAcaoId] = useState<number | null>(null);

  async function carregar() {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch(`/api/moderacao/denuncias?status=${status}`, { credentials: "include", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao carregar denúncias.");
      setDenuncias(data.denuncias || []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar denúncias.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function executar(id: number, acao: "resolver" | "ignorar" | "remover_conteudo") {
    const texto = acao === "remover_conteudo" ? "Remover o conteúdo denunciado? Esta ação não pode ser desfeita." : "Confirmar ação nesta denúncia?";
    if (!confirm(texto)) return;
    setAcaoId(id);
    try {
      const res = await fetch("/api/moderacao/denuncias", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, acao }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao executar ação.");
      await carregar();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao executar ação.");
    } finally {
      setAcaoId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,107,0,0.2)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>MODERAÇÃO</p>
            <h2 className="text-xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>Denúncias recebidas</h2>
            <p className="text-sm" style={{ color: "#8B949E" }}>Analise denúncias e remova publicações ou comentários indevidos.</p>
          </div>
          <button onClick={carregar} disabled={carregando} className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black disabled:opacity-60" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
            {carregando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} ATUALIZAR
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["pendente", "todas", "resolvida", "ignorada"] as const).map(s => (
            <button key={s} onClick={() => setStatus(s)} className="rounded-xl px-3 py-2 text-xs font-black" style={{ background: status === s ? "rgba(255,107,0,0.15)" : "#21262D", color: status === s ? "#FF6B00" : "#8B949E", border: status === s ? "1px solid rgba(255,107,0,0.35)" : "1px solid rgba(255,255,255,0.06)", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {erro && <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,107,0,0.08)", border: "1px solid rgba(255,107,0,0.25)", color: "#FF6B00" }}>{erro}</div>}

      {carregando ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: "#5CC800" }} /></div>
      ) : denuncias.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.18)" }}>
          <p className="text-4xl mb-2">🛡️</p>
          <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>Nenhuma denúncia encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {denuncias.map(d => (
            <article key={d.id} className="rounded-2xl p-4" style={{ background: "#161B22", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,107,0,0.12)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{labelTipo(d.tipo)}</span>
                    <span className="rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "rgba(92,200,0,0.08)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{d.status || "pendente"}</span>
                    <span className="text-xs" style={{ color: "#8B949E" }}>{dataBR(d.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: "#E6EDF3" }}><b>Motivo:</b> {d.motivo || "—"}</p>
                  {d.detalhes && <p className="mt-1 break-words text-sm" style={{ color: "#C9D1D9" }}>{d.detalhes}</p>}
                  <div className="mt-2 grid gap-1 text-xs" style={{ color: "#8B949E" }}>
                    <span>Alvo: {d.alvo_id}</span>
                    {d.post_id ? <span>Post: #{d.post_id}</span> : null}
                    {d.comentario_id ? <span>Comentário: #{d.comentario_id}</span> : null}
                    {d.alvo_user_id ? <span>Usuário denunciado: {d.alvo_user_id}</span> : null}
                    {d.denunciante_email ? <span>Denunciante: {d.denunciante_email}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {(d.tipo === "post" || d.tipo === "comentario") && d.status === "pendente" && (
                    <button onClick={() => executar(d.id, "remover_conteudo")} disabled={acaoId === d.id} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black disabled:opacity-60" style={{ background: "rgba(255,107,0,0.12)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {acaoId === d.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} REMOVER
                    </button>
                  )}
                  {d.status === "pendente" && (
                    <>
                      <button onClick={() => executar(d.id, "resolver")} disabled={acaoId === d.id} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black disabled:opacity-60" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <CheckCircle2 size={13} /> RESOLVER
                      </button>
                      <button onClick={() => executar(d.id, "ignorar")} disabled={acaoId === d.id} className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black disabled:opacity-60" style={{ background: "#21262D", color: "#8B949E", border: "1px solid rgba(255,255,255,0.06)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        <XCircle size={13} /> IGNORAR
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
