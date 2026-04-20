"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type AuthFormProps = {
  mode: "login" | "signup";
};

export default function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMensagem(error.message);
        setLoading(false);
        return;
      }

      setMensagem("Conta criada com sucesso!");
      setLoading(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMensagem(error.message);
      setLoading(false);
      return;
    }

    setMensagem("Login realizado com sucesso!");
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        placeholder="Seu email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
      />

      <input
        type="password"
        placeholder="Sua senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-70"
      >
        {loading ? "Carregando..." : mode === "signup" ? "Criar conta" : "Entrar"}
      </button>

      {mensagem && <p className="text-sm text-slate-600">{mensagem}</p>}

      <div className="text-sm text-slate-500">
        {mode === "login" ? (
          <p>
            Ainda não tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-orange-600">
              Criar conta
            </Link>
          </p>
        ) : (
          <p>
            Já tem conta?{" "}
            <Link href="/login" className="font-semibold text-orange-600">
              Entrar
            </Link>
          </p>
        )}
      </div>
    </form>
  );
}