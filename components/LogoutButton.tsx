"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      Sair
    </button>
  );
}