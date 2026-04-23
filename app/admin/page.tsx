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

type Banner = {
  id: string; titulo?: string; subtitulo?: string;
  imagem_url: string; link_url?: string; link_texto?: string;
  ativo: boolean; ordem: number;
  position_x?: number; position_y?: number;
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
  const [aba, setAba] = useState<"eventos"|"produtos"|"banners"|"sugestoes">("eventos");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

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
            {([["eventos","🏁","EVENTOS","Corridas e provas"],["produtos","🛒","PRODUTOS","Loja Moda Run"],["banners","🖼","BANNERS","Carrossel da loja"],["sugestoes","💡","SUGESTÕES","Eventos enviados"]] as const).map(([id,icon,label,desc]) => (
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
          {aba === "banners" && <AbaBanners key="banners-tab" />}
          {aba === "sugestoes" && <AbaSugestoes key="sugestoes-tab" onAprovar={(ev) => { setEventos([ev, ...eventos]); setAba("eventos"); }} />}
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
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [excluindoLote, setExcluindoLote] = useState(false);
  const [syncAberto, setSyncAberto] = useState(false);
  const [sheetId, setSheetId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResultado, setSyncResultado] = useState<{inseridos:number;atualizados:number;total:number;erros:string[]} | null>(null);
  const [syncErro, setSyncErro] = useState("");
  // CSV import
  const [csvAberto, setCsvAberto] = useState(false);
  const [csvTexto, setCsvTexto] = useState("");
  const [csvColunas, setCsvColunas] = useState<string[]>([]);
  const [csvMap, setCsvMap] = useState({ nome:-1,cidade:-1,estado:-1,data:-1,distancia:-1,local:-1,link:-1,destaque:-1 });
  const [importando, setImportando] = useState(false);
  const [importResultado, setImportResultado] = useState<{inseridos:number;atualizados:number;total:number;erros:string[]} | null>(null);
  const [importErro, setImportErro] = useState("");
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [estadoPadrao, setEstadoPadrao] = useState("");

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

  function toggleSelecionado(id: number) {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  }

  function toggleTodos() {
    if (selecionados.size === eventos.length) setSelecionados(new Set());
    else setSelecionados(new Set(eventos.map(e => e.id)));
  }

  async function excluirLote() {
    if (selecionados.size === 0) return;
    if (!confirm(`Excluir ${selecionados.size} evento${selecionados.size > 1 ? "s" : ""}? Esta ação não pode ser desfeita.`)) return;
    setExcluindoLote(true);
    const ids = [...selecionados];
    let ok = 0;
    for (const id of ids) {
      const res = await fetch("/api/admin/eventos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) ok++;
    }
    setEventos(eventos.filter(e => !selecionados.has(e.id)));
    setSelecionados(new Set());
    setExcluindoLote(false);
    if (ok < ids.length) alert(`${ok} de ${ids.length} eventos excluídos.`);
  }

  async function sincronizar() {
    if(!sheetId.trim()){setSyncErro("Informe o ID da planilha.");return;}
    setSyncing(true);setSyncErro("");setSyncResultado(null);
    try {
      const res = await fetch("/api/sync-eventos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sheet_id:sheetId.trim()})});
      const result = await res.json();
      if(!res.ok){setSyncErro(result.error||"Erro ao sincronizar.");setSyncing(false);return;}
      setSyncResultado(result);
      // Reload events from DB
      const { data: ev } = await (await import("@/utils/supabase/client")).createClient().from("eventos").select("*").order("data_evento",{ascending:true});
      setEventos(ev||[]);
    } catch { setSyncErro("Erro de conexão."); }
    setSyncing(false);
  }

  function parseCsvPreview(csv: string) {
    const linhas = csv.trim().split("\n");
    if (linhas.length < 2) return;

    const header = linhas[0].split(/,|;/).map((c: string) => c.replace(/"/g,"").trim());
    setCsvColunas(header);

    // Try to detect by header name first
    const findByName = (terms: string[]) => header.findIndex((h: string) => terms.some((t: string) => h.toLowerCase().includes(t)));

    // Analyze content of each column using first 5 data rows
    const dataRows = linhas.slice(1, 6).map(l => l.split(/,|;/).map((c: string) => c.replace(/"/g,"").trim()));

    function detectColByContent(): { nome: number; cidade: number; estado: number; data: number; distancia: number; local: number; link: number; destaque: number } {
      const scores: Record<string, number[]> = { nome:-1, cidade:-1, estado:-1, data:-1, distancia:-1, link:-1, local:-1, destaque:-1 } as unknown as Record<string, number[]>;
      const result = { nome:-1, cidade:-1, estado:-1, data:-1, distancia:-1, local:-1, link:-1, destaque:-1 };

      // Score each column
      const colScores: { nome:number; cidade:number; estado:number; data:number; distancia:number; link:number }[] = header.map(() => ({ nome:0, cidade:0, estado:0, data:0, distancia:0, link:0 }));

      dataRows.forEach(row => {
        row.forEach((val, i) => {
          if (!val) return;
          const v = val.toLowerCase();

          // Data: DD.MM, DD/MM/YYYY, YYYY-MM-DD
          if (/^\d{1,2}[.\/\-]\d{1,2}([.\/\-]\d{2,4})?$/.test(val)) colScores[i].data += 3;

          // Link: starts with http
          if (v.startsWith("http")) colScores[i].link += 3;

          // Distancia: contains km
          if (/\d+\s*km/i.test(val) || /^\d+$/.test(val) && parseInt(val) < 200) colScores[i].distancia += 2;

          // Estado: 2 uppercase letters
          if (/^[A-Z]{2}$/.test(val.trim())) colScores[i].estado += 3;

          // Cidade: capitalized word, no numbers, no http
          if (!v.startsWith("http") && /^[A-ZÀ-Ú]/.test(val) && !/\d/.test(val) && val.length > 2 && val.length < 40) colScores[i].cidade += 1;

          // Nome: longer text, capitalized, no http
          if (!v.startsWith("http") && val.length > 10 && /[a-zA-ZÀ-Ú]/.test(val)) colScores[i].nome += 1;
        });
      });

      // Pick best column for each field (highest score, no reuse)
      const used = new Set<number>();

      const pick = (field: keyof typeof result, scoreKey: keyof typeof colScores[0], minScore: number) => {
        let best = -1, bestScore = minScore - 1;
        colScores.forEach((s, i) => {
          if (!used.has(i) && s[scoreKey] > bestScore) { best = i; bestScore = s[scoreKey]; }
        });
        if (best >= 0) { result[field] = best; used.add(best); }
      };

      pick("data", "data", 2);
      pick("distancia", "distancia", 1);
      pick("estado", "estado", 2);

      // For links: pick the one with highest link score (longest URL = most specific)
      const linkCols = header.map((_, i) => {
        if (used.has(i)) return null;
        const score = colScores[i].link;
        const avgLen = dataRows.reduce((acc, r) => acc + (r[i]?.length || 0), 0) / dataRows.length;
        return { i, score, avgLen };
      }).filter(Boolean) as { i: number; score: number; avgLen: number }[];
      // Among link columns, pick the longest one (more specific URL)
      const linkCandidates = linkCols.filter(c => c.score >= 2).sort((a, b) => b.avgLen - a.avgLen);
      if (linkCandidates.length > 0) { result.link = linkCandidates[0].i; used.add(linkCandidates[0].i); }

      // For cidade and nome, use remaining text columns
      // Cidade: shortest text, Nome: longest text (but not a URL)
      const textCols = header.map((_, i) => {
        if (used.has(i)) return null;
        const vals = dataRows.map(r => r[i] || "");
        const isUrl = vals.some(v => v.startsWith("http"));
        if (isUrl) return null;
        const avgLen = vals.reduce((acc, v) => acc + v.length, 0) / vals.length;
        return { i, avgLen };
      }).filter(Boolean) as { i: number; avgLen: number }[];

      textCols.sort((a, b) => a.avgLen - b.avgLen);
      if (textCols.length > 0) { result.cidade = textCols[0].i; used.add(textCols[0].i); }
      if (textCols.length > 1) { result.nome = textCols[textCols.length - 1].i; used.add(textCols[textCols.length - 1].i); }

      return result;
    }

    // First try by header name
    const byName = {
      nome: findByName(["nome","event","corrida","prova","titulo","name"]),
      cidade: findByName(["cidade","city","municipio","location"]),
      estado: findByName(["estado","uf","state"]),
      data: findByName(["data","date","dia","quando"]),
      distancia: findByName(["distancia","distância","km","distance","percurso"]),
      local: findByName(["local","endereco","endereço","place","venue"]),
      link: findByName(["link","url","inscricao","inscrição","site","href"]),
      destaque: findByName(["destaque","featured"]),
    };

    // If header names didn't help (generic like "tipo4"), use content analysis
    const namedCount = Object.values(byName).filter(v => v >= 0).length;
    const finalMap = namedCount >= 3 ? byName : { ...detectColByContent(), local: byName.local, destaque: byName.destaque };

    setCsvMap(finalMap);
  }

  async function importarCSV() {
    if(!csvTexto.trim()){setImportErro("Cole o CSV primeiro.");return;}
    if(csvMap.nome<0||csvMap.cidade<0||csvMap.data<0){setImportErro("Mapeie pelo menos: nome, cidade e data.");return;}
    setImportando(true);setImportErro("");setImportResultado(null);
    try {
      const res = await fetch("/api/importar-eventos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv:csvTexto,mapeamento:csvMap,estado_padrao:estadoPadrao||"BR"})});
      const result = await res.json();
      if(!res.ok){setImportErro(result.error||"Erro ao importar.");setImportando(false);return;}
      setImportResultado(result);
      const supabaseClient = (await import("@/utils/supabase/client")).createClient();
      const { data: ev } = await supabaseClient.from("eventos").select("*").order("data_evento",{ascending:true});
      setEventos(ev||[]);
    } catch { setImportErro("Erro de conexão."); }
    setImportando(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {eventos.length > 0 && (
            <>
              <button onClick={toggleTodos}
                className="rounded-xl px-4 py-2.5 text-sm font-black transition-all"
                style={{ background: selecionados.size === eventos.length ? "rgba(92,200,0,0.2)" : "rgba(255,255,255,0.05)", color: selecionados.size > 0 ? "#5CC800" : "#8B949E", border: "1px solid rgba(92,200,0,0.2)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                {selecionados.size === eventos.length ? "✓ TODOS SELECIONADOS" : `☐ SELECIONAR TODOS`}
              </button>
              {selecionados.size > 0 && (
                <button onClick={excluirLote} disabled={excluindoLote}
                  className="rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-60 transition-all hover:brightness-110"
                  style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.4)", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {excluindoLote ? "EXCLUINDO..." : `🗑️ EXCLUIR ${selecionados.size}`}
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setSyncAberto(!syncAberto); setCsvAberto(false); }} className="rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110"
            style={{ background: syncAberto?"rgba(92,200,0,0.2)":"rgba(92,200,0,0.1)", color:"#5CC800", border:"1px solid rgba(92,200,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
            📊 SHEETS
          </button>
          <button onClick={abrirNovo} className="rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110"
            style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
            + EVENTO
          </button>
        </div>
      </div>

      {/* Botão importar CSV */}
      <div className="flex flex-wrap gap-3 justify-end" style={{ marginTop:"-8px" }}>
        <button onClick={() => { setCsvAberto(!csvAberto); setSyncAberto(false); }} className="rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
          style={{ background: csvAberto?"rgba(255,184,0,0.2)":"rgba(255,184,0,0.1)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
          📥 IMPORTAR CSV
        </button>
      </div>

      {/* Painel de importação CSV */}
      {csvAberto && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background:"#161B22", border:"1px solid rgba(255,184,0,0.2)" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">📥</span>
            <div>
              <h3 className="font-black text-base" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>IMPORTAR CSV</h3>
              <p className="text-xs mt-1" style={{ color:"#8B949E" }}>Cole o conteúdo CSV ou carregue um arquivo. O sistema detecta as colunas automaticamente.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => csvFileRef.current?.click()}
              className="rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:brightness-110"
              style={{ background:"rgba(255,184,0,0.1)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif" }}>
              📂 CARREGAR ARQUIVO
            </button>
            <input ref={csvFileRef} type="file" accept=".csv,.txt" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const text = ev.target?.result as string;
                  setCsvTexto(text); parseCsvPreview(text);
                };
                reader.readAsText(file, "UTF-8");
                e.target.value = "";
              }} />
          </div>

          <div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>
              OU COLE O CSV AQUI
            </label>
            <textarea value={csvTexto} rows={5} placeholder={"nome,cidade,estado,data,distancia\nCorrida das Flores,Belém,PA,15/06/2026,10km\n..."}
              onChange={e => { setCsvTexto(e.target.value); if(e.target.value.includes("\n")) parseCsvPreview(e.target.value); }}
              style={{ background:"#21262D", border:"1px solid rgba(255,184,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"12px 16px", fontSize:"12px", outline:"none", width:"100%", resize:"none", fontFamily:"monospace" }}
              onFocus={e=>(e.target.style.borderColor="#FFB800")} onBlur={e=>(e.target.style.borderColor="rgba(255,184,0,0.2)")} />
          </div>

          {/* Mapeamento de colunas */}
          {csvColunas.length > 0 && (
            <div>
              <p className="text-xs font-black mb-3" style={{ color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>
                🗂 MAPEAR COLUNAS — Qual coluna corresponde a cada campo?
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  {key:"nome",label:"NOME *"},
                  {key:"cidade",label:"CIDADE *"},
                  {key:"estado",label:"ESTADO"},
                  {key:"data",label:"DATA *"},
                  {key:"distancia",label:"DISTÂNCIA"},
                  {key:"local",label:"LOCAL"},
                  {key:"link",label:"LINK"},
                  {key:"destaque",label:"DESTAQUE"},
                ] as {key:keyof typeof csvMap,label:string}[]).map(campo => (
                  <div key={campo.key}>
                    <label style={{ display:"block", fontSize:"10px", fontWeight:700, color: campo.label.includes("*")?"#FFB800":"#8B949E", marginBottom:"4px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>
                      {campo.label}
                    </label>
                    <select value={csvMap[campo.key]} onChange={e => setCsvMap({...csvMap,[campo.key]:Number(e.target.value)})}
                      style={{ background:"#21262D", border:`1px solid ${campo.label.includes("*")?"rgba(255,184,0,0.3)":"rgba(92,200,0,0.15)"}`, color:"#E6EDF3", borderRadius:"10px", padding:"6px 10px", fontSize:"12px", outline:"none", width:"100%" }}>
                      <option value={-1}>— ignorar —</option>
                      {csvColunas.map((col,i) => <option key={i} value={i}>{col || `Coluna ${i+1}`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estado padrão quando não mapeado */}
          {csvColunas.length > 0 && csvMap.estado < 0 && (
            <div className="rounded-xl p-3" style={{ background:"rgba(255,184,0,0.08)", border:"1px solid rgba(255,184,0,0.25)" }}>
              <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#FFB800", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>
                ⚠️ ESTADO NÃO DETECTADO — DEFINA O ESTADO PARA TODOS OS EVENTOS
              </label>
              <select value={estadoPadrao} onChange={e => setEstadoPadrao(e.target.value)}
                style={{ background:"#21262D", border:"1px solid rgba(255,184,0,0.3)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" }}>
                <option value="">Usar "BR" como padrão</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          )}

          {importErro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.3)" }}>{importErro}</div>}

          {importResultado && (
            <div className="rounded-xl p-4" style={{ background:"rgba(92,200,0,0.08)", border:"1px solid rgba(92,200,0,0.2)" }}>
              <p className="font-black text-sm mb-2" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>✅ IMPORTAÇÃO CONCLUÍDA</p>
              <div className="flex gap-4">
                <div><p className="text-xl font-black" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{importResultado.inseridos}</p><p className="text-xs" style={{ color:"#8B949E" }}>novos</p></div>
                <div><p className="text-xl font-black" style={{ color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>{importResultado.atualizados}</p><p className="text-xs" style={{ color:"#8B949E" }}>atualizados</p></div>
                <div><p className="text-xl font-black" style={{ color:"#E6EDF3", fontFamily:"'Barlow Condensed', sans-serif" }}>{importResultado.total}</p><p className="text-xs" style={{ color:"#8B949E" }}>total</p></div>
              </div>
              {importResultado.erros.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold mb-1" style={{ color:"#FF6B00" }}>Linhas ignoradas:</p>
                  {importResultado.erros.map((e,i) => <p key={i} className="text-xs" style={{ color:"#8B949E" }}>• {e}</p>)}
                </div>
              )}
            </div>
          )}

          {csvColunas.length > 0 && (
            <button type="button" onClick={importarCSV} disabled={importando}
              className="w-full rounded-xl py-3.5 text-sm font-black disabled:opacity-60 transition-all hover:brightness-110"
              style={{ background:"linear-gradient(135deg,#FFB800,#FF8C00)", color:"#0D1117", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
              {importando ? (
                <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black"/>IMPORTANDO...</span>
              ) : `📥 IMPORTAR ${csvTexto.trim().split("\n").length - 1} EVENTO(S)`}
            </button>
          )}
        </div>
      )}

      {/* Painel de sincronização Google Sheets */}
      {syncAberto && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.2)" }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">📊</span>
            <div className="flex-1">
              <h3 className="font-black text-base" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>SINCRONIZAR COM GOOGLE SHEETS</h3>
              <p className="text-xs mt-1" style={{ color:"#8B949E" }}>
                Cole o ID da sua planilha pública. Ela deve ter as colunas nesta ordem:<br />
                <span style={{ color:"#5CC800", fontFamily:"monospace" }}>nome | cidade | estado | data (DD/MM/AAAA) | distancia | local | link_inscricao | destaque (sim/não)</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input type="text" placeholder="ID da planilha (ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms)" value={sheetId}
              onChange={e => setSheetId(e.target.value)}
              style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"13px", outline:"none", flex:1 }}
              onFocus={e=>(e.target.style.borderColor="#5CC800")} onBlur={e=>(e.target.style.borderColor="rgba(92,200,0,0.2)")} />
            <button type="button" onClick={sincronizar} disabled={syncing}
              className="shrink-0 rounded-xl px-5 py-2.5 text-sm font-black disabled:opacity-60 transition-all hover:brightness-110"
              style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", whiteSpace:"nowrap" }}>
              {syncing ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>SINCRONIZANDO...</span>
              ) : "🔄 SINCRONIZAR"}
            </button>
          </div>

          {syncErro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", border:"1px solid rgba(255,107,0,0.3)" }}>{syncErro}</div>}

          {syncResultado && (
            <div className="rounded-xl p-4" style={{ background:"rgba(92,200,0,0.08)", border:"1px solid rgba(92,200,0,0.2)" }}>
              <p className="font-black text-sm mb-2" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>✅ SINCRONIZAÇÃO CONCLUÍDA</p>
              <div className="flex gap-4">
                <div><p className="text-xl font-black" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{syncResultado.inseridos}</p><p className="text-xs" style={{ color:"#8B949E" }}>novos</p></div>
                <div><p className="text-xl font-black" style={{ color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>{syncResultado.atualizados}</p><p className="text-xs" style={{ color:"#8B949E" }}>atualizados</p></div>
                <div><p className="text-xl font-black" style={{ color:"#E6EDF3", fontFamily:"'Barlow Condensed', sans-serif" }}>{syncResultado.total}</p><p className="text-xs" style={{ color:"#8B949E" }}>total</p></div>
              </div>
              {syncResultado.erros.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-bold mb-1" style={{ color:"#FF6B00" }}>Linhas ignoradas:</p>
                  {syncResultado.erros.map((e,i) => <p key={i} className="text-xs" style={{ color:"#8B949E" }}>• {e}</p>)}
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl p-3" style={{ background:"rgba(255,184,0,0.05)", border:"1px solid rgba(255,184,0,0.15)" }}>
            <p className="text-xs font-bold mb-2" style={{ color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em" }}>📋 COMO CONFIGURAR A PLANILHA</p>
            <ol className="text-xs space-y-1" style={{ color:"#8B949E" }}>
              <li>1. Crie uma planilha no <a href="https://sheets.google.com" target="_blank" rel="noreferrer" style={{ color:"#5CC800" }}>Google Sheets</a></li>
              <li>2. Adicione o cabeçalho na linha 1: <span style={{ color:"#E6EDF3", fontFamily:"monospace" }}>nome, cidade, estado, data, distancia, local, link_inscricao, destaque</span></li>
              <li>3. Preencha os eventos a partir da linha 2</li>
              <li>4. Clique em <strong style={{ color:"#E6EDF3" }}>Arquivo → Compartilhar → Qualquer pessoa com o link pode ver</strong></li>
              <li>5. Copie o ID da URL: <span style={{ color:"#5CC800", fontFamily:"monospace" }}>docs.google.com/spreadsheets/d/<strong>ID_AQUI</strong>/edit</span></li>
            </ol>
          </div>
        </div>
      )}

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
          {eventos.map(ev => {
            const selecionado = selecionados.has(ev.id);
            return (
            <div key={ev.id} className="rounded-2xl p-4 transition-all cursor-pointer"
              style={{ background: selecionado ? "rgba(92,200,0,0.08)" : "#161B22", border: selecionado ? "1px solid rgba(92,200,0,0.4)" : "1px solid rgba(92,200,0,0.1)" }}
              onClick={() => toggleSelecionado(ev.id)}>
              <div className="flex gap-3 items-start">
                {/* Checkbox */}
                <div className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded border-2 transition-all"
                  style={{ background: selecionado ? "#5CC800" : "transparent", borderColor: selecionado ? "#5CC800" : "rgba(92,200,0,0.3)" }}>
                  {selecionado && <span className="text-xs font-black" style={{ color: "#0D1117" }}>✓</span>}
                </div>
                <div className="flex-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div onClick={e => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3", fontSize:"17px" }}>{ev.nome}</h3>
                      {ev.destaque&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(255,184,0,0.15)", color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>⭐ DESTAQUE</span>}
                    </div>
                    <p className="mt-0.5 text-sm" style={{ color:"#8B949E" }}>📍 {ev.cidade} — {ev.estado} · 📅 {fmtData(String(ev.data_evento))}{ev.distancia&&` · ${ev.distancia}`}</p>
                    {ev.link_inscricao&&<a href={ev.link_inscricao} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-xs font-bold hover:underline" style={{ color:"#5CC800" }}>🔗 Inscrição</a>}
                  </div>
                  <div className="flex shrink-0 gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={()=>abrirEditar(ev)} className="rounded-xl px-3 py-2 text-xs font-black" style={{ background:"rgba(92,200,0,0.1)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>✏️ EDITAR</button>
                    <button onClick={()=>excluir(ev.id)} disabled={excluindo===ev.id} className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50" style={{ background:"rgba(255,107,0,0.1)", color:"#FF6B00", fontFamily:"'Barlow Condensed', sans-serif" }}>{excluindo===ev.id?"...":"🗑️"}</button>
                  </div>
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

// ─── AbaBanners ───────────────────────────────────────────────────────────────

function AbaBanners(): React.JSX.Element {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data } = await supabase.from("banners").select("*").order("ordem").order("criado_em", { ascending: false });
      setBanners(data || []);
      setCarregando(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState({ titulo: "", subtitulo: "", imagem_url: "", link_url: "", link_texto: "Ver mais", ativo: true, ordem: 0, position_x: 50, position_y: 50 });
  const [loading, setLoading] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function abrirNovo() { setEditando(null); setForm({ titulo:"",subtitulo:"",imagem_url:"",link_url:"",link_texto:"Ver mais",ativo:true,ordem:0,position_x:50,position_y:50 }); setErro(""); setAberto(true); }
  function abrirEditar(b: Banner) { setEditando(b); setForm({ titulo:b.titulo||"",subtitulo:b.subtitulo||"",imagem_url:b.imagem_url,link_url:b.link_url||"",link_texto:b.link_texto||"Ver mais",ativo:b.ativo,ordem:b.ordem,position_x:b.position_x??50,position_y:b.position_y??50 }); setErro(""); setAberto(true); }

  async function uploadImagem(file: File) {
    setUploadando(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/admin/upload-foto", { method: "POST", body: fd });
    const result = await res.json();
    setUploadando(false);
    if (!res.ok) { setErro(result.error || "Erro no upload."); return; }
    setForm(f => ({ ...f, imagem_url: result.url }));
  }

  async function recarregarBanners() {
    const { data } = await supabase.from("banners").select("*").order("ordem").order("criado_em", { ascending: false });
    setBanners(data || []);
  }

  async function salvar() {
    if (!form.imagem_url) { setErro("Carregue uma imagem para o banner."); return; }
    setLoading(true); setErro("");
    const method = editando ? "PATCH" : "POST";
    const formComPosicao = { ...form, position_x: form.position_x ?? 50, position_y: form.position_y ?? 50 };
    const body = editando ? { id: editando.id, ...formComPosicao } : formComPosicao;
    try {
      const res = await fetch("/api/admin/banners", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      setLoading(false);
      if (!res.ok) { setErro(result.error || "Erro ao salvar."); return; }
      await recarregarBanners();
      setAberto(false);
    } catch { setLoading(false); setErro("Erro de conexão."); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este banner?")) return;
    setExcluindo(id);
    try {
      const res = await fetch("/api/admin/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) await recarregarBanners();
      else { const r = await res.json(); alert(r.error || "Erro ao excluir."); }
    } catch { alert("Erro de conexão."); }
    setExcluindo(null);
  }

  async function toggleAtivo(b: Banner) {
    const res = await fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: b.id, ativo: !b.ativo }) });
    if (res.ok) setBanners(banners.map(x => x.id === b.id ? { ...x, ativo: !x.ativo } : x));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#8B949E" }}>Banners aparecem no topo da loja em rotação automática</p>
        <button onClick={abrirNovo} className="rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
          + ADICIONAR BANNER
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && setAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(92,200,0,0.1)" }}>
              <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{editando ? "EDITAR BANNER" : "NOVO BANNER"}</h3>
              <button onClick={() => setAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>✕</button>
            </div>
            <div className="space-y-4 p-6">
              {/* Preview / Upload */}
              <div>
                <label style={s.lbl}>🖼 IMAGEM DO BANNER *</label>
                {form.imagem_url ? (
                  <div>
                    <div className="relative rounded-xl overflow-hidden" style={{ height: "160px" }}>
                      <img src={form.imagem_url} alt="Preview" className="h-full w-full object-cover"
                        style={{ objectPosition: `${Number(form.position_x ?? 50)}% ${Number(form.position_y ?? 50)}%` }} />
                      <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, imagem_url: "" })); }}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: "rgba(255,107,0,0.9)", color: "#fff" }}>✕</button>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label style={{ fontSize:"11px", fontWeight:700, color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>← POSIÇÃO HORIZONTAL →</label>
                          <span style={{ fontSize:"11px", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{Math.round(form.position_x ?? 50)}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={form.position_x ?? 50}
                          onChange={e => setForm(f => ({ ...f, position_x: Number(e.target.value) }))}
                          className="w-full" style={{ accentColor: "#5CC800", cursor: "pointer" }} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label style={{ fontSize:"11px", fontWeight:700, color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>↑ POSIÇÃO VERTICAL ↓</label>
                          <span style={{ fontSize:"11px", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{Math.round(form.position_y ?? 50)}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={form.position_y ?? 50}
                          onChange={e => setForm(f => ({ ...f, position_y: Number(e.target.value) }))}
                          className="w-full" style={{ accentColor: "#5CC800", cursor: "pointer" }} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={uploadando}
                    className="flex w-full flex-col items-center justify-center rounded-xl py-8 transition"
                    style={{ border: "2px dashed rgba(92,200,0,0.3)", background: "rgba(92,200,0,0.03)", color: uploadando ? "#5CC800" : "#8B949E" }}>
                    {uploadando ? (
                      <><span className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "rgba(92,200,0,0.3)", borderTopColor: "#5CC800" }} /><span className="mt-2 text-xs font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>ENVIANDO...</span></>
                    ) : (
                      <><span className="text-3xl">🖼</span><span className="mt-2 text-sm font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>CLIQUE PARA CARREGAR</span><span className="text-xs mt-1">JPG, PNG · máx. 5MB</span></>
                    )}
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) await uploadImagem(f); e.target.value = ""; }} />
              </div>

              <div><label style={s.lbl}>TÍTULO <span style={{ fontWeight: 400 }}>(opcional)</span></label><input type="text" placeholder="Ex: Nova coleção Moda Run 2025" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s.inp} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} /></div>
              <div><label style={s.lbl}>SUBTÍTULO <span style={{ fontWeight: 400 }}>(opcional)</span></label><input type="text" placeholder="Ex: Conjuntos com até 20% off" value={form.subtitulo} onChange={e => setForm({ ...form, subtitulo: e.target.value })} style={s.inp} onFocus={e => (e.target.style.borderColor = "#5CC800")} onBlur={e => (e.target.style.borderColor = "rgba(92,200,0,0.2)")} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={s.lbl}>LINK <span style={{ fontWeight: 400 }}>(opcional)</span></label><input type="url" placeholder="https://..." value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} style={s.inp} /></div>
                <div><label style={s.lbl}>TEXTO DO BOTÃO</label><input type="text" placeholder="Ver mais" value={form.link_texto} onChange={e => setForm({ ...form, link_texto: e.target.value })} style={s.inp} /></div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1"><label style={s.lbl}>ORDEM</label><input type="number" min="0" value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })} style={s.inp} /></div>
                <label className="flex cursor-pointer items-center gap-3 flex-1 rounded-xl p-3" style={{ background: "rgba(92,200,0,0.05)", border: "1px solid rgba(92,200,0,0.15)" }}>
                  <input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} style={{ accentColor: "#5CC800" }} />
                  <div><p className="text-sm font-bold" style={{ color: "#E6EDF3" }}>✅ Ativo</p><p className="text-xs" style={{ color: "#8B949E" }}>Visível na loja</p></div>
                </label>
              </div>

              {erro && <div className="rounded-xl p-3 text-sm font-semibold" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", border: "1px solid rgba(255,107,0,0.3)" }}>{erro}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setAberto(false)} className="flex-1 rounded-xl py-3 text-sm font-black" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>CANCELAR</button>
                <button type="button" onClick={salvar} disabled={loading} className="flex-1 rounded-xl py-3 text-sm font-black hover:brightness-110 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {loading ? "SALVANDO..." : editando ? "SALVAR" : "ADICIONAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-10">
          <div className="h-10 w-10 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.2)" }}>
          <p className="text-4xl mb-2">🖼</p>
          <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUM BANNER CADASTRADO</p>
          <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Adicione banners para exibir no topo da loja</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="overflow-hidden rounded-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
              <div className="relative h-32">
                <img src={b.imagem_url} alt={b.titulo || "Banner"} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                  {b.titulo && <p className="font-black text-sm text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{b.titulo}</p>}
                  {b.subtitulo && <p className="text-xs text-white/80">{b.subtitulo}</p>}
                </div>
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: b.ativo ? "rgba(92,200,0,0.9)" : "rgba(255,107,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {b.ativo ? "ATIVO" : "INATIVO"}
                  </span>
                  {b.ordem > 0 && <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>#{b.ordem}</span>}
                </div>
              </div>
              <div className="flex gap-2 p-3">
                <button onClick={() => toggleAtivo(b)} className="flex-1 rounded-xl py-2 text-xs font-black"
                  style={{ background: b.ativo ? "rgba(255,107,0,0.1)" : "rgba(92,200,0,0.1)", color: b.ativo ? "#FF6B00" : "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {b.ativo ? "⏸ PAUSAR" : "▶ ATIVAR"}
                </button>
                <button onClick={() => abrirEditar(b)} className="flex-1 rounded-xl py-2 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>✏️ EDITAR</button>
                <button onClick={() => excluir(b.id)} disabled={excluindo === b.id} className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {excluindo === b.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AbaSugestoes ─────────────────────────────────────────────────────────────

type Sugestao = {
  id: string; nome: string; cidade: string; estado: string;
  data_evento: string; distancia?: string; local?: string;
  link_inscricao?: string; organizador_nome?: string;
  organizador_whatsapp?: string; status: string; criado_em: string;
};

function AbaSugestoes({ onAprovar }: { onAprovar: (ev: Evento) => void }): React.JSX.Element {
  const supabase = createClient();
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aprovando, setAprovando] = useState<string | null>(null);
  const [rejeitando, setRejeitando] = useState<string | null>(null);
  const [editandoSugestao, setEditandoSugestao] = useState<Sugestao | null>(null);
  const [formEdicao, setFormEdicao] = useState<Sugestao | null>(null);



  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data } = await supabase.from("sugestoes_eventos").select("*")
        .eq("status", "pendente").order("criado_em", { ascending: false });
      setSugestoes(data || []);
      setCarregando(false);
    }
    carregar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function aprovar(s: Sugestao) {
    setAprovando(s.id);
    try {
      // Insert directly via authenticated supabase client
      const { data: novoEvento, error } = await supabase.from("eventos").insert([{
        nome: s.nome, cidade: s.cidade, estado: s.estado,
        data_evento: s.data_evento,
        distancia: s.distancia || null,
        local: s.local || null,
        link_inscricao: s.link_inscricao || null,
        destaque: false,
      }]).select().single();

      if (error) { alert("Erro ao publicar: " + error.message); setAprovando(null); return; }

      await supabase.from("sugestoes_eventos").update({ status: "aprovado" }).eq("id", s.id);
      setSugestoes(prev => prev.filter(x => x.id !== s.id));
      onAprovar(novoEvento as Evento);
    } catch (e) {
      alert("Erro de conexão.");
    }
    setAprovando(null);
  }

  async function rejeitar(id: string) {
    if (!confirm("Rejeitar esta sugestão?")) return;
    setRejeitando(id);
    await supabase.from("sugestoes_eventos").update({ status: "rejeitado" }).eq("id", id);
    setSugestoes(sugestoes.filter(x => x.id !== id));
    setRejeitando(null);
  }



  function fmtData(d: string) { if (!d) return "—"; try { const [a,m,dia] = d.split("-"); return `${dia}/${m}/${a}`; } catch { return d; } }

  return (
    <div className="space-y-6">


            {/* ── SUGESTÕES PENDENTES ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-5 w-1 rounded-full" style={{ background: "#FFB800" }} />
          <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>
            SUGESTÕES PENDENTES
          </h3>
          {sugestoes.length > 0 && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-black"
              style={{ background: "rgba(255,184,0,0.2)", color: "#FFB800", fontFamily: "'Barlow Condensed', sans-serif" }}>
              {sugestoes.length}
            </span>
          )}
        </div>

        {carregando && (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4" style={{ borderColor: "rgba(92,200,0,0.2)", borderTopColor: "#5CC800" }} />
          </div>
        )}

        {!carregando && sugestoes.length === 0 && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "#161B22", border: "1px dashed rgba(92,200,0,0.15)" }}>
            <p className="text-3xl mb-2">✅</p>
            <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUMA SUGESTÃO PENDENTE</p>
            <p className="text-xs mt-1" style={{ color: "#8B949E" }}>
              Compartilhe o link: <span style={{ color: "#5CC800" }}>/sugerir-evento</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          {/* Modal de edição */}
          {editandoSugestao && formEdicao && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
              style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
              onClick={e => e.target === e.currentTarget && setEditandoSugestao(null)}>
              <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.3)" }}>
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>✏️ EDITAR SUGESTÃO</h3>
                    <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>Ajuste os dados antes de publicar</p>
                  </div>
                  <button type="button" onClick={() => setEditandoSugestao(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>✕</button>
                </div>
                <div className="space-y-4 p-6">
                  {[
                    { lbl: "NOME DO EVENTO *", key: "nome", type: "text", placeholder: "Nome do evento" },
                    { lbl: "CIDADE *", key: "cidade", type: "text", placeholder: "Cidade" },
                    { lbl: "DATA *", key: "data_evento", type: "date", placeholder: "" },
                    { lbl: "DISTÂNCIA", key: "distancia", type: "text", placeholder: "Ex: 5km, 10km, 21km" },
                    { lbl: "LOCAL", key: "local", type: "text", placeholder: "Ex: Parque Municipal" },
                    { lbl: "LINK DE INSCRIÇÃO", key: "link_inscricao", type: "url", placeholder: "https://..." },
                  ].map(campo => (
                    <div key={campo.key} className={campo.key === "cidade" ? "grid grid-cols-2 gap-3" : ""}>
                      {campo.key === "cidade" ? (
                        <>
                          <div>
                            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>CIDADE *</label>
                            <input type="text" value={formEdicao.cidade || ""} placeholder="Cidade"
                              onChange={e => setFormEdicao({ ...formEdicao, cidade: e.target.value })}
                              style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" }}
                              onFocus={e => (e.target.style.borderColor="#5CC800")} onBlur={e => (e.target.style.borderColor="rgba(92,200,0,0.2)")} />
                          </div>
                          <div>
                            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>ESTADO *</label>
                            <select value={formEdicao.estado || ""}
                              onChange={e => setFormEdicao({ ...formEdicao, estado: e.target.value })}
                              style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" }}>
                              <option value="">UF</option>
                              {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf} value={uf}>{uf}</option>)}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>{campo.lbl}</label>
                          <input type={campo.type} value={(formEdicao[campo.key as keyof Sugestao] as string) || ""} placeholder={campo.placeholder}
                            onChange={e => setFormEdicao({ ...formEdicao, [campo.key]: e.target.value })}
                            style={{ background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" }}
                            onFocus={e => (e.target.style.borderColor="#5CC800")} onBlur={e => (e.target.style.borderColor="rgba(92,200,0,0.2)")} />
                        </>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditandoSugestao(null)}
                      className="flex-1 rounded-xl py-3 text-sm font-black"
                      style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>
                      CANCELAR
                    </button>
                    <button type="button" onClick={() => { aprovar(formEdicao); setEditandoSugestao(null); }}
                      disabled={aprovando === formEdicao.id}
                      className="flex-1 rounded-xl py-3 text-sm font-black disabled:opacity-60 transition-all hover:brightness-110"
                      style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif" }}>
                      {aprovando === formEdicao.id ? "PUBLICANDO..." : "✅ PUBLICAR EVENTO"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sugestoes.map(s => (
            <div key={s.id} className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(255,184,0,0.2)" }}>
              <div className="mb-3">
                <h4 className="font-black text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{s.nome}</h4>
                <p className="text-xs mt-0.5" style={{ color: "#8B949E" }}>📍 {s.cidade} — {s.estado} · 📅 {fmtData(s.data_evento)}</p>
                {s.distancia && <p className="text-xs" style={{ color: "#5CC800" }}>📏 {s.distancia}</p>}
                {s.local && <p className="text-xs" style={{ color: "#8B949E" }}>📌 {s.local}</p>}
                {s.organizador_nome && <p className="text-xs mt-1" style={{ color: "#8B949E" }}>👤 {s.organizador_nome}{s.organizador_whatsapp && ` · ${s.organizador_whatsapp}`}</p>}
                {s.link_inscricao && <a href={s.link_inscricao} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline" style={{ color: "#5CC800" }}>🔗 Ver inscrição</a>}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditandoSugestao(s); setFormEdicao({ ...s }); }}
                  className="flex-1 rounded-xl py-2.5 text-xs font-black transition-all hover:brightness-110"
                  style={{ background:"rgba(255,184,0,0.15)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.3)", fontFamily:"'Barlow Condensed', sans-serif" }}>
                  ✏️ EDITAR
                </button>
                <button type="button" onClick={() => aprovar(s)} disabled={aprovando === s.id}
                  className="flex-1 rounded-xl py-2.5 text-xs font-black disabled:opacity-60 transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {aprovando === s.id ? "APROVANDO..." : "✅ APROVAR"}
                </button>
                <button type="button" onClick={() => rejeitar(s.id)} disabled={rejeitando === s.id}
                  className="rounded-xl px-3 py-2.5 text-xs font-black disabled:opacity-50"
                  style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {rejeitando === s.id ? "..." : "❌"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
