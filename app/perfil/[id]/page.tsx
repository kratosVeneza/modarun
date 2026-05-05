"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { DenunciarButton, BloquearUsuarioButton } from "@/components/Moderacao";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, Share2, Users, Loader2 } from "lucide-react";

type Usuario = {
  id: string; nome: string | null; avatar: string | null; email: string | null;
  seguidores: number; seguindo: number; total_posts: number; viewer_segue: boolean;
};

type Post = {
  id: number; tipo: string; texto: string | null; fotos: string[];
  atividade_distancia: number | null; atividade_tempo: string | null; atividade_pace: string | null; atividade_tipo: string | null;
  total_curtidas: number; total_comentarios: number; created_at: string;
  autor_nome: string | null; autor_avatar: string | null;
};

function tempoRelativo(data: string): string {
  const diff = Date.now() - new Date(data).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function nomeExibicao(nome: string | null, email: string | null): string {
  if (nome) return nome;
  if (email) return email.split("@")[0];
  return "Corredor";
}

export default function PerfilPublicoPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const supabase = createClient();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [seguindo, setSeguindo] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [viewer, setViewer] = useState<{ id: string; email?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwn, setIsOwn] = useState(false);

  const carregar = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setViewer({ id: user.id, email: user.email });
      if (user.id === id) { setIsOwn(true); router.replace("/perfil"); return; }
      const { data: adm } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
      setIsAdmin(!!adm);
    }

    const res = await fetch(`/api/usuarios?id=${id}${user ? `&viewer_id=${user.id}` : ""}`, { cache: "no-store", credentials: "include" });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setUsuario(data.usuario);
    setSeguindo(data.usuario.viewer_segue);

    const { data: postsData } = await supabase
      .from("feed_posts_view")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    setPosts(postsData || []);
    setLoading(false);
  }, [id]); // eslint-disable-line

  useEffect(() => { carregar(); }, [carregar]);

  async function toggleFollow() {
    if (!viewer || loadingFollow) return;
    setLoadingFollow(true);
    const acao = seguindo ? "desseguir" : "seguir";

    try {
      const res = await fetch("/api/feed/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ following_id: id, acao }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Não foi possível atualizar o seguimento.");
        return;
      }

      // A API já devolve o estado persistido no banco. Em seguida fazemos
      // uma leitura de confirmação para evitar que o botão fique apenas “visual”.
      let viewerSeguePersistido = !!data.viewer_segue;
      let seguidoresPersistidos = typeof data.seguidores === "number" ? data.seguidores : usuario?.seguidores ?? 0;
      let seguindoPersistido = typeof data.seguindo === "number" ? data.seguindo : usuario?.seguindo ?? 0;

      const conferir = await fetch(`/api/feed/follows?user_id=${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      const conf = await conferir.json().catch(() => ({}));
      if (conferir.ok) {
        viewerSeguePersistido = !!conf.viewer_segue;
        seguidoresPersistidos = typeof conf.seguidores === "number" ? conf.seguidores : seguidoresPersistidos;
        seguindoPersistido = typeof conf.seguindo === "number" ? conf.seguindo : seguindoPersistido;
      }

      setSeguindo(viewerSeguePersistido);
      setUsuario(u => u ? {
        ...u,
        seguidores: seguidoresPersistidos,
        seguindo: seguindoPersistido,
        viewer_segue: viewerSeguePersistido,
      } : u);
    } finally {
      setLoadingFollow(false);
    }
  }

  if (loading) return (
    <>
      <Header userEmail={viewer?.email} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  if (!usuario) return (
    <>
      <Header userEmail={viewer?.email} isAdmin={isAdmin} />
      <main className="flex min-h-screen flex-col items-center justify-center gap-4" style={{ background: "#0D1117" }}>
        <p className="text-4xl">👤</p>
        <p className="font-black text-lg" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>USUÁRIO NÃO ENCONTRADO</p>
        <Link href="/" className="rounded-xl px-5 py-2.5 font-black text-sm"
          style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
          ← VOLTAR
        </Link>
      </main>
    </>
  );

  const nome = nomeExibicao(usuario.nome, usuario.email);

  return (
    <>
      <Header userEmail={viewer?.email} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-2xl">
            <button onClick={() => router.back()} className="flex items-center gap-1.5 mb-5 text-sm font-black transition-colors hover:opacity-70"
              style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
              <ArrowLeft size={16} strokeWidth={2} /> VOLTAR
            </button>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-2xl overflow-hidden"
                  style={{ boxShadow: usuario.avatar ? "0 0 0 3px #5CC800" : "0 0 0 3px rgba(92,200,0,0.3)" }}>
                  {usuario.avatar ? (
                    <img src={usuario.avatar} alt={nome} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black"
                      style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {nome[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-black mb-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{nome}</h1>
                {usuario.email && <p className="text-sm mb-3" style={{ color: "#8B949E" }}>{usuario.email}</p>}

                {/* Contadores */}
                <div className="flex items-center gap-5 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-black leading-none" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{usuario.total_posts}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>POSTS</p>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="text-center">
                    <p className="text-xl font-black leading-none" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{usuario.seguidores}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>SEGUIDORES</p>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div className="text-center">
                    <p className="text-xl font-black leading-none" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{usuario.seguindo}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>SEGUINDO</p>
                  </div>
                </div>

                {/* Botão seguir */}
                {viewer && !isOwn && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={toggleFollow} disabled={loadingFollow}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-sm transition-all hover:scale-105 disabled:opacity-60"
                      style={{
                        background: seguindo ? "rgba(92,200,0,0.15)" : "linear-gradient(135deg, #5CC800, #4aaa00)",
                        color: seguindo ? "#5CC800" : "#fff",
                        border: seguindo ? "2px solid rgba(92,200,0,0.4)" : "none",
                        fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em",
                        boxShadow: seguindo ? "none" : "0 4px 20px rgba(92,200,0,0.3)",
                      }}>
                      {loadingFollow ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} strokeWidth={2} />}
                      {seguindo ? "SEGUINDO" : "SEGUIR"}
                    </button>
                    <button onClick={() => { if (usuario?.id) window.location.href = "/chat?user=" + usuario.id; }}
                      className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-black text-sm transition-all hover:brightness-110"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.3)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                      💬 MENSAGEM
                    </button>
                    <DenunciarButton tipo="usuario" alvoId={usuario.id} alvoUserId={usuario.id} label="DENUNCIAR" />
                    <BloquearUsuarioButton userId={usuario.id} nome={nome} onBloqueado={() => router.push("/")} />
                  </div>
                )}

                {!viewer && (
                  <Link href="/login" className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-black text-sm w-fit"
                    style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Users size={16} strokeWidth={2} /> ENTRAR PARA SEGUIR
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Posts */}
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <h2 className="font-black text-lg" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
            PUBLICAÇÕES ({posts.length})
          </h2>

          {posts.length === 0 ? (
            <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.15)" }}>
              <p className="text-3xl mb-2">🏃</p>
              <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>Nenhuma publicação ainda</p>
            </div>
          ) : (
            posts.map(post => (
              <article key={post.id} className="rounded-2xl overflow-hidden" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.08)" }}>
                <div className="h-0.5" style={{ background: post.tipo === "atividade" ? "linear-gradient(90deg, #FF6B00, #5CC800)" : "linear-gradient(90deg, #5CC800, #4aaa00)" }} />
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    {usuario.avatar ? (
                      <img src={usuario.avatar} alt="" className="rounded-full object-cover shrink-0" style={{ width: 36, height: 36 }} />
                    ) : (
                      <div className="rounded-full flex items-center justify-center shrink-0 font-black text-sm"
                        style={{ width: 36, height: 36, background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {nome[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{nome}</p>
                      <p className="text-xs" style={{ color: "#8B949E" }}>{tempoRelativo(post.created_at)}</p>
                    </div>
                    {post.tipo === "atividade" && (
                      <span className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black"
                        style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", border: "1px solid rgba(255,107,0,0.3)" }}>
                        ⚡ ATIVIDADE
                      </span>
                    )}
                  </div>

                  {post.tipo === "atividade" && (post.atividade_distancia || post.atividade_tempo) && (
                    <div className="rounded-2xl p-4 mb-3" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.1), rgba(92,200,0,0.1))", border: "1px solid rgba(92,200,0,0.2)" }}>
                      <p className="text-xs font-black mb-2" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>🔥 {post.atividade_tipo?.toUpperCase() || "CORRIDA"}</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {post.atividade_distancia && <div>
                          <p className="text-2xl font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_distancia}</p>
                          <p className="text-xs" style={{ color: "#8B949E" }}>km</p>
                        </div>}
                        {post.atividade_tempo && <div>
                          <p className="text-2xl font-black" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_tempo}</p>
                          <p className="text-xs" style={{ color: "#8B949E" }}>tempo</p>
                        </div>}
                        {post.atividade_pace && <div>
                          <p className="text-2xl font-black" style={{ color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>{post.atividade_pace}</p>
                          <p className="text-xs" style={{ color: "#8B949E" }}>/km</p>
                        </div>}
                      </div>
                    </div>
                  )}

                  {post.texto && <p className="text-sm leading-relaxed mb-3" style={{ color: "#C9D1D9" }}>{post.texto}</p>}

                  {post.fotos?.length > 0 && (
                    <img src={post.fotos[0]} alt="" className="w-full object-cover rounded-xl mb-3" style={{ maxHeight: 300 }} />
                  )}

                  <div className="flex items-center gap-4 pt-2 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "#8B949E" }}>
                      <Heart size={15} strokeWidth={2} /> {post.total_curtidas > 0 && post.total_curtidas}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "#8B949E" }}>
                      <MessageCircle size={15} strokeWidth={2} /> {post.total_comentarios > 0 && post.total_comentarios}
                    </span>
                    {viewer && !isOwn && (
                      <DenunciarButton tipo="post" alvoId={post.id} alvoUserId={usuario.id} postId={post.id} compact />
                    )}
                    <Link href="/" className="ml-auto flex items-center gap-1 text-xs font-black transition-colors hover:opacity-70"
                      style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      <Share2 size={13} strokeWidth={2} />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </>
  );
}
