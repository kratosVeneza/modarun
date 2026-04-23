"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

type Treino = { id: number; titulo: string; cidade: string; estado: string; data_encontro: string; tipo_treino?: string; km_planejado?: number; distancia?: string };

function formatarData(data: string) {
  if (!data) return "—";
  const [, mes, dia] = String(data).split("-");
  return `${dia}/${mes}`;
}

export default function PerfilPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [nomeExibicao, setNomeExibicao] = useState("");
  const [nomeEditando, setNomeEditando] = useState(false);
  const [nomeTemp, setNomeTemp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [uploadandoFoto, setUploadandoFoto] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");
      setUserId(user.id);
      const nome = user.user_metadata?.nome_exibicao || user.email?.split("@")[0] || "Corredor";
      setNomeExibicao(nome); setNomeTemp(nome);
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
      setIsAdmin(!!adminRow);
      const { data } = await supabase.from("encontros").select("id, titulo, cidade, estado, data_encontro, tipo_treino, km_planejado, distancia").eq("user_id", user.id).order("data_encontro", { ascending: false });
      setTreinos(data || []);
      setLoading(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvarNome() {
    setSalvandoNome(true);
    await supabase.auth.updateUser({ data: { nome_exibicao: nomeTemp.trim() } });
    setNomeExibicao(nomeTemp.trim()); setNomeEditando(false); setSalvandoNome(false);
  }

  async function uploadFoto(file: File) {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 3 * 1024 * 1024) { alert("Imagem muito grande. Máximo 3MB."); return; }
    setUploadandoFoto(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${userId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) { alert("Erro no upload: " + uploadError.message); setUploadandoFoto(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
    } catch { alert("Erro ao fazer upload."); }
    setUploadandoFoto(false);
  }

  async function removerFoto() {
    if (!confirm("Remover foto de perfil?")) return;
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    setAvatarUrl(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut(); router.push("/login");
  }

  if (loading) return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main className="flex min-h-screen items-center justify-center" style={{ background: "#0D1117" }}>
        <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
      </main>
    </>
  );

  const inicial = nomeExibicao[0]?.toUpperCase() || "?";
  const totalKm = treinos.reduce((acc, t) => acc + (t.km_planejado || 0), 0);

  return (
    <>
      <Header userEmail={userEmail} isAdmin={isAdmin} />
      <main style={{ background: "#0D1117", minHeight: "100vh" }}>

        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-10" style={{ background: "linear-gradient(135deg, #0D1117, #161B22)" }}>
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #5CC800, transparent)" }} />
          <div className="relative mx-auto max-w-3xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {/* Avatar com upload */}
              <div className="relative shrink-0 group">
                <div className="relative h-24 w-24 rounded-2xl overflow-hidden"
                  style={{ boxShadow: avatarUrl ? "0 0 0 3px #5CC800" : "0 0 0 3px rgba(92,200,0,0.3)" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={nomeExibicao} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-black"
                      style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {inicial}
                    </div>
                  )}
                  {/* Overlay de edição */}
                  <button onClick={() => fileRef.current?.click()} disabled={uploadandoFoto}
                    className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.65)" }}>
                    {uploadandoFoto ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <>
                        <span className="text-xl">📷</span>
                        <span className="text-xs font-black mt-1" style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>TROCAR</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Botão remover foto */}
                {avatarUrl && !uploadandoFoto && (
                  <button onClick={removerFoto}
                    className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#FF6B00", color: "#fff" }}>
                    ✕
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadFoto(f); e.target.value = ""; }} />
              </div>

              {/* Info */}
              <div className="flex-1">
                {nomeEditando ? (
                  <div className="flex items-center gap-2">
                    <input type="text" value={nomeTemp} onChange={e => setNomeTemp(e.target.value)} autoFocus
                      className="flex-1 rounded-xl px-4 py-2 text-xl font-black"
                      style={{ background: "#21262D", border: "1px solid #5CC800", color: "#E6EDF3", outline: "none", fontFamily: "'Barlow Condensed', sans-serif" }} />
                    <button onClick={salvarNome} disabled={salvandoNome}
                      className="rounded-xl px-4 py-2 text-sm font-black"
                      style={{ background: "#5CC800", color: "#0D1117", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {salvandoNome ? "..." : "SALVAR"}
                    </button>
                    <button onClick={() => { setNomeEditando(false); setNomeTemp(nomeExibicao); }}
                      className="rounded-xl px-3 py-2 text-sm font-black"
                      style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{nomeExibicao}</h1>
                    <button onClick={() => setNomeEditando(true)}
                      className="rounded-lg px-2 py-1 text-xs font-bold"
                      style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      ✏️ EDITAR
                    </button>
                  </div>
                )}
                <p className="mt-0.5 text-sm" style={{ color: "#8B949E" }}>{userEmail}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    🏃 {treinos.length} TREINO{treinos.length !== 1 ? "S" : ""}
                  </span>
                  {isAdmin && <span className="rounded-lg px-3 py-1 text-xs font-black"
                    style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ⚙️ ADMIN
                  </span>}
                </div>
                <p className="mt-2 text-xs" style={{ color: "#8B949E" }}>
                  Clique na foto para trocar • JPG, PNG • máx. 3MB
                </p>
              </div>

              <button onClick={handleLogout}
                className="shrink-0 self-start rounded-xl px-4 py-2 text-sm font-black"
                style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                SAIR
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { v: treinos.length, l: "TREINOS", cor: "#5CC800" },
              { v: `${totalKm}km`, l: "KM PLANEJADOS", cor: "#FF6B00" },
              { v: "🏃", l: "ATIVO", cor: "#FFB800" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
                <p className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.cor }}>{s.v}</p>
                <p className="mt-1 text-xs font-bold" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Meus treinos */}
          <section className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
                <h2 className="font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", fontSize: "18px", letterSpacing: "0.03em" }}>MEUS TREINOS</h2>
                <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>{treinos.length}</span>
              </div>
              <Link href="/encontros" className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>+ CRIAR →</Link>
            </div>

            {treinos.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: "#21262D", border: "1px dashed rgba(92,200,0,0.2)" }}>
                <p className="text-sm" style={{ color: "#8B949E" }}>Você ainda não criou treinos.</p>
                <Link href="/encontros" className="mt-3 inline-flex rounded-xl px-4 py-2 text-sm font-black"
                  style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  CRIAR PRIMEIRO TREINO
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {treinos.map(t => (
                  <Link key={t.id} href={`/treinos/${t.id}`}
                    className="flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-110"
                    style={{ background: "#21262D", border: "1px solid rgba(92,200,0,0.1)" }}>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>{t.titulo}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>{t.cidade} · {formatarData(t.data_encontro)}{t.tipo_treino && ` · ${t.tipo_treino}`}</p>
                    </div>
                    <span className="font-black text-sm" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {t.km_planejado ? `${t.km_planejado}km` : t.distancia || "→"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Links rápidos */}
          <section className="grid grid-cols-2 gap-3">
            {[
              { href: "/meus-treinos", icon: "📋", label: "GERENCIAR TREINOS", cor: "#5CC800", bg: "rgba(92,200,0,0.1)", border: "rgba(92,200,0,0.2)" },
              { href: "/loja", icon: "🛒", label: "VER A LOJA", cor: "#FF6B00", bg: "rgba(255,107,0,0.1)", border: "rgba(255,107,0,0.2)" },
              { href: "/eventos", icon: "🏁", label: "VER EVENTOS", cor: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.2)" },
              { href: "/encontros", icon: "⚡", label: "CRIAR TREINO", cor: "#5CC800", bg: "rgba(92,200,0,0.08)", border: "rgba(92,200,0,0.15)" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 rounded-xl p-4 transition-all hover:brightness-110"
                style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                <span className="text-xl">{item.icon}</span>
                <span className="font-black text-xs" style={{ color: item.cor, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>{item.label}</span>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
