"use client";
import { useRouter } from "next/navigation";
export default function AdminTabs({ abaAtiva }: { abaAtiva: string }) {
  const router = useRouter();
  const abas = [
    { id: "eventos", label: "🏁 Eventos", desc: "Corridas e provas" },
    { id: "produtos", label: "🛍 Produtos", desc: "Loja Moda Run" },
  ];
  return (
    <div className="flex gap-3">
      {abas.map((aba) => (
        <button key={aba.id} onClick={() => router.push(`/admin?aba=${aba.id}`)}
          className={`flex-1 rounded-2xl border px-5 py-4 text-left transition ${abaAtiva === aba.id ? "border-orange-200 bg-orange-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
          <p className={`font-bold text-sm ${abaAtiva === aba.id ? "text-orange-700" : "text-slate-700"}`}>{aba.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{aba.desc}</p>
        </button>
      ))}
    </div>
  );
}
