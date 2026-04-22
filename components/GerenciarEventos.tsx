"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Evento = { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; local?: string; link_inscricao?: string; destaque?: boolean };
const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const vazio = { nome: "", cidade: "", estado: "", data_evento: "", distancia: "", local: "", link_inscricao: "", destaque: false };

export default function GerenciarEventos({ eventosIniciais }: { eventosIniciais: Evento[] }): JSX.Element {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciais);
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Evento | null>(null);
  const [form, setForm] = useState(vazio);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  function abrirNovo() { setEditando(null); setForm(vazio); setErro(""); setFormAberto(true); }
  function abrirEditar(e: Evento) {
    setEditando(e);
    setForm({ nome: e.nome, cidade: e.cidade, estado: e.estado, data_evento: String(e.data_evento), distancia: e.distancia || "", local: e.local || "", link_inscricao: e.link_inscricao || "", destaque: e.destaque || false });
    setErro(""); setFormAberto(true);
  }

  async function salvar() {
    if (!form.nome || !form.cidade || !form.estado || !form.data_evento) { setErro("Preencha nome, cidade, estado e data."); return; }
    setLoading(true); setErro("");
    const method = editando ? "PATCH" : "POST";
    const body = editando ? { ...form, id: editando.id } : form;
    const res = await fetch("/api/admin/eventos", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(result.error || "Erro ao salvar."); return; }
    setFormAberto(false);
    if (editando) setEventos(eventos.map(e => e.id === editando.id ? { ...e, ...form } : e));
    else setEventos([result.data, ...eventos]);
    router.refresh();
  }

  async function excluir(id: number) {
    if (!confirm("Excluir este evento?")) return;
    setExcluindoId(id);
    const res = await fetch("/api/admin/eventos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setExcluindoId(null);
    if (res.ok) setEventos(eventos.filter(e => e.id !== id));
  }

  function formatarData(d: string) { if (!d) return "—"; const [a,m,dia] = String(d).split("-"); return `${dia}/${m}/${a}`; }

  const inp = "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100";
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNovo} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 active:scale-95">+ Adicionar evento</button>
      </div>

      {formAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && setFormAberto(false)}>
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-lg font-bold text-slate-900">{editando ? "Editar evento" : "Novo evento"}</h3>
              <button onClick={() => setFormAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <div className="space-y-4 p-6">
              <div><label className={lbl}>Nome do evento *</label><input type="text" placeholder="Ex: Corrida das Flores 2026" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Cidade *</label><input type="text" placeholder="Ex: Tucuruí" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} className={inp} /></div>
                <div><label className={lbl}>Estado *</label>
                  <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className={inp}>
                    <option value="">Selecione</option>
                    {estadosBR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Data *</label><input type="date" value={form.data_evento} onChange={e => setForm({...form, data_evento: e.target.value})} className={inp} /></div>
                <div><label className={lbl}>Distância</label><input type="text" placeholder="Ex: 5km, 10km" value={form.distancia} onChange={e => setForm({...form, distancia: e.target.value})} className={inp} /></div>
              </div>
              <div><label className={lbl}>Local</label><input type="text" placeholder="Ex: Parque Municipal" value={form.local} onChange={e => setForm({...form, local: e.target.value})} className={inp} /></div>
              <div><label className={lbl}>Link de inscrição</label><input type="url" placeholder="https://..." value={form.link_inscricao} onChange={e => setForm({...form, link_inscricao: e.target.value})} className={inp} /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                <input type="checkbox" checked={form.destaque} onChange={e => setForm({...form, destaque: e.target.checked})} className="h-4 w-4 accent-orange-500" />
                <div><p className="text-sm font-semibold text-slate-700">⭐ Marcar como destaque</p><p className="text-xs text-slate-400">Badge especial na listagem</p></div>
              </label>
              {erro && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setFormAberto(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                <button onClick={salvar} disabled={loading} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                  {loading ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Salvando...</span> : editando ? "Salvar" : "Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-4xl">🏁</p><p className="mt-3 font-semibold text-slate-700">Nenhum evento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map((evento) => (
            <div key={evento.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">{evento.nome}</h3>
                    {evento.destaque && <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">⭐ Destaque</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">📍 {evento.cidade} — {evento.estado} · 📅 {formatarData(String(evento.data_evento))}{evento.distancia && ` · 📏 ${evento.distancia}`}</p>
                  {evento.link_inscricao && <a href={evento.link_inscricao} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-semibold text-orange-600 hover:underline">🔗 Link de inscrição</a>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => abrirEditar(evento)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">✏️ Editar</button>
                  <button onClick={() => excluir(evento.id)} disabled={excluindoId === evento.id} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                    {excluindoId === evento.id ? "..." : "🗑️ Excluir"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
