"use client";

import AuthForm from "@/components/AuthForm";

export default function CadastroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5CC800" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/logo-moda-run-full.png"
            alt="Moda Run"
            className="mx-auto mb-2"
            style={{ height: "80px", width: "auto", objectFit: "contain" }}
          />
        </div>
        <div className="mb-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-sm font-black"
            style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
            ← VOLTAR
          </a>
          <div className="flex gap-3 text-xs" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
            <a href="/eventos" style={{ color: "#8B949E" }}>EVENTOS</a>
            <a href="/loja" style={{ color: "#8B949E" }}>LOJA</a>
            <a href="/encontros" style={{ color: "#8B949E" }}>TREINOS</a>
          </div>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
          <div className="mb-6">
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>CRIE SUA CONTA</h2>
            <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>Junte-se à comunidade de corredores da Moda Run.</p>
          </div>
          <AuthForm mode="signup" />
        </div>
        <p className="mt-4 text-center text-xs" style={{ color: "#8B949E" }}>Cadastro gratuito. Sem spam.</p>
      </div>
    </main>
  );
}
