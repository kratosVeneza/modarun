import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Entrar</h1>
        <p className="mt-2 text-sm text-slate-500">
          Entre com sua conta para participar e criar encontros.
        </p>

        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
      </div>
    </main>
  );
}