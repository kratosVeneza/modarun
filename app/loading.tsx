export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        <p className="text-sm text-slate-500">Carregando encontros...</p>
      </div>
    </div>
  );
}