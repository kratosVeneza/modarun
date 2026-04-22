import React from "react";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import { getAdminStatus } from "@/utils/supabase/isAdmin";
import EventosClient from "@/components/EventosClient";

type SearchParams = Promise<{ cidade?: string; estado?: string }>;

export default async function EventosPage({ searchParams }: { searchParams: SearchParams }): Promise<React.JSX.Element> {
  const { user, isAdmin } = await getAdminStatus();
  const params = await searchParams;
  const cidadeFiltro = params.cidade?.trim() || "";
  const estadoFiltro = params.estado?.trim() || "";

  let query = supabase.from("eventos").select("*").order("data_evento", { ascending: true });
  if (cidadeFiltro) query = query.ilike("cidade", `%${cidadeFiltro}%`);
  if (estadoFiltro) query = query.ilike("estado", `%${estadoFiltro}%`);
  const { data, error } = await query;

  return (
    <>
      <Header userEmail={user?.email} isAdmin={isAdmin} />
      <EventosClient
        eventos={data || []}
        error={error?.message}
        cidadeFiltro={cidadeFiltro}
        estadoFiltro={estadoFiltro}
      />
    </>
  );
}
