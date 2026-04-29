"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createClient } from "@/utils/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type VariacaoCor = {
  cor: string;
  fotos: string[];
  tamanhos: string[];
  esgotado?: boolean;
  tamanhos_esgotados?: string[];
};

type BannerDisplayConfig = { modo?: "cover" | "contain"; altura?: number; position_x?: number; position_y?: number };
type Banner = {
  id: string; titulo?: string; subtitulo?: string;
  imagem_url: string; link_url?: string; link_texto?: string;
  ativo: boolean; ordem: number;
  position_x?: number; position_y?: number;
  paginas?: string[]; produto_id?: string;
  exibir_loja?: boolean;
  config_paginas?: Record<string, BannerDisplayConfig> | null;
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
  quantidade?: number | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const estadosBR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
// Categorias carregadas dinamicamente do banco (veja AbaProdutos)
const tamanhosRoupa = ["PP","P","M","G","GG","XGG"];
const tamanhosTenis = ["34","35","36","37","38","39","40","41","42","43","44","45"];
const coresPadrao = ["Preto","Branco","Cinza","Azul","Vermelho","Verde","Amarelo","Laranja","Rosa","Roxo","Vinho","Bege"];

const s = {
  inp: { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%", transition:"border-color 0.2s" } as React.CSSProperties,
  lbl: { display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" } as React.CSSProperties,
  btn: (active: boolean) => ({ borderRadius:"10px", padding:"6px 14px", fontSize:"12px", fontWeight:700, cursor:"pointer", border:"none", transition:"all 0.15s", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em", background: active ? "#5CC800" : "#21262D", color: active ? "#0D1117" : "#8B949E" }) as React.CSSProperties,
};

const eventoVazio = { nome:"",cidade:"",estado:"",data_evento:"",distancia:"",local:"",link_inscricao:"",destaque:false };
const produtoVazio: Omit<Produto,"id"> = { nome:"",descricao:"",preco:0,preco_promocional:undefined,categoria:"Camiseta",fotos:[],variacoes_cor:[],cores:[],tamanhos:[],estoque_disponivel:true,destaque:false,whatsapp_msg:"",ordem:0,quantidade:null };

function fmtData(d: string) { if(!d) return "—"; const [a,m,dia]=String(d).split("-"); return `${dia}/${m}/${a}`; }
function fmtPreco(v: number) { return v?.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage(): React.JSX.Element {
  const router = useRouter();
  const supabase = createClient();
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [aba, setAba] = useState<"eventos"|"produtos"|"banners"|"sugestoes"|"sync"|"mensagens">("eventos");
  const [lojaRestrita, setLojaRestrita] = useState<boolean | null>(null);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    // Carregar configuração da loja
    supabase.from("app_config").select("valor").eq("chave", "loja_restrita_cidade").single()
      .then(({ data }) => setLojaRestrita(data?.valor !== "false"));
  }, []); // eslint-disable-line

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

  async function toggleLojaRestrita() {
    const novoValor = !lojaRestrita;
    setSalvandoConfig(true);
    await supabase.from("app_config")
      .upsert({ chave: "loja_restrita_cidade", valor: novoValor ? "true" : "false", updated_at: new Date().toISOString() });
    setLojaRestrita(novoValor);
    setSalvandoConfig(false);
  }

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

          {/* ── CONFIG: Restrição da loja por cidade ─────────── */}
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ background: "#161B22", border: "1px solid " + (lojaRestrita ? "rgba(255,184,0,0.25)" : "rgba(92,200,0,0.25)") }}>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🛒</span>
                <p className="font-black text-base" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3", letterSpacing: "0.03em" }}>
                  RESTRIÇÃO DA LOJA POR CIDADE
                </p>
              </div>
              <p className="text-xs" style={{ color: "#8B949E" }}>
                {lojaRestrita
                  ? "🔒 Loja restrita — só usuários que confirmam estar em Tucuruí/PA têm acesso."
                  : "🌎 Loja aberta — qualquer usuário pode acessar, sem restrição de cidade."}
              </p>
            </div>
            <button onClick={toggleLojaRestrita} disabled={salvandoConfig || lojaRestrita === null}
              className="shrink-0 rounded-xl px-6 py-3 font-black text-sm transition-all hover:brightness-110 hover:scale-105 disabled:opacity-50"
              style={{
                background: lojaRestrita
                  ? "linear-gradient(135deg, #5CC800, #4aaa00)"
                  : "linear-gradient(135deg, #FF6B00, #cc5500)",
                color: "#fff",
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: "0.05em",
                boxShadow: lojaRestrita ? "0 4px 16px rgba(92,200,0,0.2)" : "0 4px 16px rgba(255,107,0,0.2)",
              }}>
              {salvandoConfig ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  SALVANDO...
                </span>
              ) : lojaRestrita ? (
                "🌎 LIBERAR PARA TODOS"
              ) : (
                "🔒 RESTRINGIR A TUCURUÍ"
              )}
            </button>
          </div>

          <section className="relative overflow-hidden rounded-2xl p-7 text-white" style={{ background:"linear-gradient(135deg, #161B22, #21262D)", border:"1px solid rgba(92,200,0,0.2)" }}>
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:"linear-gradient(90deg, #5CC800, #FF6B00)" }} />
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-black mb-3" style={{ background:"rgba(92,200,0,0.1)", border:"1px solid rgba(92,200,0,0.3)", color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" }}>⚙️ PAINEL ADMIN</span>
            <h1 className="text-2xl font-black" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3" }}>Central de Administração</h1>
            <p className="mt-1 text-sm" style={{ color:"#8B949E" }}>Gerencie eventos, produtos e variações da loja.</p>
          </section>

          {/* Tabs */}
          <div className="flex gap-3">
            {([["eventos","🏁","EVENTOS","Corridas e provas"],["produtos","🛒","PRODUTOS","Loja Moda Run"],["banners","🖼","BANNERS","Carrossel da loja"],["sugestoes","💡","SUGESTÕES","Eventos enviados"],["sync","🔄","SYNC","corridasbr.com.br"],["mensagens","🔔","MENSAGENS","Notificar usuários"]] as const).map(([id,icon,label,desc]) => (
              <button key={id} onClick={() => setAba(id)}
                className="flex-1 rounded-2xl px-5 py-4 text-left transition-all"
                style={{ background: aba===id ? "rgba(92,200,0,0.1)" : "#161B22", border: aba===id ? "1px solid rgba(92,200,0,0.4)" : "1px solid rgba(92,200,0,0.1)" }}>
                <p className="font-black text-sm" style={{ fontFamily:"'Barlow Condensed', sans-serif", color: aba===id ? "#5CC800" : "#8B949E", letterSpacing:"0.05em" }}>{icon} {label}</p>
                <p className="text-xs mt-0.5" style={{ color:"#8B949E" }}>{desc}</p>
              </button>
            ))}
          </div>

          {aba === "eventos" && <AbaEventos eventos={eventos} setEventos={setEventos} />}
          {aba === "produtos" && <AbaProdutos produtos={produtos} setProdutos={setProdutos} />}
          {aba === "banners" && <AbaBanners key="banners-tab" />}
          {aba === "sugestoes" && <AbaSugestoes key="sugestoes-tab" onAprovar={(ev) => { setEventos([ev, ...eventos]); setAba("eventos"); }} />}
          {aba === "sync" && (
            <AbaSync
              key="sync-tab"
              eventosAtuais={eventos}
              onImportar={async () => {
                // Recarrega lista de eventos apos importacao
                const { data: ev, error } = await supabase
                  .from("eventos")
                  .select("*")
                  .order("data_evento", { ascending: true });

                if (error) {
                  console.error("[onImportar] erro:", error.message);
                } else {
                  setEventos(ev || []);
                }
              }}
            />
          )}
          {aba === "mensagens" && <AbaMensagens key="mensagens-tab" />}
        </div>
      </main>
    </>
  );
}

