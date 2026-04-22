"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariacaoCor = {
  cor: string;
  fotos: string[];
  tamanhos: string[]; // tamanhos disponíveis NESSA cor
};

type Evento = {
  id: number; nome: string; cidade: string; estado: string;
  data_evento: string; distancia?: string; local?: string;
  link_inscricao?: string; destaque?: boolean;
};

type Produto = {
  id: string; nome: string; descricao?: string; preco: number;
  preco_promocional?: number; categoria: string;
  fotos: string[];           // fotos gerais
  variacoes_cor: VariacaoCor[]; // variações com fotos e tamanhos por cor
  cores: string[];           // lista simples de cores (derivada de variacoes_cor)
  tamanhos: string[];        // tamanhos gerais (fallback)
  estoque_disponivel: boolean; destaque: boolean;
  whatsapp_msg?: string; ordem: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const categorias = ["Camiseta","Conjunto","Shorts","Calçado","Meia","Boné","Acessório","Nutrição","Hidratação","Outro"];
const tamanhosRoupa = ["PP","P","M","G","GG","XGG"];
const tamanhosTenis = ["34","35","36","37","38","39","40","41","42","43","44","45"];
const coresPadrao = ["Preto","Branco","Cinza","Azul","Vermelho","Verde","Amarelo","Laranja","Rosa","Roxo","Vinho","Bege"];

const s = {
  inp: { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%", transition:"border-color 0.2s" } as React.CSSProperties,
  lbl: { display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" } as React.CSSProperties,
  btn: (active: boolean) => ({ borderRadius:"10px", padding:"6px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", border:"none", transition:"all 0.15s", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em", background: active ? "#5CC800" : "#21262D", color: active ? "#0D1117" : "#8B949E" }) as React.CSSProperties,
};

const eventoVazio = { nome:"",cidade:"",estado:"",data_evento:"",distancia:"",local:"",link_inscricao:"",destaque:false };
const produtoVazio: Omit<Produto,"id"> = { nome:"",descricao:"",preco:0,preco_promocional:undefined,categoria:"Camiseta",fotos:[],variacoes_cor:[],cores:[],tamanhos:[],estoque_disponivel:true,destaque:false,whatsapp_msg:"",ordem:0 };

function fmtData(d: string) { if(!d) return "—"; const [a,m,dia]=String(d).split("-"); return `${dia}/${m}/${a}`; }
function fmtPreco(v: number) { return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [aba, setAba] = useState<"eventos"|"produtos">("eventos");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

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
      setProdutos((pr || []).map((p: Record<string,unknown>) => ({ ...p, variacoes_cor: (p.variacoes_cor as VariacaoCor[]) || [] })) as Produto[]);
      setCarregando(false);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (carregando) return (
    <main className="flex min-h-screen items-center justify-center" style={{ background:"#0D1117" }}>
      <div className="h-12 w-12 animate-spin rounded-full border-4" style={{ borderColor:"rgba(92,200,0,0.2)", borderTopColor:"#5CC800" }} />
    </main>
  );
  if (!autorizado) return <></>;

  return (
    <>
      <Header userEmail={userEmail} isAdmin={true} />
      <main style={{ background:"#0D1117", minHeight:"100vh" }}>
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

          <section className="relative overflow-hidden rounded-2xl p-7 text-white" style={{ background:"linear-gradient(135deg, #161B22, #21262D)", border:"1px solid rgba(92,200,0,0.2)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:"linear-gradient(90deg, #5CC800, #FF6B00)" }} />
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-black mb-3" style={{ background:"rgba(92,200,0,0.1)", border:"1px solid rgba(92,200,0,0.3)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>⚙️ PAINEL ADMIN</span>
            <h1 className="text-2xl font-black" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>Central de Administração</h1>
            <p className="mt-1 text-sm" style={{ color:"#8B949E" }}>Gerencie eventos, produtos e variações da loja.</p>
          </section>

          {/* Tabs */}
          <div className="flex gap-3">
            {([["eventos","🏁","EVENTOS","Corridas e provas"],["produtos","🛒","PRODUTOS","Loja Moda Run"]] as const).map(([id,icon,label,desc]) => (
              <button key={id} onClick={() => setAba(id)}
                className="flex-1 rounded-2xl px-5 py-4 text-left transition-all"
                style={{ background: aba===id ? "rgba(92,200,0,0.1)" : "#161B22", border: `1px solid ${aba===id ? "rgba(92,200,0,0.4)" : "rgba(92,200,0,0.1)"}` }}>
                <p className="font-black text-sm" style={{ fontFamily:"'Barlow Condensed', sans-serif", color: aba===id ? "#5CC800" : "#8B949E", letterSpacing:"0.05em" }}>{icon} {label}</p>
                <p className="text-xs mt-0.5" style={{ color:"#8B949E" }}>{desc}</p>
              </button>
            ))}
          </div>

          {aba === "eventos" && <AbaEventos eventos={eventos} setEventos={setEventos} />}
          {aba === "produtos" && <AbaProdutos produtos={produtos} setProdutos={setProdutos} />}
        </div>
      </main>
    </>
  );
}

// ─── AbaEventos ───────────────────────────────────────────────────────────────

function AbaEventos({ eventos, setEventos }: { eventos: Evento[]; setEventos: (e: Evento[]) => void }): React.JSX.Element {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Evento|null>(null);
  const [form, setForm] = useState(eventoVazio);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<number|null>(null);

  function abrirNovo() { setEditando(null); setForm(eventoVazio); setErro(""); setAberto(true); }
  function abrirEditar(e: Evento) { setEditando(e); setForm({ nome:e.nome,cidade:e.cidade,estado:e.estado,data_evento:String(e.data_evento),distancia:e.distancia||"",local:e.local||"",link_inscricao:e.link_inscricao||"",destaque:e.destaque||false }); setErro(""); setAberto(true); }

  async function salvar() {
    if(!form.nome||!form.cidade||!form.estado||!form.data_evento){setErro("Preencha nome, cidade, estado e data.");return;}
    setLoading(true);setErro("");
    const method = editando?"PATCH":"POST";
    const body = editando?{...form,id:editando.id}:form;
    const res = await fetch("/api/admin/eventos",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const result = await res.json();
    setLoading(false);
    if(!res.ok){setErro(result.error||"Erro.");return;}
    setAberto(false);
    if(editando) setEventos(eventos.map(e=>e.id===editando.id?{...e,...form}:e));
    else setEventos([result.data,...eventos]);
  }

  async function excluir(id: number) {
    if(!confirm("Excluir este evento?"))return;
    setExcluindo(id);
    const res = await fetch("/api/admin/eventos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setExcluindo(null);
    if(res.ok) setEventos(eventos.filter(e=>e.id!==id));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNovo} className="rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
          style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
          + ADICIONAR EVENTO
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }} onClick={e=>e.target===e.currentTarget&&setAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid rgba(92,200,0,0.1)" }}>
              <h3 className="font-black text-lg" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>{editando?"EDITAR EVENTO":"NOVO EVENTO"}</h3>
              <button onClick={()=>setAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E" }}>✕</button>
            </div>
            <div className="space-y-4 p-6">
              <div><label style={s.lbl}>NOME *</label><input type="text" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={s.inp} onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={s.lbl}>CIDADE *</label><input type="text" value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} style={s.inp} onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} /></div>
                <div><label style={s.lbl}>ESTADO *</label>
                  <select value={form.estado} onChange={e=>setForm({...form,estado:e.target.value})} style={s.inp}>
                    <option value="">Selecione</option>
                    {estadosBR.map(uf=><option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={s.lbl}>DATA *</label><input type="date" value={form.data_evento} onChange={e=>setForm({...form,data_evento:e.target.value})} style={s.inp} /></div>
                <div><label style={s.lbl}>DISTÂNCIA</label><input type="text" placeholder="5km, 10km..." value={form.distancia} onChange={e=>setForm({...form,distancia:e.target.value})} style={s.inp} /></div>
              </div>
              <div><label style={s.lbl}>LOCAL</label><input type="text" value={form.local} onChange={e=>setForm({...form,local:e.target.value})} style={s.inp} /></div>
              <div><label style={s.lbl}>LINK DE INSCRIÇÃO</label><input type="url" placeholder="https://..." value={form.link_inscricao} onChange={e=>setForm({...form,link_inscricao:e.target.value})} style={s.inp} /></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background:"rgba(92,200,0,0.05)", border:"1px solid rgba(92,200,0,0.15)" }}>
                <input type="checkbox" checked={form.destaque} onChange={e=>setForm({...form,destaque:e.target.checked})} style={{ accentColor:"#5CC800" }} />
                <div><p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>⭐ Destaque</p><p className="text-xs" style={{ color:"#8B949E" }}>Badge especial na listagem</p></div>
              </label>
              {erro&&<div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.3)" }}>{erro}</div>}
              <div className="flex gap-3">
                <button onClick={()=>setAberto(false)} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", border:"1px solid rgba(255,255,255,0.1)", fontFamily:"'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                <button onClick={salvar} disabled={loading} className="flex-1 rounded-xl py-3 text-sm font-black transition-all hover:brightness-110 disabled:opacity-60" style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif" }}>
                  {loading?"SALVANDO...":editando?"SALVAR":"ADICIONAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {eventos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background:"#161B22", border:"1px dashed rgba(92,200,0,0.2)" }}>
          <p className="text-4xl mb-2">🏁</p>
          <p className="font-black" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>NENHUM EVENTO CADASTRADO</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map(ev => (
            <div key={ev.id} className="rounded-2xl p-5" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.1)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3", fontSize:"17px" }}>{ev.nome}</h3>
                    {ev.destaque&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(255,184,0,0.15)", color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>⭐ DESTAQUE</span>}
                  </div>
                  <p className="mt-0.5 text-sm" style={{ color:"#8B949E" }}>📍 {ev.cidade} — {ev.estado} · 📅 {fmtData(String(ev.data_evento))}{ev.distancia&&` · ${ev.distancia}`}</p>
                  {ev.link_inscricao&&<a href={ev.link_inscricao} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline" style={{ color:"#5CC800" }}>🔗 Inscrição</a>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={()=>abrirEditar(ev)} className="rounded-xl px-3 py-2 text-xs font-black" style={{ background:"rgba(92,200,0,0.1)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>✏️ EDITAR</button>
                  <button onClick={()=>excluir(ev.id)} disabled={excluindo===ev.id} className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", fontFamily:"'Barlow Condensed', sans-serif" }}>{excluindo===ev.id?"...":"🗑️ EXCLUIR"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AbaProdutos ──────────────────────────────────────────────────────────────

function AbaProdutos({ produtos, setProdutos }: { produtos: Produto[]; setProdutos: (p: Produto[]) => void }): React.JSX.Element {
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Produto|null>(null);
  const [form, setForm] = useState<Omit<Produto,"id">>(produtoVazio);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [uploadando, setUploadando] = useState<string|null>(null); // "geral" | "cor:NomeDaCor"
  const [excluindo, setExcluindo] = useState<string|null>(null);
  const [novaCorNome, setNovaCorNome] = useState("");
  const fileGeralRef = useRef<HTMLInputElement>(null);
  const fileCorRefs = useRef<Record<string, HTMLInputElement|null>>({});

  function abrirNovo() { setEditando(null); setForm(produtoVazio); setErro(""); setAberto(true); }
  function abrirEditar(p: Produto) {
    setEditando(p);
    setForm({ ...p, variacoes_cor: p.variacoes_cor?.length ? [...p.variacoes_cor.map(v=>({...v,fotos:[...v.fotos],tamanhos:[...v.tamanhos]}))] : [] });
    setErro(""); setAberto(true);
  }

  // Upload de foto geral
  async function uploadFotoGeral(file: File) {
    setUploadando("geral");
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload-foto", { method:"POST", body:fd });
    const result = await res.json();
    setUploadando(null);
    if(!res.ok){setErro(result.error||"Erro no upload.");return;}
    setForm(f => ({ ...f, fotos: [...f.fotos, result.url] }));
  }

  // Upload de foto por cor
  async function uploadFotoCor(file: File, cor: string) {
    setUploadando(`cor:${cor}`);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload-foto", { method:"POST", body:fd });
    const result = await res.json();
    setUploadando(null);
    if(!res.ok){setErro(result.error||"Erro no upload.");return;}
    setForm(f => ({
      ...f,
      variacoes_cor: f.variacoes_cor.map(v =>
        v.cor === cor ? { ...v, fotos: [...v.fotos, result.url] } : v
      )
    }));
  }

  // Adicionar nova variação de cor
  function adicionarCor() {
    const nome = novaCorNome.trim();
    if (!nome) return;
    if (form.variacoes_cor.find(v => v.cor === nome)) { setErro(`Cor "${nome}" já existe.`); return; }
    setForm(f => ({ ...f, variacoes_cor: [...f.variacoes_cor, { cor: nome, fotos: [], tamanhos: [] }] }));
    setNovaCorNome("");
  }

  function removerCor(cor: string) {
    setForm(f => ({ ...f, variacoes_cor: f.variacoes_cor.filter(v => v.cor !== cor) }));
  }

  // Toggle tamanho numa variação de cor
  function toggleTamanhoCor(cor: string, tam: string) {
    setForm(f => ({
      ...f,
      variacoes_cor: f.variacoes_cor.map(v =>
        v.cor === cor ? { ...v, tamanhos: v.tamanhos.includes(tam) ? v.tamanhos.filter(t=>t!==tam) : [...v.tamanhos, tam] } : v
      )
    }));
  }

  async function salvar() {
    if(!form.nome||!form.preco||!form.categoria){setErro("Nome, preço e categoria são obrigatórios.");return;}
    setLoading(true);setErro("");
    // Derivar lista de cores dos variacoes_cor
    const cores = form.variacoes_cor.map(v => v.cor);
    const body = editando ? { id:editando.id, ...form, cores } : { ...form, cores };
    const method = editando?"PATCH":"POST";
    const res = await fetch("/api/admin/produtos",{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const result = await res.json();
    setLoading(false);
    if(!res.ok){setErro(result.error||"Erro ao salvar.");return;}
    const salvo = { ...body, id: editando?.id || result.data?.id, cores };
    if(editando) setProdutos(produtos.map(p=>p.id===editando.id?salvo as Produto:p));
    else setProdutos([result.data,...produtos]);
    setAberto(false);
  }

  async function excluir(id: string) {
    if(!confirm("Excluir este produto?"))return;
    setExcluindo(id);
    await fetch("/api/admin/produtos",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    setExcluindo(null);
    setProdutos(produtos.filter(p=>p.id!==id));
  }

  const corSelecionada = form.variacoes_cor[0]?.cor || null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={abrirNovo} className="rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
          style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
          + ADICIONAR PRODUTO
        </button>
      </div>

      {/* Modal */}
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-6" style={{ background:"rgba(0,0,0,0.8)", backdropFilter:"blur(8px)" }} onClick={e=>e.target===e.currentTarget&&setAberto(false)}>
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl my-4" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom:"1px solid rgba(92,200,0,0.1)" }}>
              <h3 className="font-black text-lg" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>{editando?`EDITAR: ${editando.nome}`:"NOVO PRODUTO"}</h3>
              <button onClick={()=>setAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E" }}>✕</button>
            </div>

            <div className="space-y-6 p-6">
              {/* Nome e categoria */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1"><label style={s.lbl}>NOME *</label><input type="text" value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} style={s.inp} onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} /></div>
                <div><label style={s.lbl}>CATEGORIA *</label><select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={s.inp}>{categorias.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div><label style={s.lbl}>DESCRIÇÃO</label><textarea value={form.descricao} onChange={e=>setForm({...form,descricao:e.target.value})} rows={2} style={{...s.inp, resize:"none"}} /></div>

              {/* Preços */}
              <div className="grid grid-cols-2 gap-4">
                <div><label style={s.lbl}>PREÇO *</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color:"#8B949E" }}>R$</span><input type="number" step="0.01" min="0" value={form.preco||""} onChange={e=>setForm({...form,preco:Number(e.target.value)})} style={{...s.inp,paddingLeft:"36px"}} /></div></div>
                <div><label style={s.lbl}>PROMO <span style={{ fontWeight:400, textTransform:"none" }}>(opcional)</span></label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color:"#8B949E" }}>R$</span><input type="number" step="0.01" min="0" value={form.preco_promocional||""} onChange={e=>setForm({...form,preco_promocional:e.target.value?Number(e.target.value):undefined})} style={{...s.inp,paddingLeft:"36px"}} /></div></div>
              </div>

              {/* Fotos gerais */}
              <div>
                <label style={s.lbl}>📸 FOTOS GERAIS <span style={{ fontWeight:400, textTransform:"none", letterSpacing:"0" }}>(aparecem quando nenhuma cor está selecionada)</span></label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {form.fotos.map((url,i) => (
                    <div key={i} className="group relative">
                      <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" style={{ border:"1px solid rgba(92,200,0,0.2)" }} />
                      <button onClick={()=>setForm(f=>({...f,fotos:f.fotos.filter(u=>u!==url)}))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs opacity-0 group-hover:opacity-100 transition" style={{ background:"#FF6B00", color:"#fff" }}>✕</button>
                      {i===0&&<span className="absolute bottom-1 left-1 rounded px-1 text-xs" style={{ background:"rgba(0,0,0,0.7)", color:"#5CC800" }}>✓</span>}
                    </div>
                  ))}
                  <button onClick={()=>fileGeralRef.current?.click()} disabled={uploadando==="geral"}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-xl transition"
                    style={{ border:"2px dashed rgba(92,200,0,0.3)", color: uploadando==="geral"?"#5CC800":"#8B949E", background:"rgba(92,200,0,0.03)" }}>
                    {uploadando==="geral" ? <span className="h-5 w-5 animate-spin rounded-full border-2" style={{ borderColor:"rgba(92,200,0,0.3)", borderTopColor:"#5CC800" }} /> : <><span className="text-2xl">+</span><span className="text-xs mt-1" style={{ fontFamily:"'Barlow Condensed', sans-serif" }}>FOTO</span></>}
                  </button>
                  <input ref={fileGeralRef} type="file" accept="image/*" multiple className="hidden" onChange={async e=>{for(const f of Array.from(e.target.files||[])) await uploadFotoGeral(f); e.target.value="";}} />
                </div>
              </div>

              {/* ── VARIAÇÕES DE COR ── */}
              <div>
                <label style={s.lbl}>🎨 VARIAÇÕES DE COR <span style={{ fontWeight:400, textTransform:"none", letterSpacing:"0" }}>(cada cor tem fotos e tamanhos próprios)</span></label>

                {/* Adicionar cor */}
                <div className="flex gap-2 mt-2 mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {coresPadrao.filter(c => !form.variacoes_cor.find(v=>v.cor===c)).map(cor => (
                      <button key={cor} type="button" onClick={()=>{ setForm(f=>({...f,variacoes_cor:[...f.variacoes_cor,{cor,fotos:[],tamanhos:[]}]})); }}
                        className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                        style={{ background:"#21262D", color:"#8B949E", border:"1px solid rgba(92,200,0,0.15)", fontFamily:"'Barlow Condensed', sans-serif" }}>
                        + {cor}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="Outra cor..." value={novaCorNome} onChange={e=>setNovaCorNome(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(e.preventDefault(),adicionarCor())}
                    style={{...s.inp, flex:1}} />
                  <button onClick={adicionarCor} className="rounded-xl px-4 py-2 text-sm font-black"
                    style={{ background:"rgba(92,200,0,0.1)", color:"#5CC800", border:"1px solid rgba(92,200,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif", whiteSpace:"nowrap" }}>
                    + ADICIONAR
                  </button>
                </div>

                {/* Cards de cada cor */}
                {form.variacoes_cor.length === 0 && (
                  <div className="rounded-xl p-4 text-center text-sm" style={{ background:"rgba(92,200,0,0.03)", border:"1px dashed rgba(92,200,0,0.15)", color:"#8B949E" }}>
                    Adicione cores acima para configurar fotos e tamanhos por variação
                  </div>
                )}

                <div className="space-y-4">
                  {form.variacoes_cor.map(variacao => (
                    <div key={variacao.cor} className="rounded-xl p-4" style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.15)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-sm" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3", letterSpacing:"0.05em" }}>🎨 {variacao.cor.toUpperCase()}</span>
                        <button onClick={()=>removerCor(variacao.cor)} className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00" }}>REMOVER</button>
                      </div>

                      {/* Fotos da cor */}
                      <div className="mb-3">
                        <p className="text-xs font-bold mb-2" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>FOTOS</p>
                        <div className="flex flex-wrap gap-2">
                          {variacao.fotos.map((url,i) => (
                            <div key={i} className="group relative">
                              <img src={url} alt={variacao.cor} className="h-16 w-16 rounded-xl object-cover" style={{ border:"1px solid rgba(92,200,0,0.2)" }} />
                              <button onClick={()=>setForm(f=>({...f,variacoes_cor:f.variacoes_cor.map(v=>v.cor===variacao.cor?{...v,fotos:v.fotos.filter(u=>u!==url)}:v)}))}
                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs opacity-0 group-hover:opacity-100 transition" style={{ background:"#FF6B00", color:"#fff" }}>✕</button>
                              {i===0&&<span className="absolute bottom-0.5 left-0.5 rounded px-1 text-xs" style={{ background:"rgba(0,0,0,0.7)", color:"#5CC800" }}>✓</span>}
                            </div>
                          ))}
                          <button onClick={()=>fileCorRefs.current[variacao.cor]?.click()} disabled={uploadando===`cor:${variacao.cor}`}
                            className="flex h-16 w-16 flex-col items-center justify-center rounded-xl transition"
                            style={{ border:"2px dashed rgba(92,200,0,0.3)", color:"#8B949E", background:"rgba(92,200,0,0.03)" }}>
                            {uploadando===`cor:${variacao.cor}` ? <span className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor:"rgba(92,200,0,0.3)", borderTopColor:"#5CC800" }} /> : <span className="text-xl">+</span>}
                          </button>
                          <input ref={el=>{ fileCorRefs.current[variacao.cor]=el; }} type="file" accept="image/*" multiple className="hidden"
                            onChange={async e=>{for(const f of Array.from(e.target.files||[])) await uploadFotoCor(f, variacao.cor); e.target.value="";}} />
                        </div>
                      </div>

                      {/* Tamanhos da cor */}
                      <div>
                        <p className="text-xs font-bold mb-2" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>TAMANHOS DISPONÍVEIS NESSA COR</p>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs mb-1" style={{ color:"#8B949E" }}>Roupas</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tamanhosRoupa.map(t=>(
                                <button key={t} type="button" onClick={()=>toggleTamanhoCor(variacao.cor, t)}
                                  style={s.btn(variacao.tamanhos.includes(t))}>{t}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs mb-1" style={{ color:"#8B949E" }}>Calçados</p>
                            <div className="flex flex-wrap gap-1.5">
                              {tamanhosTenis.map(t=>(
                                <button key={t} type="button" onClick={()=>toggleTamanhoCor(variacao.cor, t)}
                                  style={s.btn(variacao.tamanhos.includes(t))}>{t}</button>
                              ))}
                            </div>
                          </div>
                        </div>
                        {variacao.tamanhos.length > 0 && (
                          <p className="mt-2 text-xs" style={{ color:"#5CC800" }}>✓ {variacao.tamanhos.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opções */}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background:"rgba(92,200,0,0.05)", border:"1px solid rgba(92,200,0,0.15)" }}>
                  <input type="checkbox" checked={form.estoque_disponivel} onChange={e=>setForm({...form,estoque_disponivel:e.target.checked})} style={{ accentColor:"#5CC800" }} />
                  <div><p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>✅ Em estoque</p><p className="text-xs" style={{ color:"#8B949E" }}>Visível na loja</p></div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background:"rgba(255,184,0,0.05)", border:"1px solid rgba(255,184,0,0.15)" }}>
                  <input type="checkbox" checked={form.destaque} onChange={e=>setForm({...form,destaque:e.target.checked})} style={{ accentColor:"#FFB800" }} />
                  <div><p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>⭐ Destaque</p><p className="text-xs" style={{ color:"#8B949E" }}>Primeiro na loja</p></div>
                </label>
              </div>

              <div><label style={s.lbl}>MSG WHATSAPP <span style={{ fontWeight:400 }}>(opcional)</span></label><input type="text" placeholder="Gerada automaticamente se vazio" value={form.whatsapp_msg} onChange={e=>setForm({...form,whatsapp_msg:e.target.value})} style={s.inp} /></div>

              {erro&&<div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.3)" }}>{erro}</div>}

              <div className="flex gap-3">
                <button onClick={()=>setAberto(false)} className="flex-1 rounded-xl py-3.5 text-sm font-black" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", border:"1px solid rgba(255,255,255,0.1)", fontFamily:"'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                <button onClick={salvar} disabled={loading} className="flex-1 rounded-xl py-3.5 text-sm font-black transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif" }}>
                  {loading?"SALVANDO...":editando?"SALVAR ALTERAÇÕES":"ADICIONAR PRODUTO"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      {produtos.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background:"#161B22", border:"1px dashed rgba(92,200,0,0.2)" }}>
          <p className="text-4xl mb-2">🛒</p>
          <p className="font-black" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>NENHUM PRODUTO CADASTRADO</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {produtos.map(p => {
            const fotoExibir = p.variacoes_cor?.[0]?.fotos?.[0] || p.fotos?.[0];
            return (
              <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.15)" }}>
                <div className="relative h-56" style={{ background:"#21262D" }}>
                  {fotoExibir ? <img src={fotoExibir} alt={p.nome} className="h-full w-full" style={{ objectFit:"contain", padding:"8px" }} /> : <div className="flex h-full items-center justify-center text-4xl" style={{ color:"#30363D" }}>📷</div>}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {p.destaque&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(255,184,0,0.2)", color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>⭐</span>}
                    {!p.estoque_disponivel&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(255,107,0,0.2)", color:"#FF6B00", fontFamily:"'Barlow Condensed', sans-serif" }}>SEM ESTOQUE</span>}
                    {p.variacoes_cor?.length>0&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(92,200,0,0.2)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{p.variacoes_cor.length} COR{p.variacoes_cor.length>1?"ES":""}</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black truncate" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3", fontSize:"16px" }}>{p.nome}</p>
                      <p className="text-xs" style={{ color:"#8B949E" }}>{p.categoria}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {p.preco_promocional?(<><p className="text-xs line-through" style={{ color:"#8B949E" }}>{fmtPreco(p.preco)}</p><p className="font-black" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{fmtPreco(p.preco_promocional)}</p></>):<p className="font-black" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{fmtPreco(p.preco)}</p>}
                    </div>
                  </div>
                  {/* Mini preview das cores */}
                  {p.variacoes_cor?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {p.variacoes_cor.map(v => (
                        <div key={v.cor} className="flex items-center gap-1 rounded-lg px-2 py-0.5" style={{ background:"rgba(92,200,0,0.08)", border:"1px solid rgba(92,200,0,0.15)" }}>
                          {v.fotos[0] && <img src={v.fotos[0]} alt={v.cor} className="h-4 w-4 rounded object-cover" />}
                          <span className="text-xs" style={{ color:"#8B949E" }}>{v.cor}</span>
                          {v.tamanhos.length>0&&<span className="text-xs" style={{ color:"#5CC800" }}>({v.tamanhos.length}tam)</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button onClick={()=>abrirEditar(p)} className="flex-1 rounded-xl py-2 text-xs font-black" style={{ background:"rgba(92,200,0,0.1)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>✏️ EDITAR</button>
                    <button onClick={()=>excluir(p.id)} disabled={excluindo===p.id} className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", fontFamily:"'Barlow Condensed', sans-serif" }}>{excluindo===p.id?"...":"🗑️"}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
