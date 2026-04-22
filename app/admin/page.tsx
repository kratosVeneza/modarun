"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

type Evento = { id: number; nome: string; cidade: string; estado: string; data_evento: string; distancia?: string; local?: string; link_inscricao?: string; destaque?: boolean };
type Produto = { id: string; nome: string; descricao?: string; preco: number; preco_promocional?: number; categoria: string; fotos: string[]; cores: string[]; tamanhos: string[]; estoque_disponivel: boolean; destaque: boolean; whatsapp_msg?: string; ordem: number };

const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const categorias = ["Camiseta","Conjunto","Shorts","Calçado","Meia","Boné","Acessório","Nutrição","Hidratação","Outro"];
const tamanhosRoupa = ["PP","P","M","G","GG","XGG"];
const tamanhosTenis = ["34","35","36","37","38","39","40","41","42","43","44","45"];
const coresPadrao = ["Preto","Branco","Cinza","Azul","Vermelho","Verde","Amarelo","Laranja","Rosa","Roxo"];
const inp = "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1";
const eventoVazio = { nome:"",cidade:"",estado:"",data_evento:"",distancia:"",local:"",link_inscricao:"",destaque:false };
const produtoVazio = { nome:"",descricao:"",preco:0,preco_promocional:undefined as number|undefined,categoria:"Camiseta",fotos:[] as string[],cores:[] as string[],tamanhos:[] as string[],estoque_disponivel:true,destaque:false,whatsapp_msg:"",ordem:0 };

function fmt(v: number) { return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }
function fmtData(d: string) { if(!d) return "—"; const [a,m,dia]=String(d).split("-"); return `${dia}/${m}/${a}`; }

