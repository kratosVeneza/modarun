"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Users, X } from "lucide-react";

type TipoLista = "seguidores" | "seguindo";

type UsuarioLista = {
  id: string;
  nome: string | null;
  avatar: string | null;
  email: string | null;
  viewer_segue?: boolean;
};

function nomeExibicao(usuario: UsuarioLista) {
  return usuario.nome || usuario.email?.split("@")[0] || "Corredor";
}

export default function SeguidoresModal({
  aberto,
  tipo,
  userId,
  onClose,
}: {
  aberto: boolean;
  tipo: TipoLista;
  userId: string | null;
  onClose: () => void;
}) {
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!aberto || !userId) return;

    let cancelado = false;
    setLoading(true);
    setErro("");

    fetch(`/api/feed/follows?user_id=${encodeURIComponent(userId)}&lista=${tipo}`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Não foi possível carregar a lista.");
        if (!cancelado) setUsuarios(data.usuarios || []);
      })
      .catch((e) => {
        if (!cancelado) setErro(e instanceof Error ? e.message : "Erro ao carregar lista.");
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => { cancelado = true; };
  }, [aberto, tipo, userId]);

  if (!aberto) return null;

  const titulo = tipo === "seguidores" ? "Seguidores" : "Seguindo";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6" style={{ background: "rgba(0,0,0,0.72)" }} onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>{titulo.toUpperCase()}</p>
            <p className="text-xs" style={{ color: "#8B949E" }}>Clique em uma pessoa para abrir o perfil.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 transition hover:bg-white/5" style={{ color: "#8B949E" }} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "#8B949E" }}>
              <Loader2 size={18} className="animate-spin" /> Carregando...
            </div>
          ) : erro ? (
            <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,107,0,0.08)", color: "#FFB800", border: "1px solid rgba(255,107,0,0.2)" }}>{erro}</div>
          ) : usuarios.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "#0D1117", border: "1px dashed rgba(92,200,0,0.18)" }}>
              <Users className="mx-auto mb-3" size={30} style={{ color: "#5CC800" }} />
              <p className="font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>Nenhum usuário encontrado</p>
              <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>{tipo === "seguidores" ? "Este perfil ainda não tem seguidores." : "Este perfil ainda não segue ninguém."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {usuarios.map((usuario) => {
                const nome = nomeExibicao(usuario);
                return (
                  <Link key={usuario.id} href={`/perfil/${usuario.id}`} onClick={onClose} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.04)" }}>
                    {usuario.avatar ? (
                      <img src={usuario.avatar} alt={nome} className="h-11 w-11 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded-full text-lg font-black" style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {nome[0]?.toUpperCase() || "C"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{nome}</p>
                      {usuario.email && <p className="truncate text-xs" style={{ color: "#8B949E" }}>{usuario.email}</p>}
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "rgba(92,200,0,0.12)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.25)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      VER PERFIL
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
