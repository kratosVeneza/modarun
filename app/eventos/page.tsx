import { supabase } from "@/lib/supabase";

export default async function EventosPage() {
  const { data, error } = await supabase
    .from("eventos")
    .select("*");

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <h1>Erro</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Eventos (Banco de Dados)</h1>

      {data?.map((evento) => (
        <div key={evento.id} style={{ marginBottom: "16px", border: "1px solid #ccc", padding: "12px" }}>
          <h2>{evento.nome}</h2>
          <p>{evento.cidade} - {evento.estado}</p>
          <p>{evento.data_evento}</p>
          <p>{evento.distancia}</p>
        </div>
      ))}
    </div>
  );
}