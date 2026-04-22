import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-orange-50 to-amber-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-xl font-bold text-white shadow-lg">MR</div>
          <p className="text-sm font-medium text-slate-500">Moda Run</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-xl shadow-slate-200/60">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-slate-500">Entre para participar e criar treinos em grupo.</p>
          </div>
          <AuthForm mode="login" />
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">Ao entrar, você concorda com os termos de uso da Moda Run.</p>
      </div>
    </main>
  );
}
