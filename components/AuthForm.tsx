"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps): React.JSX.Element {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
    setLoading(false); setTimeout(() => { router.push("/"); router.refresh(); }, 600);
  }

  const inputStyle = { background: "#21262D", border: "1px solid rgba(92,200,0,0.2)", color: "#E6EDF3", width: "100%", borderRadius: "12px", padding: "12px 16px", fontSize: "14px", outline: "none", transition: "border-color 0.2s" };
  const labelStyle = { display: "block", fontSize: "11px", fontWeight: 700, color: "#8B949E", marginBottom: "6px", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.1em" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={labelStyle}>EMAIL</label>
        <input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required
          style={inputStyle} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
      </div>
      <div>
        <label style={labelStyle}>SENHA</label>
        <div style={{ position: "relative" }}>
          <input type={mostrarSenha ? "text" : "password"} placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Sua senha"} value={password} onChange={e => setPassword(e.target.value)} required
            style={{ ...inputStyle, paddingRight: "60px" }} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} />
          <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", fontWeight: 700, color: "#8B949E", background: "none", border: "none", cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            {mostrarSenha ? "OCULTAR" : "VER"}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading}
        style={{ background: loading ? "#4aaa00" : "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", border: "none", borderRadius: "12px", padding: "14px", fontSize: "14px", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", transition: "all 0.2s", opacity: loading ? 0.8 : 1 }}>
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            {mode === "signup" ? "CRIANDO..." : "ENTRANDO..."}
          </span>
        ) : mode === "signup" ? "🚀 CRIAR CONTA" : "⚡ ENTRAR"}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {mensagem && (
        <div style={{ background: sucesso ? "rgba(92,200,0,0.1)" : "rgba(255,107,0,0.1)", border: `1px solid ${sucesso ? "rgba(92,200,0,0.3)" : "rgba(255,107,0,0.3)"}`, color: sucesso ? "#5CC800" : "#FF6B00", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", fontWeight: 600 }}>
          {mensagem}
        </div>
      )}

      <p style={{ textAlign: "center", fontSize: "13px", color: "#8B949E" }}>
        {mode === "login" ? (
          <>Não tem conta?{" "}<Link href="/cadastro" style={{ color: "#5CC800", fontWeight: 700 }}>Criar conta grátis</Link></>
        ) : (
          <>Já tem conta?{" "}<Link href="/login" style={{ color: "#5CC800", fontWeight: 700 }}>Entrar</Link></>
        )}
      </p>
    </form>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("User already registered")) return "Este email já está cadastrado.";
  return msg;
}
