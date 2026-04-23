import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Lê uma planilha Google Sheets pública e sincroniza com a tabela eventos
// A planilha deve ter as colunas na ordem:
// nome | cidade | estado | data_evento (DD/MM/AAAA) | distancia | local | link_inscricao | destaque (sim/nao)

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const { data: adminRow } = await supabase.from("admins")
      .select("email").eq("email", user.email?.toLowerCase() ?? "").single();
    if (!adminRow) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

    const { sheet_id } = await request.json() as { sheet_id: string };
    if (!sheet_id) return NextResponse.json({ error: "ID da planilha não informado." }, { status: 400 });

    // URL para exportar a planilha como CSV
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheet_id}/export?format=csv&gid=0`;

    const res = await fetch(csvUrl, { headers: { "Accept": "text/csv" } });
    if (!res.ok) return NextResponse.json({ error: "Não foi possível acessar a planilha. Verifique se ela está pública." }, { status: 400 });

    const csv = await res.text();
    const linhas = csv.trim().split("\n");

    if (linhas.length < 2) return NextResponse.json({ error: "Planilha vazia ou sem dados." }, { status: 400 });

    // Skip header (first line)
    const eventos = [];
    const erros = [];

    for (let i = 1; i < linhas.length; i++) {
      // Handle CSV with possible quoted fields
      const cols = parseCsvLine(linhas[i]);
      if (cols.length < 3) continue;

      const [nome, cidade, estado, data_raw, distancia, local, link_inscricao, destaque_raw] = cols.map(c => c.trim());

      if (!nome || !cidade || !estado) {
        erros.push(`Linha ${i + 1}: nome, cidade ou estado vazio`);
        continue;
      }

      // Convert date DD/MM/AAAA to YYYY-MM-DD
      let data_evento = data_raw || "";
      if (data_raw && data_raw.includes("/")) {
        const parts = data_raw.split("/");
        if (parts.length === 3) {
          data_evento = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }

      if (!data_evento) {
        erros.push(`Linha ${i + 1}: data inválida`);
        continue;
      }

      eventos.push({
        nome, cidade, estado: estado.toUpperCase().slice(0, 2),
        data_evento,
        distancia: distancia || null,
        local: local || null,
        link_inscricao: link_inscricao || null,
        destaque: destaque_raw?.toLowerCase() === "sim",
      });
    }

    if (eventos.length === 0) {
      return NextResponse.json({ error: "Nenhum evento válido encontrado.", detalhes: erros }, { status: 400 });
    }

    // Upsert events (insert or update based on nome+data_evento)
    let inseridos = 0;
    let atualizados = 0;

    for (const ev of eventos) {
      // Check if already exists
      const { data: existing } = await supabase.from("eventos")
        .select("id").eq("nome", ev.nome).eq("data_evento", ev.data_evento).single();

      if (existing) {
        await supabase.from("eventos").update(ev).eq("id", existing.id);
        atualizados++;
      } else {
        await supabase.from("eventos").insert([ev]);
        inseridos++;
      }
    }

    return NextResponse.json({
      success: true,
      inseridos,
      atualizados,
      erros,
      total: eventos.length,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
