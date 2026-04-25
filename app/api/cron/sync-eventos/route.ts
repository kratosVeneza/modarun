import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://modarun.com.br";
  let totalImportados = 0;
  let totalIgnorados = 0;
  const erros: string[] = [];

  for (let i = 0; i < ESTADOS.length; i += 5) {
    const lote = ESTADOS.slice(i, i + 5);

    await Promise.all(lote.map(async (uf) => {
      try {
        const res = await fetch(`${baseUrl}/api/admin/sync-corridasbr`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-cron-key": process.env.CRON_SECRET || "",
          },
          body: JSON.stringify({ estado: uf }),
        });
        if (res.ok) {
          const data = await res.json() as { importados?: number; ignorados?: number; erros?: string[] };
          totalImportados += data.importados || 0;
          totalIgnorados += data.ignorados || 0;
          if (data.erros) erros.push(...data.erros);
        } else {
          erros.push(`${uf}: erro ${res.status}`);
        }
      } catch (err) {
        erros.push(`${uf}: ${String(err)}`);
      }
    }));

    if (i + 5 < ESTADOS.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return NextResponse.json({
    success: true,
    totalImportados,
    totalIgnorados,
    erros: erros.length > 0 ? erros : undefined,
    executadoEm: new Date().toISOString(),
  });
}