export default function AdminPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [aba, setAba] = useState("eventos");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  // Evento form
  const [eventoFormAberto, setEventoFormAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<Evento|null>(null);
  const [eventoForm, setEventoForm] = useState(eventoVazio);
  const [eventoLoading, setEventoLoading] = useState(false);
  const [eventoErro, setEventoErro] = useState("");
  const [excluindoEvento, setExcluindoEvento] = useState<number|null>(null);

  // Produto form
  const [produtoFormAberto, setProdutoFormAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto|null>(null);
  const [produtoForm, setProdutoForm] = useState<Omit<Produto,"id">>(produtoVazio);
  const [produtoLoading, setProdutoLoading] = useState(false);
  const [produtoErro, setProdutoErro] = useState("");
  const [uploadando, setUploadando] = useState(false);
  const [excluindoProduto, setExcluindoProduto] = useState<string|null>(null);
  const [corCustom, setCorCustom] = useState("");
  const [tamanhoCustom, setTamanhoCustom] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");
      const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
      if (!adminRow) { router.push("/"); return; }
      setAutorizado(true);
      const [{ data: ev }, { data: pr }] = await Promise.all([
        supabase.from("eventos").select("*").order("data_evento", { ascending: true }),
        supabase.from("produtos").select("*").order("ordem").order("criado_em", { ascending: false }),
      ]);
      setEventos(ev || []);
      setProdutos(pr || []);
      setLoading(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Evento handlers ──
  function abrirNovoEvento() { setEventoEditando(null); setEventoForm(eventoVazio); setEventoErro(""); setEventoFormAberto(true); }
  function abrirEditarEvento(e: Evento) { setEventoEditando(e); setEventoForm({ nome:e.nome,cidade:e.cidade,estado:e.estado,data_evento:String(e.data_evento),distancia:e.distancia||"",local:e.local||"",link_inscricao:e.link_inscricao||"",destaque:e.destaque||false }); setEventoErro(""); setEventoFormAberto(true); }
  async function salvarEvento() {
    if (!eventoForm.nome||!eventoForm.cidade||!eventoForm.estado||!eventoForm.data_evento) { setEventoErro("Preencha nome, cidade, estado e data."); return; }
    setEventoLoading(true); setEventoErro("");
    const method = eventoEditando?"PATCH":"POST";
    const body = eventoEditando?{...eventoForm,id:eventoEditando.id}:eventoForm;
    const res = await fetch("/api/admin/eventos",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const result = await res.json();
    setEventoLoading(false);
    if (!res.ok) { setEventoErro(result.error||"Erro ao salvar."); return; }
    setEventoFormAberto(false);
    if (eventoEditando) setEventos(eventos.map(e=>e.id===eventoEditando.id?{...e,...eventoForm}:e));
    else setEventos([result.data,...eventos]);
  }
  async function excluirEvento(id: number) {
    if (!confirm("Excluir este evento?")) return;
    setExcluindoEvento(id);
    const res = await fetch("/api/admin/eventos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setExcluindoEvento(null);
    if (res.ok) setEventos(eventos.filter(e=>e.id!==id));
  }

  // ── Produto handlers ──
  function abrirNovoProduto() { setProdutoEditando(null); setProdutoForm(produtoVazio); setProdutoErro(""); setProdutoFormAberto(true); }
  function abrirEditarProduto(p: Produto) { setProdutoEditando(p); setProdutoForm({nome:p.nome,descricao:p.descricao||"",preco:p.preco,preco_promocional:p.preco_promocional,categoria:p.categoria,fotos:[...p.fotos],cores:[...p.cores],tamanhos:[...p.tamanhos],estoque_disponivel:p.estoque_disponivel,destaque:p.destaque,whatsapp_msg:p.whatsapp_msg||"",ordem:p.ordem}); setProdutoErro(""); setProdutoFormAberto(true); }
  async function uploadFoto(file: File) {
    setUploadando(true);
    const fd = new FormData(); fd.append("file",file);
    const res = await fetch("/api/admin/upload-foto",{method:"POST",body:fd});
    const result = await res.json();
    setUploadando(false);
    if (!res.ok) { setProdutoErro(result.error||"Erro no upload."); return; }
    setProdutoForm(f=>({...f,fotos:[...f.fotos,result.url]}));
  }
  function toggleCor(cor: string) { setProdutoForm(f=>({...f,cores:f.cores.includes(cor)?f.cores.filter(c=>c!==cor):[...f.cores,cor]})); }
  function toggleTamanho(t: string) { setProdutoForm(f=>({...f,tamanhos:f.tamanhos.includes(t)?f.tamanhos.filter(x=>x!==t):[...f.tamanhos,t]})); }
  function adicionarCor() { if(corCustom.trim()&&!produtoForm.cores.includes(corCustom.trim())){setProdutoForm(f=>({...f,cores:[...f.cores,corCustom.trim()]}));setCorCustom("");} }
  function adicionarTamanho() { if(tamanhoCustom.trim()&&!produtoForm.tamanhos.includes(tamanhoCustom.trim())){setProdutoForm(f=>({...f,tamanhos:[...f.tamanhos,tamanhoCustom.trim()]}));setTamanhoCustom("");} }
  async function salvarProduto() {
    if (!produtoForm.nome||!produtoForm.preco||!produtoForm.categoria) { setProdutoErro("Nome, preço e categoria são obrigatórios."); return; }
    setProdutoLoading(true); setProdutoErro("");
    const method = produtoEditando?"PATCH":"POST";
    const body = produtoEditando?{id:produtoEditando.id,...produtoForm}:produtoForm;
    const res = await fetch("/api/admin/produtos",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const result = await res.json();
    setProdutoLoading(false);
    if (!res.ok) { setProdutoErro(result.error||"Erro ao salvar."); return; }
    if (produtoEditando) setProdutos(produtos.map(p=>p.id===produtoEditando.id?{...p,...produtoForm}:p));
    else setProdutos([result.data,...produtos]);
    setProdutoFormAberto(false);
  }
  async function excluirProduto(id: string) {
    if (!confirm("Excluir este produto?")) return;
    setExcluindoProduto(id);
    const res = await fetch("/api/admin/produtos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setExcluindoProduto(null);
    if (res.ok) setProdutos(produtos.filter(p=>p.id!==id));
  }

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
    </main>
  );
  if (!autorizado) return <></>;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={true} />
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">

          <section className="rounded-[28px] bg-gradient-to-r from-slate-900 to-slate-800 p-7 text-white shadow-xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">👑 Painel Admin</span>
            <h1 className="mt-3 text-2xl font-bold">Central de administração</h1>
            <p className="mt-1 text-sm text-slate-400">Gerencie eventos, produtos da loja e configurações do app.</p>
          </section>

          {/* Tabs */}
          <div className="flex gap-3">
            {[{id:"eventos",label:"🏁 Eventos",desc:"Corridas e provas"},{id:"produtos",label:"🛍 Produtos",desc:"Loja Moda Run"}].map(t=>(
              <button key={t.id} onClick={()=>setAba(t.id)} className={`flex-1 rounded-2xl border px-5 py-4 text-left transition ${aba===t.id?"border-orange-200 bg-orange-50":"border-slate-200 bg-white hover:bg-slate-50"}`}>
                <p className={`font-bold text-sm ${aba===t.id?"text-orange-700":"text-slate-700"}`}>{t.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
              </button>
            ))}
          </div>

          {/* ── EVENTOS ── */}
          {aba==="eventos" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={abrirNovoEvento} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">+ Adicionar evento</button>
              </div>

              {eventoFormAberto && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm" onClick={e=>e.target===e.currentTarget&&setEventoFormAberto(false)}>
                  <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                      <h3 className="text-lg font-bold text-slate-900">{eventoEditando?"Editar evento":"Novo evento"}</h3>
                      <button onClick={()=>setEventoFormAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">✕</button>
                    </div>
                    <div className="space-y-4 p-6">
                      <div><label className={lbl}>Nome *</label><input type="text" value={eventoForm.nome} onChange={e=>setEventoForm({...eventoForm,nome:e.target.value})} className={inp}/></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={lbl}>Cidade *</label><input type="text" value={eventoForm.cidade} onChange={e=>setEventoForm({...eventoForm,cidade:e.target.value})} className={inp}/></div>
                        <div><label className={lbl}>Estado *</label>
                          <select value={eventoForm.estado} onChange={e=>setEventoForm({...eventoForm,estado:e.target.value})} className={inp}>
                            <option value="">Selecione</option>
                            {estadosBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={lbl}>Data *</label><input type="date" value={eventoForm.data_evento} onChange={e=>setEventoForm({...eventoForm,data_evento:e.target.value})} className={inp}/></div>
                        <div><label className={lbl}>Distância</label><input type="text" placeholder="Ex: 5km" value={eventoForm.distancia} onChange={e=>setEventoForm({...eventoForm,distancia:e.target.value})} className={inp}/></div>
                      </div>
                      <div><label className={lbl}>Local</label><input type="text" value={eventoForm.local} onChange={e=>setEventoForm({...eventoForm,local:e.target.value})} className={inp}/></div>
                      <div><label className={lbl}>Link de inscrição</label><input type="url" placeholder="https://..." value={eventoForm.link_inscricao} onChange={e=>setEventoForm({...eventoForm,link_inscricao:e.target.value})} className={inp}/></div>
                      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
                        <input type="checkbox" checked={eventoForm.destaque} onChange={e=>setEventoForm({...eventoForm,destaque:e.target.checked})} className="h-4 w-4 accent-orange-500"/>
                        <div><p className="text-sm font-semibold text-slate-700">⭐ Destaque</p><p className="text-xs text-slate-400">Badge especial na listagem</p></div>
                      </label>
                      {eventoErro&&<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{eventoErro}</div>}
                      <div className="flex gap-3">
                        <button onClick={()=>setEventoFormAberto(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                        <button onClick={salvarEvento} disabled={eventoLoading} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                          {eventoLoading?<span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Salvando...</span>:eventoEditando?"Salvar":"Adicionar"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {eventos.length===0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="text-4xl">🏁</p><p className="mt-3 font-semibold text-slate-700">Nenhum evento cadastrado</p></div>
              ) : (
                <div className="space-y-3">
                  {eventos.map(ev=>(
                    <div key={ev.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{ev.nome}</h3>
                            {ev.destaque&&<span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-700">⭐ Destaque</span>}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">📍 {ev.cidade} — {ev.estado} · 📅 {fmtData(String(ev.data_evento))}{ev.distancia&&` · ${ev.distancia}`}</p>
                          {ev.link_inscricao&&<a href={ev.link_inscricao} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-semibold text-orange-600 hover:underline">🔗 Inscrição</a>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button onClick={()=>abrirEditarEvento(ev)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">✏️ Editar</button>
                          <button onClick={()=>excluirEvento(ev.id)} disabled={excluindoEvento===ev.id} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">{excluindoEvento===ev.id?"...":"🗑️ Excluir"}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUTOS ── */}
          {aba==="produtos" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={abrirNovoProduto} className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600">+ Adicionar produto</button>
              </div>

              {produtoFormAberto && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm" onClick={e=>e.target===e.currentTarget&&setProdutoFormAberto(false)}>
                  <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl my-4">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                      <h3 className="text-lg font-bold text-slate-900">{produtoEditando?`Editando: ${produtoEditando.nome}`:"Novo produto"}</h3>
                      <button onClick={()=>setProdutoFormAberto(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100">✕</button>
                    </div>
                    <div className="space-y-5 p-6">
                      {/* Fotos */}
                      <div>
                        <label className={lbl}>📸 Fotos</label>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {produtoForm.fotos.map((url,i)=>(
                            <div key={i} className="group relative">
                              <img src={url} alt="" className="h-24 w-24 rounded-2xl object-cover border border-slate-200"/>
                              <button onClick={()=>setProdutoForm(f=>({...f,fotos:f.fotos.filter(u=>u!==url)}))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition">✕</button>
                              {i===0&&<span className="absolute bottom-1 left-1 rounded-lg bg-black/60 px-1.5 py-0.5 text-xs text-white">Principal</span>}
                            </div>
                          ))}
                          <button onClick={()=>fileRef.current?.click()} disabled={uploadando} className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-orange-400 hover:bg-orange-50 hover:text-orange-500 transition disabled:opacity-50">
                            {uploadando?<span className="h-5 w-5 animate-spin rounded-full border-2 border-orange-300 border-t-orange-500"/>:<><span className="text-2xl">+</span><span className="mt-1 text-xs font-semibold">Foto</span></>}
                          </button>
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={async e=>{const files=Array.from(e.target.files||[]);for(const f of files) await uploadFoto(f);e.target.value="";}}/>
                        <p className="mt-1 text-xs text-slate-400">Primeira foto = imagem principal. Máx. 5MB.</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><label className={lbl}>Nome *</label><input type="text" value={produtoForm.nome} onChange={e=>setProdutoForm({...produtoForm,nome:e.target.value})} className={inp}/></div>
                        <div><label className={lbl}>Categoria *</label><select value={produtoForm.categoria} onChange={e=>setProdutoForm({...produtoForm,categoria:e.target.value})} className={inp}>{categorias.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                      </div>
                      <div><label className={lbl}>Descrição</label><textarea value={produtoForm.descricao} onChange={e=>setProdutoForm({...produtoForm,descricao:e.target.value})} rows={3} className={inp+" resize-none"}/></div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><label className={lbl}>Preço *</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span><input type="number" step="0.01" min="0" value={produtoForm.preco||""} onChange={e=>setProdutoForm({...produtoForm,preco:Number(e.target.value)})} className={inp+" pl-10"}/></div></div>
                        <div><label className={lbl}>Preço promocional</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">R$</span><input type="number" step="0.01" min="0" value={produtoForm.preco_promocional||""} onChange={e=>setProdutoForm({...produtoForm,preco_promocional:e.target.value?Number(e.target.value):undefined})} className={inp+" pl-10"}/></div></div>
                      </div>
                      {/* Cores */}
                      <div>
                        <label className={lbl}>Cores</label>
                        <div className="mt-2 flex flex-wrap gap-2">{coresPadrao.map(cor=><button key={cor} type="button" onClick={()=>toggleCor(cor)} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${produtoForm.cores.includes(cor)?"bg-orange-500 text-white":"border border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300"}`}>{cor}</button>)}</div>
                        <div className="mt-2 flex gap-2"><input type="text" placeholder="Outra cor..." value={corCustom} onChange={e=>setCorCustom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),adicionarCor())} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400"/><button type="button" onClick={adicionarCor} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">+</button></div>
                        {produtoForm.cores.length>0&&<div className="mt-2 flex flex-wrap gap-1.5">{produtoForm.cores.map(cor=><span key={cor} className="flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">{cor}<button onClick={()=>setProdutoForm(f=>({...f,cores:f.cores.filter(c=>c!==cor)}))} className="ml-0.5 text-orange-400 hover:text-orange-700">×</button></span>)}</div>}
                      </div>
                      {/* Tamanhos */}
                      <div>
                        <label className={lbl}>Tamanhos</label>
                        <div className="mt-2 space-y-2">
                          <div><p className="mb-1 text-xs text-slate-400">Roupas</p><div className="flex flex-wrap gap-2">{tamanhosRoupa.map(t=><button key={t} type="button" onClick={()=>toggleTamanho(t)} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${produtoForm.tamanhos.includes(t)?"bg-orange-500 text-white":"border border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300"}`}>{t}</button>)}</div></div>
                          <div><p className="mb-1 text-xs text-slate-400">Calçados</p><div className="flex flex-wrap gap-2">{tamanhosTenis.map(t=><button key={t} type="button" onClick={()=>toggleTamanho(t)} className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${produtoForm.tamanhos.includes(t)?"bg-orange-500 text-white":"border border-slate-200 bg-slate-50 text-slate-600 hover:border-orange-300"}`}>{t}</button>)}</div></div>
                          <div className="flex gap-2"><input type="text" placeholder="Personalizado..." value={tamanhoCustom} onChange={e=>setTamanhoCustom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),adicionarTamanho())} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-400"/><button type="button" onClick={adicionarTamanho} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">+</button></div>
                        </div>
                      </div>
                      <div><label className={lbl}>Mensagem WhatsApp</label><input type="text" placeholder="Opcional — gerada automaticamente se vazio" value={produtoForm.whatsapp_msg} onChange={e=>setProdutoForm({...produtoForm,whatsapp_msg:e.target.value})} className={inp}/></div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50"><input type="checkbox" checked={produtoForm.estoque_disponivel} onChange={e=>setProdutoForm({...produtoForm,estoque_disponivel:e.target.checked})} className="h-4 w-4 accent-orange-500"/><div><p className="text-sm font-semibold text-slate-700">✅ Em estoque</p><p className="text-xs text-slate-400">Disponível para compra</p></div></label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 hover:bg-slate-50"><input type="checkbox" checked={produtoForm.destaque} onChange={e=>setProdutoForm({...produtoForm,destaque:e.target.checked})} className="h-4 w-4 accent-orange-500"/><div><p className="text-sm font-semibold text-slate-700">⭐ Destaque</p><p className="text-xs text-slate-400">Aparece primeiro na loja</p></div></label>
                      </div>
                      {produtoErro&&<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{produtoErro}</div>}
                      <div className="flex gap-3">
                        <button onClick={()=>setProdutoFormAberto(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancelar</button>
                        <button onClick={salvarProduto} disabled={produtoLoading} className="flex-1 rounded-2xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60">
                          {produtoLoading?<span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Salvando...</span>:produtoEditando?"Salvar alterações":"Adicionar produto"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {produtos.length===0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="text-4xl">🛍</p><p className="mt-3 font-semibold text-slate-700">Nenhum produto cadastrado</p></div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {produtos.map(p=>(
                    <div key={p.id} className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="relative h-48 bg-slate-100">
                        {p.fotos.length>0?<img src={p.fotos[0]} alt={p.nome} className="h-full w-full object-cover"/>:<div className="flex h-full items-center justify-center text-4xl text-slate-300">📷</div>}
                        <div className="absolute left-3 top-3 flex gap-1.5">
                          {p.destaque&&<span className="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white">⭐</span>}
                          {!p.estoque_disponivel&&<span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">Sem estoque</span>}
                          {p.fotos.length>1&&<span className="rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white">{p.fotos.length} fotos</span>}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><p className="font-bold text-slate-900 truncate">{p.nome}</p><p className="text-xs text-slate-500">{p.categoria}</p></div>
                          <div className="shrink-0 text-right">{p.preco_promocional?(<><p className="text-xs text-slate-400 line-through">{fmt(p.preco)}</p><p className="font-bold text-orange-600">{fmt(p.preco_promocional)}</p></>):<p className="font-bold text-orange-600">{fmt(p.preco)}</p>}</div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={()=>abrirEditarProduto(p)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">✏️ Editar</button>
                          <button onClick={()=>excluirProduto(p.id)} disabled={excluindoProduto===p.id} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50">{excluindoProduto===p.id?"...":"🗑️"}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </>
  );
}
