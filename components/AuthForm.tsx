"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login")) return "Email ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("already registered")) return "Este email já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}

export default function AuthForm({ mode }: AuthFormProps): React.JSX.Element {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function handleGoogle() {
    setLoadingGoogle(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setMensagem(""); setSucesso(false);
    if (!email || !password) { setMensagem("Preencha email e senha."); setLoading(false); return; }

    if (mode === "signup") {
      if (password.length < 6) { setMensagem("A senha deve ter pelo menos 6 caracteres."); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setMensagem(traduzirErro(error.message)); setLoading(false); return; }
      setSucesso(true); setMensagem("Conta criada! Verifique seu email.");
      setLoading(false); setTimeout(() => router.push("/login"), 2500); return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMensagem(traduzirErro(error.message)); setLoading(false); return; }
    setSucesso(true); setMensagem("Login realizado!");
    setLoading(false);
    setTimeout(() => { router.push(redirectTo); router.refresh(); }, 600);
  }

  const inp = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", width: "100%", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", transition: "border-color 0.2s" } as React.CSSProperties;
  const lbl = { display: "block", fontSize: "11px", fontWeight: 700, color: "#8B949E", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" } as React.CSSProperties;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Aviso de contexto quando vem de um redirect */}
      {redirectTo !== "/" && mode === "login" && (
        <div className="rounded-xl px-4 py-3 text-xs font-bold"
          style={{ background: "rgba(92,200,0,0.08)", border: "1px solid rgba(92,200,0,0.2)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
          ✅ Entre para continuar — seus dados do formulário foram salvos!
        </div>
      )}

      {/* Google OAuth */}
      <button type="button" onClick={handleGoogle} disabled={loadingGoogle}
        className="flex items-center justify-center gap-3 w-full rounded-xl py-3.5 font-black text-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        style={{ background: "#fff", color: "#1a1a1a", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.03em", border: "1px solid rgba(255,255,255,0.2)" }}>
        {loadingGoogle ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {loadingGoogle ? "REDIRECIONANDO..." : "CONTINUAR COM GOOGLE"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <span className="text-xs" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>OU COM EMAIL</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* Email/senha */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div>
          <label style={lbl}>EMAIL</label>
          <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
            style={inp} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
        </div>
        <div>
          <label style={lbl}>SENHA</label>
          <div style={{ position: "relative" }}>
            <input type={mostrarSenha ? "text" : "password"} placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Sua senha"} value={password}
              onChange={e => setPassword(e.target.value)} required style={{ ...inp, paddingRight: "48px" }}
              onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
            <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8B949E", fontSize: "16px" }}>
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {mensagem && (
          <div className="rounded-xl p-3 text-sm font-semibold"
            style={{ background: sucesso ? "rgba(92,200,0,0.1)" : "rgba(255,107,0,0.1)", color: sucesso ? "#5CC800" : "#FF6B00", border: `1px solid ${sucesso ? "rgba(92,200,0,0.3)" : "rgba(255,107,0,0.3)"}` }}>
            {mensagem}
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-3.5 text-sm font-black transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              {mode === "signup" ? "CRIANDO CONTA..." : "ENTRANDO..."}
            </span>
          ) : mode === "signup" ? "⚡ CRIAR CONTA GRÁTIS" : "ENTRAR"}
        </button>

        <p className="text-center text-xs" style={{ color: "#8B949E" }}>
          {mode === "login" ? (
            <>Não tem conta? <Link href={"/cadastro" + (redirectTo !== "/" ? "?redirect=" + encodeURIComponent(redirectTo) : "")} style={{ color: "#5CC800", fontWeight: 700 }}>Cadastre-se grátis</Link></>
          ) : (
            <>Já tem conta? <Link href={"/login" + (redirectTo !== "/" ? "?redirect=" + encodeURIComponent(redirectTo) : "")} style={{ color: "#5CC800", fontWeight: 700 }}>Entrar</Link></>
          )}
        </p>
      </form>
    </div>
  );
}
