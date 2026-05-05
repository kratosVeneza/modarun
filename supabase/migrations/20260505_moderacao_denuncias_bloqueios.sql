-- Moda Run: denúncias, bloqueios e exclusão de conta
-- Execute no SQL Editor do Supabase se as tabelas ainda não existirem.

create table if not exists public.denuncias (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  denunciante_id uuid not null,
  denunciante_email text,
  tipo text not null check (tipo in ('post','comentario','usuario','mensagem')),
  alvo_id text not null,
  alvo_user_id uuid,
  post_id bigint,
  comentario_id bigint,
  motivo text not null default 'outro',
  detalhes text,
  status text not null default 'pendente' check (status in ('pendente','resolvida','ignorada')),
  resolvida_em timestamptz,
  resolvida_por uuid,
  acao_tomada text,
  unique (denunciante_id, tipo, alvo_id)
);

create index if not exists idx_denuncias_status_created_at on public.denuncias(status, created_at desc);
create index if not exists idx_denuncias_alvo_user_id on public.denuncias(alvo_user_id);
create index if not exists idx_denuncias_post_id on public.denuncias(post_id);
create index if not exists idx_denuncias_comentario_id on public.denuncias(comentario_id);

create table if not exists public.user_blocks (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  bloqueador_id uuid not null,
  bloqueado_id uuid not null,
  unique (bloqueador_id, bloqueado_id),
  check (bloqueador_id <> bloqueado_id)
);

create index if not exists idx_user_blocks_bloqueador on public.user_blocks(bloqueador_id);
create index if not exists idx_user_blocks_bloqueado on public.user_blocks(bloqueado_id);

alter table public.denuncias enable row level security;
alter table public.user_blocks enable row level security;

-- Denúncias: usuários logados criam e veem apenas as próprias; admin/service role gerencia via API.
do $$ begin
  create policy "denuncias_insert_authenticated" on public.denuncias
    for insert to authenticated
    with check (auth.uid() = denunciante_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "denuncias_select_own" on public.denuncias
    for select to authenticated
    using (auth.uid() = denunciante_id);
exception when duplicate_object then null; end $$;

-- Bloqueios: cada usuário gerencia a própria lista de bloqueados.
do $$ begin
  create policy "user_blocks_select_own" on public.user_blocks
    for select to authenticated
    using (auth.uid() = bloqueador_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_blocks_insert_own" on public.user_blocks
    for insert to authenticated
    with check (auth.uid() = bloqueador_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_blocks_delete_own" on public.user_blocks
    for delete to authenticated
    using (auth.uid() = bloqueador_id);
exception when duplicate_object then null; end $$;
