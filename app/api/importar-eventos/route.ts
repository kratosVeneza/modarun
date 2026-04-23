import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

function parseData(raw: string): string | null {
  if (!raw?.trim()) return null;
  const s = raw.trim();

  // YYYY-MM-DD — já está correto
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // DD/MM/YYYY ou DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2,"0")}-${m1[1].padStart(2,"0")}`;

  // DD/MM/YY
  const m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m2) return `20${m2[3]}-${m2[2].padStart(2,"0")}-${m2[1].padStart(2,"0")}`;

  // DD.MM.YYYY
  const m3 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m3) return `${m3[3]}-${m3[2].padStart(2,"0")}-${m3[1].padStart(2,"0")}`;

  // DD.MM.YY
  const m4 = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})$/);
  if (m4) return `20${m4[3]}-${m4[2].padStart(2,"0")}-${m4[1].padStart(2,"0")}`;

  // DD.MM ou DD/MM — sem ano, assume ano atual ou próximo
  const m5 = s.match(/^(\d{1,2})[\.\/](\d{1,2})$/);
  if (m5) {
    const dia = parseInt(m5[1]);
    const mes = parseInt(m5[2]);
    const hoje = new Date();
    const ano = hoje.getFullYear();
    // Se a data já passou este ano, assume próximo ano
    const dataTest = new Date(ano, mes - 1, dia);
    const anoFinal = dataTest < hoje ? ano + 1 : ano;
    return `${anoFinal}-${String(mes).padStart(2,"0")}-${String(dia).padStart(2,"0")}`;
  }

  // MM/YYYY ou MM/YY
  const m6 = s.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
  if (m6 && parseInt(m6[1]) <= 12) {
    const ano = m6[2].length === 2 ? `20${m6[2]}` : m6[2];
    return `${ano}-${m6[1].padStart(2,"0")}-01`;
  }

  return null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if ((char === "," || char === ";") && !inQuotes) { result.push(current); current = ""; }
    else { current += char; }
  }
  result.push(current);
  return result.map(c => c.trim());
}

const MESES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function isLinhaLixo(cols: string[]): boolean {
  const joined = cols.join("").trim();
  if (!joined) return true;
  if (cols.some(c => c.includes("adsbygoogle") || c.includes("googlesyndication") || c.includes("doubleclick"))) return true;
  // Skip month-only lines
  if (MESES.includes(joined.toLowerCase())) return true;
  // Skip repeated header rows (contain "data" + "cidade" or "nome")
  const lower = joined.toLowerCase();
  if (lower.includes("data") && (lower.includes("cidade") || lower.includes("nome"))) return true;
  return false;
}

function detectarOffsetColunas(linhas: string[][]): number {
  // Detecta quantas colunas de lixo existem antes dos dados reais
  // Procura a primeira coluna que tem padrão de data (DD.MM ou DD/MM)
  for (let offset = 0; offset < 5; offset++) {
    let dateCount = 0;
    for (const cols of linhas.slice(0, 10)) {
      const val = cols[offset]?.trim() || "";
      if (/^\d{1,2}[.\/\-]\d{1,2}/.test(val)) dateCount++;
    }
    if (dateCount >= 2) return offset;
  }
  return 0;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    const { data: adminRow } = await supabase.from("admins").select("email").eq("email", user.email?.toLowerCase() ?? "").single();
    if (!adminRow) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { csv, mapeamento, estado_padrao } = await request.json() as {
      csv: string;
      estado_padrao?: string;
      mapeamento: { nome: number; cidade: number; estado: number; data: number; distancia?: number; local?: number; link?: number; destaque?: number };
    };

    if (!csv?.trim()) return NextResponse.json({ error: "CSV vazio." }, { status: 400 });

    const linhas = csv.trim().split("\n");
    if (linhas.length < 2) return NextResponse.json({ error: "CSV sem dados." }, { status: 400 });

    // Parse all lines first
    const todasLinhas = linhas.map(l => parseCsvLine(l));

    // Detect column offset (for CSVs with leading garbage columns)
    const dataOffset = detectarOffsetColunas(todasLinhas.slice(1));
    
    // Adjust mapeamento by offset if needed
    const ajustarIdx = (idx: number) => idx >= 0 ? idx + dataOffset : idx;
    const mapAjustado = {
      nome: ajustarIdx(mapeamento.nome),
      cidade: ajustarIdx(mapeamento.cidade),
      estado: ajustarIdx(mapeamento.estado),
      data: ajustarIdx(mapeamento.data),
      distancia: ajustarIdx(mapeamento.distancia ?? -1),
      local: ajustarIdx(mapeamento.local ?? -1),
      link: ajustarIdx(mapeamento.link ?? -1),
      destaque: ajustarIdx(mapeamento.destaque ?? -1),
    };

    const eventos = [];
    const erros: string[] = [];
    const get = (cols: string[], idx?: number) => idx !== undefined && idx >= 0 ? cols[idx]?.trim() || "" : "";

    for (let i = 1; i < todasLinhas.length; i++) {
      const cols = todasLinhas[i];
      if (cols.length < 2) continue;
      if (isLinhaLixo(cols)) continue; // Skip ad/garbage lines

      const nome = get(cols, mapAjustado.nome);
      const cidade = get(cols, mapAjustado.cidade);
      const estado = get(cols, mapAjustado.estado);
      const data_raw = get(cols, mapAjustado.data);

      if (!nome) { erros.push(`Linha ${i+1}: nome vazio`); continue; }
      if (!cidade) { erros.push(`Linha ${i+1}: cidade vazia`); continue; }

      const data_evento = parseData(data_raw);
      if (!data_evento) { erros.push(`Linha ${i+1}: data inválida "${data_raw}"`); continue; }

      eventos.push({
        nome,
        cidade,
        estado: estado ? estado.toUpperCase().slice(0, 2) : (estado_padrao || "BR"),
        data_evento,
        distancia: get(cols, mapAjustado.distancia) || null,
        local: get(cols, mapAjustado.local) || null,
        link_inscricao: get(cols, mapAjustado.link) || null,
        destaque: get(cols, mapAjustado.destaque)?.toLowerCase() === "sim",
      });
    }

    if (eventos.length === 0) return NextResponse.json({ error: "Nenhum evento válido encontrado.", detalhes: erros }, { status: 400 });

    let inseridos = 0, atualizados = 0;
    for (const ev of eventos) {
      const { data: existing } = await supabase.from("eventos").select("id").eq("nome", ev.nome).eq("data_evento", ev.data_evento).single();
      if (existing) { await supabase.from("eventos").update(ev).eq("id", existing.id); atualizados++; }
      else { await supabase.from("eventos").insert([ev]); inseridos++; }
    }

    return NextResponse.json({ success: true, inseridos, atualizados, erros, total: eventos.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
