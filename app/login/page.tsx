"use client";

import AuthForm from "@/components/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #0D1117 0%, #161B22 100%)" }}>
      {/* Grid pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke="#5CC800" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "linear-gradient(135deg, #5CC800, #FF6B00)", boxShadow: "0 0 40px rgba(92,200,0,0.3)" }}>
            <span className="text-white font-black text-2xl" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>MR</span>
          </div>
          <h1 className="text-3xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#5CC800", letterSpacing: "0.05em" }}>
            MODA <span style={{ color: "#FF6B00" }}>RUN</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.2em" }}>RUNNING & PERFORMANCE</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
          <div className="mb-6">
            <h2 className="text-2xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>BEM-VINDO DE VOLTA</h2>
            <p className="mt-1 text-sm" style={{ color: "#8B949E" }}>Entre para participar e criar treinos em grupo.</p>
          </div>
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-center text-xs" style={{ color: "#8B949E" }}>Moda Run — Running & Performance</p>
      </div>
    </main>
  );
}