// ─── AbaEventos ───────────────────────────────────────────────────────────────

function AbaEventos({ eventos, setEventos }: { eventos: Evento[]; setEventos: (e: Evento[]) => void }): React.JSX.Element {
  const supabase = React.useRef(createClient()).current;
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
      const { data: ev } = await supabase.from("eventos").select("*").order("data_evento",{ascending:true});
      setEventos(ev||[]);
    } catch { setSyncErro("Erro de conexão."); }
    setSyncing(false);
  }

  function parseCsvPreview(csv: string) {
    const linhas = csv.trim().split("\n");
    if (linhas.length < 2) return;

    // Remove garbage lines (ads, empty, month headers like "Abril", repeated headers)
    const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
    const linhasLimpas = linhas.filter(l => {
      const v = l.toLowerCase();
      if (v.includes("adsbygoogle") || v.includes("googlesyndication") || v.includes("doubleclick")) return false;
      const clean = l.trim().replace(/[",]/g,"").trim();
      if (!clean) return false;
      // Skip lines that are just a month name
      if (meses.some(m => clean.toLowerCase() === m)) return false;
      return true;
    });

    if (linhasLimpas.length < 1) return;

    // Parse all cleaned lines
    const todasCols = linhasLimpas.map(l => l.split(/,|;/).map((c: string) => c.replace(/"/g,"").trim()));

    // Detect offset: find the first column that has a date pattern DD.MM or DD/MM
    // in MAJORITY of rows (not just one), to avoid false positives from empty rows
    let offset = 0;
    const numRows = Math.min(todasCols.length, 10);
    let bestOffset = 0, bestCount = 0;
    for (let i = 0; i < Math.min(15, (todasCols[0] || []).length); i++) {
      let count = 0;
      for (const row of todasCols.slice(0, numRows)) {
        if (/^\d{1,2}[.\/\-]\d{1,2}/.test(row[i] || "")) count++;
      }
      if (count > bestCount) { bestCount = count; bestOffset = i; }
    }
    if (bestCount > 0) offset = bestOffset;

    // Check if first line is a real header (non-numeric, non-url) or data
    const primeiraLinha = todasCols[0] || [];
    const primeiroValorOffset = primeiraLinha[offset] || "";
    const primeiraEhHeader = !/^\d{1,2}[.\/\-]\d{1,2}/.test(primeiroValorOffset);

    const headerRaw = primeiraEhHeader ? primeiraLinha : Array.from({length: todasCols[0].length}, (_, i) => `col${i+1}`);
    const dataRowsRaw = primeiraEhHeader ? todasCols.slice(1, 7) : todasCols.slice(0, 6);

    // Trim to offset
    const headerFinal = headerRaw.slice(offset);
    const dataRowsFinal = dataRowsRaw.map(r => r.slice(offset));

    setCsvColunas(headerFinal);

    // Detect columns by content scoring
    type ColMap = { nome:number; cidade:number; estado:number; data:number; distancia:number; local:number; link:number; destaque:number };
    const result: ColMap = { nome:-1, cidade:-1, estado:-1, data:-1, distancia:-1, local:-1, link:-1, destaque:-1 };
    const used = new Set<number>();
    const n = headerFinal.length;
    const dataRows = dataRowsFinal;

    const colData   = Array(n).fill(0);
    const colLink   = Array(n).fill(0);
    const colDist   = Array(n).fill(0);
    const colEstado = Array(n).fill(0);
    const colIsUrl  = Array(n).fill(false);
    const colLen    = Array(n).fill(0);

    dataRows.forEach((row: string[]) => {
      row.forEach((val: string, i: number) => {
        if (i >= n || !val) return;
        const v = val.toLowerCase();
        if (/^\d{1,2}[.\/\-]\d{1,2}/.test(val)) colData[i] += 3;
        if (v.startsWith("http")) { colLink[i] += 3; colIsUrl[i] = true; }
        if (/\d+\s*km/i.test(val)) colDist[i] += 2;
        if (/^[A-Z]{2}$/.test(val.trim())) colEstado[i] += 3;
        colLen[i] += val.length;
      });
    });

    const pickBest = (scores: number[], min: number) => {
      let best = -1, bestScore = min - 1;
      scores.forEach((s, i) => { if (!used.has(i) && s > bestScore) { best = i; bestScore = s; } });
      return best;
    };

    const d = pickBest(colData, 2); if (d >= 0) { result.data = d; used.add(d); }
    const dist = pickBest(colDist, 1); if (dist >= 0) { result.distancia = dist; used.add(dist); }
    const est = pickBest(colEstado, 2); if (est >= 0) { result.estado = est; used.add(est); }

    // Best link = highest link score with longest URL
    const linkScore = colLink.map((s, i) => used.has(i) ? -1 : s >= 2 ? colLen[i] : -1);
    const lk = pickBest(linkScore, 0); if (lk >= 0) { result.link = lk; used.add(lk); }
    // Skip remaining URL columns
    colIsUrl.forEach((isUrl, i) => { if (isUrl && !used.has(i)) used.add(i); });

    // Cidade = shortest remaining text, Nome = longest remaining text
    const remaining = colLen.map((len, i) => used.has(i) ? null : { i, len }).filter(Boolean) as {i:number,len:number}[];
    remaining.sort((a, b) => a.len - b.len);
    if (remaining.length === 1) {
      // Only one text column — assign as nome
      result.nome = remaining[0].i;
    } else if (remaining.length > 1) {
      result.cidade = remaining[0].i; used.add(remaining[0].i);
      result.nome = remaining[remaining.length-1].i;
    }

    // Override with header name matches if found
    const findByName = (terms: string[]) => headerFinal.findIndex((h: string) => terms.some((t: string) => h.toLowerCase().includes(t)));
    const named = {
      nome: findByName(["nome","event","corrida","prova","titulo","name"]),
      cidade: findByName(["cidade","city","municipio"]),
      estado: findByName(["estado","uf","state"]),
      data: findByName(["data","date","dia"]),
      distancia: findByName(["distancia","distância","km","distance"]),
      local: findByName(["local","endereco","place"]),
      link: findByName(["link","url","inscricao","inscrição","href"]),
      destaque: findByName(["destaque","featured"]),
    };
    (Object.keys(named) as (keyof ColMap)[]).forEach(k => { if (named[k] >= 0) result[k] = named[k]; });

    setCsvMap(result);
  }

  async function importarCSV() {
    if(!csvTexto.trim()){setImportErro("Cole o CSV primeiro.");return;}
    if(csvMap.nome<0||csvMap.data<0){setImportErro("Mapeie pelo menos: nome e data.");return;}
    setImportando(true);setImportErro("");setImportResultado(null);
    try {
      // Clean CSV before sending: remove garbage lines and apply offset
    const linhasOriginais = csvTexto.trim().split("\n");
    const linhasLimpas = linhasOriginais.filter(l => {
      const v = l.toLowerCase();
      return !v.includes("adsbygoogle") && !v.includes("googlesyndication") && !v.includes("doubleclick") && l.trim().replace(/[",]/g,"").trim().length > 0;
    });
    // Detect offset: find column with most date patterns across all rows
    let csvOffset = 0;
    if (linhasLimpas.length > 1) {
      const allCols = linhasLimpas.map(l => l.split(/,|;/).map((c: string) => c.replace(/"/g,"").trim()));
      let bestOffset2 = 0, bestCount2 = 0;
      const maxCols = Math.min(15, (allCols[0] || []).length);
      for (let i = 0; i < maxCols; i++) {
        let cnt = 0;
        for (const r of allCols.slice(0, 10)) { if (/^\d{1,2}[.\/\-]\d{1,2}/.test(r[i] || "")) cnt++; }
        if (cnt > bestCount2) { bestCount2 = cnt; bestOffset2 = i; }
      }
      if (bestCount2 > 0) csvOffset = bestOffset2;
    }
    // Rebuild CSV without garbage columns
    const csvLimpo = linhasLimpas.map((l: string) => {
      const cols = l.split(/,|;/).map((c: string) => c.replace(/"/g,"").trim());
      const trimmed = cols.slice(csvOffset);
      return trimmed.map((c: string) => `"${c}"`).join(",");
    }).join("\n");

    // Validate map indices — clamp to actual number of columns
    const numCols = csvColunas.length;
    const mapValidado = {
      nome: csvMap.nome < numCols ? csvMap.nome : -1,
      cidade: csvMap.cidade < numCols ? csvMap.cidade : -1,
      estado: csvMap.estado < numCols ? csvMap.estado : -1,
      data: csvMap.data < numCols ? csvMap.data : -1,
      distancia: csvMap.distancia < numCols ? csvMap.distancia : -1,
      local: csvMap.local < numCols ? csvMap.local : -1,
      link: csvMap.link < numCols ? csvMap.link : -1,
      destaque: csvMap.destaque < numCols ? csvMap.destaque : -1,
    };

    const res = await fetch("/api/importar-eventos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({csv:csvLimpo,mapeamento:mapValidado,estado_padrao:estadoPadrao||"BR"})});
      const result = await res.json();
      if(!res.ok){setImportErro(result.error||"Erro ao importar.");setImportando(false);return;}
      setImportResultado(result);
      const supabaseClient = supabase;
      const { data: ev } = await supabaseClient.from("eventos").select("*").order("data_evento",{ascending:true});
      setEventos(ev||[]);
    } catch { setImportErro("Erro de conexão."); }
    setImportando(false);
  }

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
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label style={s.lbl}>CATEGORIA *</label>
                    <button type="button" onClick={() => setGerenciarCats(!gerenciarCats)}
                      className="text-xs font-black transition-all"
                      style={{ color: gerenciarCats ? "#FF6B00" : "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
                      {gerenciarCats ? "✕ FECHAR" : "⚙️ GERENCIAR"}
                    </button>
                  </div>
                  <select value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} style={s.inp}>
                    {categorias.map(cat=><option key={cat} value={cat}>{cat}</option>)}
                  </select>

                  {/* Painel de gerenciamento de categorias */}
                  {gerenciarCats && (
                    <div className="mt-2 rounded-xl p-4 space-y-3" style={{ background: "#0D1117", border: "1px solid rgba(92,200,0,0.2)" }}>
                      <p className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>GERENCIAR CATEGORIAS</p>

                      {/* Adicionar nova */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nova categoria..."
                          value={novaCategoria}
                          onChange={e => setNovaCategoria(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && adicionarCategoria()}
                          style={{ ...s.inp, flex: 1, padding: "8px 12px", fontSize: "13px" }}
                        />
                        <button type="button" onClick={adicionarCategoria} disabled={salvandoCat || !novaCategoria.trim()}
                          className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50 transition-all hover:brightness-110"
                          style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", whiteSpace: "nowrap" }}>
                          {salvandoCat ? "..." : "+ ADD"}
                        </button>
                      </div>

                      {/* Lista de categorias */}
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {categorias.map(cat => (
                          <div key={cat} className="flex items-center gap-1 rounded-lg px-2.5 py-1"
                            style={{ background: form.categoria === cat ? "rgba(92,200,0,0.2)" : "#21262D", border: form.categoria === cat ? "1px solid rgba(92,200,0,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
                            <button type="button" onClick={() => setForm({...form, categoria: cat})}
                              className="text-xs font-black"
                              style={{ color: form.categoria === cat ? "#5CC800" : "#E6EDF3", fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {cat}
                            </button>
                            <button type="button" onClick={() => removerCategoria(cat)} disabled={removendoCat === cat}
                              className="ml-0.5 rounded text-xs transition-all hover:text-red-400"
                              style={{ color: "#8B949E", background: "none", border: "none", cursor: "pointer", lineHeight: 1, padding: "0 2px" }}>
                              {removendoCat === cat ? "..." : "×"}
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: "#8B949E" }}>Clique na categoria para selecioná-la. × para remover.</p>
                    </div>
                  )}
                </div>
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
                        {/* Toggle ESGOTADO para esta cor */}
                        <div className="mt-3 flex items-center gap-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-black"
                            style={{ background: variacao.esgotado ? "rgba(255,107,0,0.15)" : "rgba(92,200,0,0.08)", border: "1px solid " + (variacao.esgotado ? "rgba(255,107,0,0.4)" : "rgba(92,200,0,0.2)"), color: variacao.esgotado ? "#FF6B00" : "#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>
                            <input type="checkbox" checked={!!variacao.esgotado}
                              onChange={e => setForm(f => ({ ...f, variacoes_cor: f.variacoes_cor.map(v => v.cor === variacao.cor ? { ...v, esgotado: e.target.checked } : v) }))}
                              style={{ accentColor: "#FF6B00" }} />
                            {variacao.esgotado ? "🚫 ESGOTADO" : "✅ DISPONÍVEL"}
                          </label>
                        </div>
                        {/* Tamanhos esgotados individualmente */}
                        {variacao.tamanhos.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-black mb-1.5" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.06em" }}>TAMANHOS ESGOTADOS:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {variacao.tamanhos.map(t => {
                                const esgotado = variacao.tamanhos_esgotados?.includes(t);
                                return (
                                  <button key={t} type="button"
                                    onClick={() => setForm(f => ({ ...f, variacoes_cor: f.variacoes_cor.map(v => {
                                      if (v.cor !== variacao.cor) return v;
                                      const lista = v.tamanhos_esgotados || [];
                                      return { ...v, tamanhos_esgotados: esgotado ? lista.filter(x => x !== t) : [...lista, t] };
                                    })}))}
                                    className="rounded-lg px-2.5 py-1 text-xs font-black transition-all"
                                    style={{ background: esgotado ? "rgba(255,107,0,0.2)" : "#21262D", color: esgotado ? "#FF6B00" : "#8B949E", border: "1px solid " + (esgotado ? "rgba(255,107,0,0.4)" : "transparent"), fontFamily:"'Barlow Condensed', sans-serif", textDecoration: esgotado ? "line-through" : "none" }}>
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs mt-1" style={{ color:"#8B949E" }}>Clique para marcar/desmarcar como esgotado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destaque */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background:"rgba(255,184,0,0.05)", border:"1px solid rgba(255,184,0,0.15)" }}>
                <input type="checkbox" checked={form.destaque} onChange={e=>setForm({...form,destaque:e.target.checked})} style={{ accentColor:"#FFB800" }} />
                <div><p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>⭐ Destaque</p><p className="text-xs" style={{ color:"#8B949E" }}>Primeiro na loja</p></div>
              </label>

              {/* Quantidade e estoque */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={s.lbl}>📦 QUANTIDADE EM ESTOQUE</label>
                  <input type="number" min="0" placeholder="Ex: 10 (opcional)" value={form.quantidade ?? ""} onChange={e=>setForm({...form,quantidade:e.target.value?Number(e.target.value):null})} style={s.inp} />
                  <p className="text-xs mt-1" style={{ color:"#8B949E" }}>Visível só para você (admin)</p>
                </div>
                <div className="flex items-center">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3 w-full" style={{ background:"rgba(92,200,0,0.05)", border:"1px solid rgba(92,200,0,0.15)" }}>
                    <input type="checkbox" checked={form.estoque_disponivel} onChange={e=>setForm({...form,estoque_disponivel:e.target.checked})} style={{ accentColor:"#5CC800" }} />
                    <div><p className="text-sm font-bold" style={{ color:"#E6EDF3" }}>✅ Em estoque</p><p className="text-xs" style={{ color:"#8B949E" }}>Visível na loja</p></div>
                  </label>
                </div>
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
                    {p.quantidade!=null&&<span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background:"rgba(255,184,0,0.15)", color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>📦 {p.quantidade}</span>}
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
                        <div key={v.cor} className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                          style={{ background: v.esgotado ? "rgba(255,107,0,0.1)" : "rgba(92,200,0,0.08)", border: "1px solid " + (v.esgotado ? "rgba(255,107,0,0.3)" : "rgba(92,200,0,0.15)") }}>
                          {v.fotos[0] && <img src={v.fotos[0]} alt={v.cor} className="h-4 w-4 rounded object-cover" style={{ opacity: v.esgotado ? 0.4 : 1 }} />}
                          <span className="text-xs" style={{ color: v.esgotado ? "#FF6B00" : "#8B949E", textDecoration: v.esgotado ? "line-through" : "none" }}>{v.cor}</span>
                          {v.esgotado && <span className="text-xs" style={{ color:"#FF6B00" }}>🚫</span>}
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
  const supabase = React.useRef(createClient()).current;
  const [banners, setBanners] = useState<Banner[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Banner | null>(null);
  const [form, setForm] = useState({ titulo: "", subtitulo: "", imagem_url: "", link_url: "", link_texto: "Ver mais", ativo: true, exibir_loja: true, ordem: 0, position_x: 50, position_y: 50, paginas: [] as string[], produto_id: "", config_paginas: {} as Record<string, BannerDisplayConfig> });
  const [paginaAjuste, setPaginaAjuste] = useState("loja");
  const [loading, setLoading] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [produtos, setProdutos] = useState<{id:string;nome:string;fotos:string[];variacoes_cor:{fotos:string[]}[]}[]>([]);

  useEffect(() => {
    async function carregar() {
      setCarregando(true);
      const { data } = await supabase.from("banners").select("*").order("ordem").order("criado_em", { ascending: false });
      setBanners(data || []);
      setCarregando(false);
    }
    carregar();
    supabase.from("produtos").select("id, nome, fotos, variacoes_cor").eq("estoque_disponivel", true).order("nome").then(({ data }) => setProdutos(data || []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function abrirNovo() { setEditando(null); setPaginaAjuste("loja"); setForm({ titulo:"",subtitulo:"",imagem_url:"",link_url:"",link_texto:"Ver mais",ativo:true,exibir_loja:true,ordem:0,position_x:50,position_y:50,paginas:[],produto_id:"",config_paginas:{} }); setErro(""); setAberto(true); }
  function abrirEditar(ban: Banner) { setEditando(ban); setPaginaAjuste("loja"); setForm({ titulo:ban.titulo||"",subtitulo:ban.subtitulo||"",imagem_url:ban.imagem_url,link_url:ban.link_url||"",link_texto:ban.link_texto||"Ver mais",ativo:ban.ativo,exibir_loja:ban.exibir_loja ?? true,ordem:ban.ordem,position_x:ban.position_x??50,position_y:ban.position_y??50,paginas:ban.paginas||[], produto_id:ban.produto_id||"",config_paginas:ban.config_paginas||{} }); setErro(""); setAberto(true); }

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
    const formFinal = { ...form, position_x: form.position_x ?? 50, position_y: form.position_y ?? 50, paginas: form.paginas || [], produto_id: form.produto_id || null, exibir_loja: form.exibir_loja ?? true, config_paginas: form.config_paginas || {} };
    const body = editando ? { id: editando.id, ...formFinal } : formFinal;
    try {
      const res = await fetch("/api/admin/banners", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      setLoading(false);
      if (!res.ok) { setErro(result.error || "Erro ao salvar."); return; }
      await recarregarBanners();
      setAberto(false);
    } catch { setLoading(false); setErro("Erro de conexao."); }
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este banner?")) return;
    setExcluindo(id);
    try {
      const res = await fetch("/api/admin/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (res.ok) await recarregarBanners();
      else { const r = await res.json(); alert(r.error || "Erro ao excluir."); }
    } catch { alert("Erro de conexao."); }
    setExcluindo(null);
  }

  async function toggleAtivo(ban: Banner) {
    const res = await fetch("/api/admin/banners", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ban.id, ativo: !ban.ativo }) });
    if (res.ok) setBanners(banners.map(x => x.id === ban.id ? { ...x, ativo: !x.ativo } : x));
  }

  const s = {
    lbl: { display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.08em", marginBottom:"6px" } as React.CSSProperties,
    inp: { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" } as React.CSSProperties,
  };

  const paginasDisponiveis = [
    ["loja", "Loja"],
    ["feed", "Feed / Comunidade"],
    ["eventos", "Eventos"],
    ["calculadora-pace", "Calc. Pace"],
    ["calculadora-fc", "Calc. FC"],
    ["criar-treino", "Criar treino"],
  ] as const;

  const paginasParaAjuste = paginasDisponiveis.filter(([val]) => val === "loja" || (form.paginas || []).includes(val));
  const configAtual = form.config_paginas?.[paginaAjuste] || {};
  const alturaAtual = Number(configAtual.altura ?? (paginaAjuste === "loja" ? 280 : paginaAjuste === "feed" ? 80 : 140));
  const modoAtual = configAtual.modo ?? "cover";
  const positionXAtual = Number(configAtual.position_x ?? form.position_x ?? 50);
  const positionYAtual = Number(configAtual.position_y ?? form.position_y ?? 50);

  function atualizarConfigPagina(campo: keyof BannerDisplayConfig, valor: string | number) {
    setForm(f => ({
      ...f,
      config_paginas: {
        ...(f.config_paginas || {}),
        [paginaAjuste]: {
          ...((f.config_paginas || {})[paginaAjuste] || {}),
          [campo]: valor,
        },
      },
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#8B949E" }}>Gerencie banners da loja e propagandas exibidas em paginas do app</p>
        <button onClick={abrirNovo} className="rounded-xl px-5 py-3 text-sm font-black transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg,#5CC800,#4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
          + ADICIONAR BANNER
        </button>
      </div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={e => e.target === e.currentTarget && setAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.2)" }}>
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(92,200,0,0.1)" }}>
              <h3 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>{editando ? "EDITAR BANNER" : "NOVO BANNER"}</h3>
              <button onClick={() => setAberto(false)} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.05)", color: "#8B949E" }}>x</button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label style={s.lbl}>IMAGEM DO BANNER *</label>
                <div className="relative overflow-hidden rounded-xl" style={{ height: 160, background: "#21262D", border: "2px dashed rgba(92,200,0,0.3)" }}>
                  {form.imagem_url ? (
                    <img src={form.imagem_url} alt="" className="h-full w-full"
                      style={{ objectFit: modoAtual, objectPosition: positionXAtual + "% " + positionYAtual + "%" }} />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <span className="text-3xl">img</span>
                      <p className="text-sm" style={{ color: "#8B949E" }}>Clique para fazer upload</p>
                    </div>
                  )}
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadando}
                    className="absolute bottom-2 right-2 rounded-xl px-3 py-1.5 text-xs font-black"
                    style={{ background: "rgba(92,200,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {uploadando ? "ENVIANDO..." : form.imagem_url ? "TROCAR" : "+ UPLOAD"}
                  </button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImagem(f); e.target.value = ""; }} />
              </div>

              {/* Seletor de produto */}
              <div>
                <label style={s.lbl}>OU SELECIONAR PRODUTO CADASTRADO (opcional)</label>
                <select value={form.produto_id || ""} onChange={e => {
                  const pid = e.target.value;
                  if (pid) {
                    const prod = produtos.find(p => p.id === pid);
                    const foto = prod?.variacoes_cor?.[0]?.fotos?.[0] ?? prod?.fotos?.[0] ?? "";
                    setForm(f => ({ ...f, produto_id: pid, imagem_url: f.imagem_url || foto }));
                  } else {
                    setForm(f => ({ ...f, produto_id: "" }));
                  }
                }} style={s.inp}>
                  <option value="">-- Nenhum produto selecionado --</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
                <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Se selecionado, usa a foto e preco do produto automaticamente.</p>
              </div>
              {form.imagem_url && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(92,200,0,0.05)", border: "1px solid rgba(92,200,0,0.15)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>AJUSTE VISUAL POR PAGINA</p>
                      <p className="text-xs" style={{ color: "#8B949E" }}>Configure altura, preenchimento e posicao para cada local.</p>
                    </div>
                    <select value={paginaAjuste} onChange={e => setPaginaAjuste(e.target.value)} style={{ ...s.inp, width: 160, padding: "8px 10px" }}>
                      {paginasParaAjuste.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => atualizarConfigPagina("modo", "cover")}
                      className="rounded-xl py-2 text-xs font-black"
                      style={{ background: modoAtual === "cover" ? "#5CC800" : "rgba(255,255,255,0.05)", color: modoAtual === "cover" ? "#0D1117" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      PREENCHER / CORTAR
                    </button>
                    <button type="button" onClick={() => atualizarConfigPagina("modo", "contain")}
                      className="rounded-xl py-2 text-xs font-black"
                      style={{ background: modoAtual === "contain" ? "#5CC800" : "rgba(255,255,255,0.05)", color: modoAtual === "contain" ? "#0D1117" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      INTEIRA / SEM CORTAR
                    </button>
                  </div>

                  <div>
                    <label style={s.lbl}>ALTURA: <span style={{ color: "#5CC800" }}>{alturaAtual}px</span></label>
                    <input type="range" min={paginaAjuste === "feed" ? 70 : 100} max={paginaAjuste === "loja" ? 420 : 260} value={alturaAtual} onChange={e => atualizarConfigPagina("altura", Number(e.target.value))} className="w-full" style={{ accentColor: "#5CC800" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={s.lbl}>POSICAO X: <span style={{ color: "#5CC800" }}>{Math.round(positionXAtual)}%</span></label>
                      <input type="range" min="0" max="100" value={positionXAtual} onChange={e => atualizarConfigPagina("position_x", Number(e.target.value))} className="w-full" style={{ accentColor: "#5CC800" }} />
                    </div>
                    <div>
                      <label style={s.lbl}>POSICAO Y: <span style={{ color: "#5CC800" }}>{Math.round(positionYAtual)}%</span></label>
                      <input type="range" min="0" max="100" value={positionYAtual} onChange={e => atualizarConfigPagina("position_y", Number(e.target.value))} className="w-full" style={{ accentColor: "#5CC800" }} />
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><label style={s.lbl}>TITULO</label><input type="text" placeholder="Ex: Nova Colecao" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} style={s.inp} /></div>
                <div><label style={s.lbl}>SUBTITULO</label><input type="text" placeholder="Ex: Confira agora" value={form.subtitulo} onChange={e => setForm({ ...form, subtitulo: e.target.value })} style={s.inp} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={s.lbl}>LINK URL</label><input type="text" placeholder="Ex: /loja" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} style={s.inp} /></div>
                <div><label style={s.lbl}>TEXTO DO LINK</label><input type="text" placeholder="Ex: Ver mais" value={form.link_texto} onChange={e => setForm({ ...form, link_texto: e.target.value })} style={s.inp} /></div>
              </div>
              <div className="space-y-3">
                <div><label style={s.lbl}>ORDEM</label><input type="number" min="0" value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })} style={s.inp} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background: "rgba(92,200,0,0.05)", border: "1px solid rgba(92,200,0,0.15)" }}>
                    <input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} style={{ accentColor: "#5CC800" }} />
                    <div><p className="text-sm font-bold" style={{ color: "#E6EDF3" }}>Banner ativo</p><p className="text-xs" style={{ color: "#8B949E" }}>Permite aparecer onde estiver configurado.</p></div>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}>
                    <input type="checkbox" checked={form.exibir_loja} onChange={e => setForm({ ...form, exibir_loja: e.target.checked })} style={{ accentColor: "#FF6B00" }} />
                    <div><p className="text-sm font-bold" style={{ color: "#E6EDF3" }}>Exibir na loja</p><p className="text-xs" style={{ color: "#8B949E" }}>Desmarque para ocultar só no topo da loja.</p></div>
                  </label>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}>
                <p className="text-xs font-black mb-2" style={{ color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>MOSTRAR COMO PROPAGANDA NAS PAGINAS</p>
                <p className="text-xs mb-3" style={{ color: "#8B949E" }}>Selecione onde este banner aparece como propaganda da loja.</p>
                <div className="grid grid-cols-2 gap-2">
                  {paginasDisponiveis.filter(([val]) => val !== "loja").map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer rounded-xl px-3 py-2"
                      style={{ background: (form.paginas||[]).includes(val) ? "rgba(92,200,0,0.1)" : "rgba(255,255,255,0.03)", border: (form.paginas||[]).includes(val) ? "1px solid rgba(92,200,0,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
                      <input type="checkbox" checked={(form.paginas||[]).includes(val)}
                        onChange={e => setForm(f => ({ ...f, paginas: e.target.checked ? [...(f.paginas||[]), val] : (f.paginas||[]).filter(p => p !== val) }))}
                        style={{ accentColor: "#5CC800" }} />
                      <span className="text-xs font-black" style={{ color: (form.paginas||[]).includes(val) ? "#5CC800" : "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>{label}</span>
                    </label>
                  ))}
                </div>
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
          <p className="text-4xl mb-2">img</p>
          <p className="font-black" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif" }}>NENHUM BANNER CADASTRADO</p>
          <p className="text-xs mt-1" style={{ color: "#8B949E" }}>Adicione banners para exibir no topo da loja</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map(ban => (
            <div key={ban.id} className="overflow-hidden rounded-2xl" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
              <div className="relative h-32">
                <img src={ban.imagem_url} alt={ban.titulo || "Banner"} className="h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6), transparent)" }} />
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                  <div>
                    {ban.titulo && <p className="font-black text-sm" style={{ color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>{ban.titulo}</p>}
                    {ban.subtitulo && <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>{ban.subtitulo}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: ban.ativo ? "rgba(92,200,0,0.9)" : "rgba(255,107,0,0.9)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {ban.ativo ? "ATIVO" : "INATIVO"}
                    </span>
                    {ban.ordem > 0 && <span className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif" }}>#{ban.ordem}</span>}
                  </div>
                </div>
              </div>
              {ban.paginas && ban.paginas.length > 0 && (
                <div className="px-3 py-2 flex gap-1 flex-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  {ban.paginas.map(p => (
                    <span key={p} className="rounded-lg px-2 py-0.5 text-xs font-black" style={{ background: "rgba(255,107,0,0.15)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>{p}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 p-3">
                <button onClick={() => toggleAtivo(ban)} className="flex-1 rounded-xl py-2 text-xs font-black"
                  style={{ background: ban.ativo ? "rgba(255,107,0,0.1)" : "rgba(92,200,0,0.1)", color: ban.ativo ? "#FF6B00" : "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {ban.ativo ? "PAUSAR" : "ATIVAR"}
                </button>
                <button onClick={() => abrirEditar(ban)} className="flex-1 rounded-xl py-2 text-xs font-black" style={{ background: "rgba(92,200,0,0.1)", color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>EDITAR</button>
                <button onClick={() => excluir(String(ban.id))} disabled={excluindo === String(ban.id)} className="rounded-xl px-3 py-2 text-xs font-black disabled:opacity-50" style={{ background: "rgba(255,107,0,0.1)", color: "#FF6B00", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {excluindo === String(ban.id) ? "..." : "X"}
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
  const supabase = React.useRef(createClient()).current;
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


// ─── AbaSync ─────────────────────────────────────────────────────────────────
type EventoPreview = {
  nome: string;
  cidade: string;
  estado: string;
  data_evento: string;
  distancia?: string | null;
  local?: string | null;
  link_inscricao?: string | null;
  selecionado?: boolean;
  jaExiste?: boolean;
};

function normalizarTextoEvento(valor: string): string {
  return (valor || "")
    .replace(/�/g, "")
    .replace(/ª/g, "a")
    .replace(/º/g, "o")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function chaveEventoLocal(evento: { nome: string; cidade: string; estado: string; data_evento: string }): string {
  return [
    normalizarTextoEvento(evento.nome),
    normalizarTextoEvento(evento.cidade),
    normalizarTextoEvento(evento.estado).toUpperCase(),
    evento.data_evento,
  ].join("|");
}


function AbaMensagens(): React.JSX.Element {
  const [titulo, setTitulo] = React.useState("");
  const [corpo, setCorpo] = React.useState("");
  const [destino, setDestino] = React.useState<"todos"|"cidade"|"usuario">("todos");
  const [cidade, setCidade] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [link, setLink] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<{ enviadas: number } | null>(null);
  const [erro, setErro] = React.useState("");

  async function enviar() {
    if (!titulo.trim()) { setErro("Titulo obrigatorio."); return; }
    setEnviando(true); setErro(""); setResultado(null);
    const res = await fetch("/api/admin/mensagem", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ titulo: titulo.trim(), corpo: corpo.trim(), destino, cidade: cidade.trim() || null, user_id: userId.trim() || null, link: link.trim() || null }),
    });
    const data = await res.json();
    if (!res.ok) setErro(data.error || "Erro ao enviar.");
    else setResultado(data);
    setEnviando(false);
  }

  const inp2 = { background:"#21262D", border:"1px solid rgba(92,200,0,0.2)", color:"#E6EDF3", borderRadius:"12px", padding:"10px 14px", fontSize:"14px", outline:"none", width:"100%" } as React.CSSProperties;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5" style={{ background: "#161B22", border: "1px solid rgba(92,200,0,0.1)" }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-1 rounded-full" style={{ background: "#5CC800" }} />
          <h2 className="font-black text-lg" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "#E6EDF3" }}>ENVIAR MENSAGEM AOS USUARIOS</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>DESTINO</label>
            <div className="flex gap-2">
              {(["todos","cidade","usuario"] as const).map(d => (
                <button key={d} onClick={() => setDestino(d)}
                  className="flex-1 rounded-xl py-2 text-xs font-black transition-all"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", background: destino === d ? "rgba(92,200,0,0.15)" : "#21262D", color: destino === d ? "#5CC800" : "#8B949E", border: destino === d ? "1px solid rgba(92,200,0,0.4)" : "1px solid rgba(255,255,255,0.1)" }}>
                  {d === "todos" ? "TODOS" : d === "cidade" ? "CIDADE" : "USUARIO"}
                </button>
              ))}
            </div>
          </div>

          {destino === "cidade" && (
            <div>
              <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>CIDADE</label>
              <input value={cidade} onChange={e => setCidade(e.target.value)} placeholder="Ex: Tucurui" style={inp2} />
            </div>
          )}

          {destino === "usuario" && (
            <div>
              <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>USER ID</label>
              <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="UUID do usuario" style={inp2} />
            </div>
          )}

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>TITULO *</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Nova corrida disponivel!" style={inp2} />
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>MENSAGEM</label>
            <textarea value={corpo} onChange={e => setCorpo(e.target.value)} rows={3} placeholder="Detalhes da mensagem..." style={{ ...inp2, resize: "none" }} />
          </div>

          <div>
            <label className="text-xs font-black mb-1.5 block" style={{ color: "#8B949E", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>LINK (opcional)</label>
            <input value={link} onChange={e => setLink(e.target.value)} placeholder="Ex: /eventos?estado=PA" style={inp2} />
          </div>

          {erro && <p className="text-xs font-black" style={{ color: "#FF6B00" }}>{erro}</p>}
          {resultado && (
            <div className="rounded-xl p-3 text-center" style={{ background: "rgba(92,200,0,0.1)", border: "1px solid rgba(92,200,0,0.3)" }}>
              <p className="font-black" style={{ color: "#5CC800", fontFamily: "'Barlow Condensed', sans-serif" }}>
                Mensagem enviada para {resultado.enviadas} usuario(s)!
              </p>
            </div>
          )}

          <button onClick={enviar} disabled={enviando || !titulo.trim()}
            className="w-full rounded-xl py-3 font-black text-sm transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #5CC800, #4aaa00)", color: "#fff", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
            {enviando ? "ENVIANDO..." : "ENVIAR NOTIFICACAO"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AbaSync({ eventosAtuais, onImportar }: { eventosAtuais: Evento[]; onImportar: () => Promise<void> }): React.JSX.Element {
  const [estadosSel, setEstadosSel] = useState<string[]>(["PA"]);
  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [preview, setPreview] = useState<EventoPreview[]>([]);
  const [resultado, setResultado] = useState<{ importados: number; ignorados: number; erros?: string[] } | null>(null);
  const [ultimaBusca, setUltimaBusca] = useState<string | null>(null);

  const chavesExistentes = new Set(
    eventosAtuais.map((ev) =>
      chaveEventoLocal({ nome: ev.nome || "", cidade: ev.cidade || "", estado: ev.estado || "", data_evento: ev.data_evento || "" })
    )
  );

  function toggleEstado(uf: string) {
    setEstadosSel((prev) => (prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]));
  }

  function selecionarTodosNovos() {
    setPreview((prev) => prev.map((ev) => ({ ...ev, selecionado: !ev.jaExiste })));
  }

  function limparSelecao() {
    setPreview((prev) => prev.map((ev) => ({ ...ev, selecionado: false })));
  }

  async function buscarParaConferencia(todos = false) {
    setCarregando(true);
    setResultado(null);
    setPreview([]);

    try {
      const estados = todos ? estadosBR : estadosSel;
      const encontrados: EventoPreview[] = [];
      const erros: string[] = [];

      for (const uf of estados) {
        const res = await fetch(`/api/sync-corridasbr?estado=${uf}`, { method: "GET", credentials: "include" });
        if (!res.ok) {
          erros.push(`${uf}: erro ${res.status}`);
          continue;
        }

        const data = (await res.json()) as { eventos?: EventoPreview[]; error?: string };
        if (data.error) {
          erros.push(`${uf}: ${data.error}`);
          continue;
        }

        for (const ev of data.eventos || []) {
          const chave = chaveEventoLocal({
            nome: ev.nome || "",
            cidade: ev.cidade || "",
            estado: ev.estado || uf,
            data_evento: ev.data_evento || "",
          });
          const jaExiste = chavesExistentes.has(chave);

          encontrados.push({
            nome: ev.nome,
            cidade: ev.cidade,
            estado: ev.estado || uf,
            data_evento: ev.data_evento,
            distancia: ev.distancia || null,
            local: ev.local || null,
            link_inscricao: ev.link_inscricao || null,
            jaExiste,
            selecionado: !jaExiste,
          });
        }
      }

      const vistas = new Set<string>();
      const semDuplicar = encontrados.filter((ev) => {
        const chave = chaveEventoLocal({ nome: ev.nome, cidade: ev.cidade, estado: ev.estado, data_evento: ev.data_evento });
        if (vistas.has(chave)) return false;
        vistas.add(chave);
        return true;
      });

      setPreview(semDuplicar);
      setResultado({ importados: 0, ignorados: semDuplicar.filter((ev) => ev.jaExiste).length, erros: erros.length ? erros : undefined });
      setUltimaBusca(new Date().toLocaleString("pt-BR"));
    } catch {
      setResultado({ importados: 0, ignorados: 0, erros: ["Erro de conexão ao buscar eventos."] });
    }

    setCarregando(false);
  }

  async function confirmarImportacao() {
    const selecionados = preview.filter((ev) => ev.selecionado && !ev.jaExiste);

    if (selecionados.length === 0) {
      setResultado({ importados: 0, ignorados: preview.filter((ev) => ev.jaExiste).length, erros: ["Nenhum evento novo selecionado para importar."] });
      return;
    }

    setConfirmando(true);
    let importados = 0;
    const erros: string[] = [];

    // Enviar tudo de uma vez para a API server-side (tem sessao autenticada, bypassa RLS)
    const res = await fetch("/api/admin/eventos/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        eventos: selecionados.map((ev) => ({
          nome: ev.nome,
          cidade: ev.cidade,
          estado: ev.estado,
          data_evento: ev.data_evento,
          distancia: ev.distancia || null,
          local: ev.local || null,
          link_inscricao: ev.link_inscricao || null,
          destaque: false,
        })),
      }),
    });

    const data = await res.json().catch(() => ({ error: "Resposta invalida do servidor" }));

    if (!res.ok || !data?.success) {
      const msg = `[HTTP ${res.status}] ${data?.error || "erro desconhecido"} | detalhes: ${JSON.stringify(data?.details || data || "")} `;
      console.error("[confirmarImportacao]", msg);
      erros.push(msg);
    } else {
      importados = data.importados ?? selecionados.length;
    }


    setResultado({ importados, ignorados: preview.filter((ev) => ev.jaExiste).length, erros: erros.length ? erros : undefined });
    setPreview((prev) => prev.map((ev) => (ev.selecionado && !ev.jaExiste ? { ...ev, jaExiste: true, selecionado: false } : ev)));
    await onImportar();
    setConfirmando(false);
  }

  const lbl = { display:"block", fontSize:"11px", fontWeight:700, color:"#8B949E", marginBottom:"6px", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.1em" } as React.CSSProperties;
  const novos = preview.filter((ev) => !ev.jaExiste);
  const selecionados = preview.filter((ev) => ev.selecionado && !ev.jaExiste);
  const repetidos = preview.filter((ev) => ev.jaExiste);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl p-5" style={{ background:"linear-gradient(135deg,#161B22,#1a2030)", border:"1px solid rgba(92,200,0,0.2)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-black text-xl mb-1" style={{ fontFamily:"'Barlow Condensed', sans-serif", color:"#E6EDF3", letterSpacing:"0.03em" }}>🔎 CONFERIR EVENTOS ANTES DE IMPORTAR</h2>
            <p className="text-sm" style={{ color:"#8B949E" }}>Busque eventos do <span style={{ color:"#5CC800" }}>corridasbr.com.br</span>, confira a lista e importe somente os eventos aprovados por você.</p>
            {ultimaBusca && <p className="text-xs mt-2" style={{ color:"rgba(92,200,0,0.6)" }}>✓ Última busca: {ultimaBusca}</p>}
          </div>
          <div className="shrink-0 rounded-xl px-3 py-2 text-xs font-black text-center" style={{ background:"rgba(255,184,0,0.08)", border:"1px solid rgba(255,184,0,0.18)", color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif" }}>
            <p>IMPORTAÇÃO</p><p style={{ color:"#8B949E", fontWeight:400 }}>com aprovação</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.12)" }}>
        <label style={lbl}>📍 SELECIONAR ESTADOS</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {estadosBR.map((uf) => (
            <button key={uf} type="button" onClick={() => toggleEstado(uf)} className="rounded-lg px-3 py-1.5 text-xs font-black transition-all" style={{ background: estadosSel.includes(uf) ? "rgba(92,200,0,0.2)" : "#21262D", color: estadosSel.includes(uf) ? "#5CC800" : "#8B949E", border: estadosSel.includes(uf) ? "1px solid rgba(92,200,0,0.4)" : "1px solid transparent", fontFamily:"'Barlow Condensed', sans-serif" }}>{uf}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setEstadosSel(estadosBR)} className="rounded-lg px-3 py-1.5 text-xs font-black" style={{ background:"rgba(255,184,0,0.1)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.2)", fontFamily:"'Barlow Condensed', sans-serif" }}>TODOS</button>
          <button type="button" onClick={() => setEstadosSel([])} className="rounded-lg px-3 py-1.5 text-xs font-black" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>LIMPAR</button>
          <span className="ml-auto text-xs self-center" style={{ color:"#8B949E" }}>{estadosSel.length} estado{estadosSel.length !== 1 ? "s" : ""} selecionado{estadosSel.length !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => buscarParaConferencia(false)} disabled={carregando || estadosSel.length === 0 || confirmando} className="rounded-2xl py-5 font-black text-base transition-all hover:brightness-110 disabled:opacity-50" style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
          {carregando ? <span className="flex items-center justify-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />BUSCANDO...</span> : <span>🔎 BUSCAR PARA CONFERIR<br /><span className="text-xs font-normal opacity-70">{estadosSel.join(", ") || "nenhum"}</span></span>}
        </button>
        <button type="button" onClick={() => buscarParaConferencia(true)} disabled={carregando || confirmando} className="rounded-2xl py-5 font-black text-base transition-all hover:brightness-110 disabled:opacity-50" style={{ background:"linear-gradient(135deg,#FF6B00,#cc5500)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
          {carregando ? "..." : <span>🌎 BUSCAR BRASIL COMPLETO<br /><span className="text-xs font-normal opacity-70">Apenas para conferência</span></span>}
        </button>
      </div>

      {preview.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background:"#161B22", border:"1px solid rgba(92,200,0,0.12)" }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="font-black text-lg" style={{ color:"#E6EDF3", fontFamily:"'Barlow Condensed', sans-serif" }}>📋 EVENTOS ENCONTRADOS PARA CONFERÊNCIA</h3>
              <p className="text-xs" style={{ color:"#8B949E" }}>{preview.length} encontrados · {novos.length} novos · {repetidos.length} já existentes · {selecionados.length} selecionados para importar</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={selecionarTodosNovos} className="rounded-lg px-3 py-2 text-xs font-black" style={{ background:"rgba(92,200,0,0.12)", color:"#5CC800", border:"1px solid rgba(92,200,0,0.25)", fontFamily:"'Barlow Condensed', sans-serif" }}>SELECIONAR NOVOS</button>
              <button type="button" onClick={limparSelecao} className="rounded-lg px-3 py-2 text-xs font-black" style={{ background:"rgba(255,255,255,0.05)", color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>LIMPAR SELEÇÃO</button>
            </div>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {preview.map((ev, index) => (
              <div key={`${ev.estado}-${ev.data_evento}-${ev.nome}-${index}`} className="rounded-2xl p-4" style={{ background: ev.jaExiste ? "rgba(255,255,255,0.035)" : ev.selecionado ? "rgba(92,200,0,0.08)" : "#21262D", border: ev.jaExiste ? "1px solid rgba(255,255,255,0.06)" : ev.selecionado ? "1px solid rgba(92,200,0,0.35)" : "1px solid rgba(255,255,255,0.08)", opacity: ev.jaExiste ? 0.55 : 1 }}>
                <div className="flex gap-3">
                  <input type="checkbox" checked={!!ev.selecionado} disabled={ev.jaExiste} onChange={() => setPreview((prev) => prev.map((item, i) => i === index ? { ...item, selecionado: !item.selecionado } : item))} className="mt-1 h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-black text-base" style={{ color:"#E6EDF3", fontFamily:"'Barlow Condensed', sans-serif" }}>{ev.nome}</h4>
                      {ev.jaExiste ? <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ background:"rgba(255,184,0,0.12)", color:"#FFB800" }}>JÁ EXISTE</span> : <span className="rounded-full px-2 py-1 text-[10px] font-black" style={{ background:"rgba(92,200,0,0.15)", color:"#5CC800" }}>NOVO</span>}
                    </div>
                    <p className="text-xs" style={{ color:"#8B949E" }}>📍 {ev.cidade} — {ev.estado} · 📅 {fmtData(ev.data_evento)}{ev.distancia ? ` · 📏 ${ev.distancia}` : ""}</p>
                    {ev.link_inscricao && <a href={ev.link_inscricao} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline" style={{ color:"#5CC800" }}>🔗 Ver página de inscrição</a>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={confirmarImportacao} disabled={confirmando || selecionados.length === 0} className="mt-5 w-full rounded-2xl py-4 font-black text-base transition-all hover:brightness-110 disabled:opacity-50" style={{ background:"linear-gradient(135deg,#5CC800,#4aaa00)", color:"#fff", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>
            {confirmando ? <span className="flex items-center justify-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />IMPORTANDO EVENTOS SELECIONADOS...</span> : `✅ CONFIRMAR IMPORTAÇÃO DE ${selecionados.length} EVENTO${selecionados.length !== 1 ? "S" : ""}`}
          </button>
        </div>
      )}

      {resultado && (
        <div className="rounded-2xl p-5 animate-slide-up" style={{ background: resultado.erros ? "rgba(255,107,0,0.08)" : "rgba(92,200,0,0.08)", border: resultado.erros ? "1px solid rgba(255,107,0,0.2)" : "1px solid rgba(92,200,0,0.2)" }}>
          <p className="font-black text-lg mb-3" style={{ color: resultado.importados > 0 ? "#5CC800" : "#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>{resultado.importados > 0 ? `✅ ${resultado.importados} EVENTOS IMPORTADOS!` : "ℹ️ BUSCA REALIZADA"}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-xl p-3 text-center" style={{ background:"rgba(92,200,0,0.1)" }}><p className="text-2xl font-black" style={{ color:"#5CC800", fontFamily:"'Barlow Condensed', sans-serif" }}>{resultado.importados}</p><p className="text-xs" style={{ color:"#8B949E" }}>IMPORTADOS</p></div>
            <div className="rounded-xl p-3 text-center" style={{ background:"rgba(255,255,255,0.04)" }}><p className="text-2xl font-black" style={{ color:"#8B949E", fontFamily:"'Barlow Condensed', sans-serif" }}>{resultado.ignorados}</p><p className="text-xs" style={{ color:"#8B949E" }}>JÁ EXISTIAM</p></div>
          </div>
          {resultado.erros && resultado.erros.length > 0 && <div className="rounded-xl p-3" style={{ background:"rgba(255,107,0,0.1)" }}><p className="text-xs font-black mb-1" style={{ color:"#FF6B00", fontFamily:"'Barlow Condensed', sans-serif" }}>AVISOS:</p>{resultado.erros.map((e, i) => <p key={i} className="text-xs" style={{ color:"#FF6B00" }}>{e}</p>)}</div>}
        </div>
      )}

      <div className="rounded-2xl p-5" style={{ background:"#161B22", border:"1px solid rgba(255,184,0,0.1)" }}>
        <p className="font-black text-sm mb-3" style={{ color:"#FFB800", fontFamily:"'Barlow Condensed', sans-serif", letterSpacing:"0.05em" }}>💡 COMO FUNCIONA AGORA</p>
        <div className="space-y-2 text-xs" style={{ color:"#8B949E" }}>
          <p>• <strong style={{ color:"#E6EDF3" }}>Buscar:</strong> primeiro o sistema apenas procura os eventos e mostra nesta tela.</p>
          <p>• <strong style={{ color:"#E6EDF3" }}>Conferir:</strong> você vê nome, cidade, data, distância e link antes de importar.</p>
          <p>• <strong style={{ color:"#E6EDF3" }}>Confirmar:</strong> somente os eventos marcados entram oficialmente na aba Eventos.</p>
          <p>• <strong style={{ color:"#E6EDF3" }}>Duplicados:</strong> eventos que já existem aparecem como “JÁ EXISTE” e não podem ser marcados.</p>
        </div>
      </div>
    </div>
  );
}
