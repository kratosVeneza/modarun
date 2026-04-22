"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = { mode: "login" | "signup" };

export default function AuthForm({ mode }: AuthFormProps) {
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
    setLoading(true);
    setMensagem("");
    setSucesso(false);

    if (!email || !password) { setMensagem("Preencha email e senha."); setLoading(false); return; }

    if (mode === "signup") {
      if (password.length < 6) { setMensagem("A senha deve ter pelo menos 6 caracteres."); setLoading(false); return; }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setMensagem(traduzirErro(error.message)); setLoading(false); return; }
      setSucesso(true);
      setMensagem("Conta criada! Verifique seu email para confirmar.");
      setLoading(false);
      setTimeout(() => router.push("/login"), 2500);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMensagem(traduzirErro(error.message)); setLoading(false); return; }
    setSucesso(true);
    setMensagem("Login realizado! Redirecionando...");
    setLoading(false);
    setTimeout(() => { router.push("/"); router.refresh(); }, 600);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
        <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</label>
        <div className="relative">
          <input type={mostrarSenha ? "text" : "password"} placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Sua senha"}
            value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100" />
          <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700">
            {mostrarSenha ? "Ocultar" : "Ver"}
          </button>
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            {mode === "signup" ? "Criando conta..." : "Entrando..."}
          </span>
        ) : mode === "signup" ? "Criar conta" : "Entrar"}
      </button>
      {mensagem && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${sucesso ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {mensagem}
        </div>
      )}
      <p className="text-center text-sm text-slate-500">
        {mode === "login" ? (<>Ainda não tem conta?{" "}<Link href="/cadastro" className="font-semibold text-orange-600 hover:underline">Criar conta grátis</Link></>) : (<>Já tem conta?{" "}<Link href="/login" className="font-semibold text-orange-600 hover:underline">Entrar</Link></>)}
      </p>
    </form>
  );
}

function traduzirErro(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu email antes de entrar.";
  if (msg.includes("User already registered")) return "Este email já está cadastrado.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  return msg;
}
