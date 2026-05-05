# Moda Run — Moderação, Bloqueio e Exclusão de Conta

Esta atualização adiciona a etapa 1 de segurança/moderação sem alterar o restante do app.

## O que foi adicionado

- Denunciar publicação no feed.
- Denunciar comentário no feed.
- Denunciar perfil público.
- Bloquear/desbloquear usuário no perfil público.
- Bloqueio impede envio de mensagem privada entre os usuários bloqueados.
- Aba **Moderação** no painel Admin para analisar denúncias.
- Admin pode marcar denúncia como resolvida, ignorar ou remover conteúdo denunciado.
- Botão funcional no perfil próprio para o usuário excluir a conta.

## SQL necessário no Supabase

Rode uma vez no SQL Editor:

```sql
create table if not exists denuncias (
  id bigserial primary key,
  denunciante_id uuid references auth.users(id) on delete set null,
  denunciante_email text,
  tipo text not null check (tipo in ('post', 'comentario', 'usuario', 'mensagem')),
  alvo_id text not null,
  alvo_user_id uuid references auth.users(id) on delete set null,
  post_id bigint,
  comentario_id bigint,
  motivo text,
  detalhes text,
  status text not null default 'pendente' check (status in ('pendente', 'resolvida', 'ignorada')),
  acao_tomada text,
  resolvida_por uuid references auth.users(id) on delete set null,
  resolvida_em timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists denuncias_status_created_idx on denuncias(status, created_at desc);
create unique index if not exists denuncias_unica_por_usuario_alvo_idx on denuncias(denunciante_id, tipo, alvo_id);

alter table denuncias enable row level security;

drop policy if exists "denuncias_insert_authenticated" on denuncias;
create policy "denuncias_insert_authenticated"
on denuncias for insert
to authenticated
with check (auth.uid() = denunciante_id);

-- A leitura/admin é feita pela API usando SUPABASE_SERVICE_ROLE_KEY.

create table if not exists user_blocks (
  id bigserial primary key,
  bloqueador_id uuid not null references auth.users(id) on delete cascade,
  bloqueado_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_blocks_no_self check (bloqueador_id <> bloqueado_id)
);

create unique index if not exists user_blocks_unique_idx on user_blocks(bloqueador_id, bloqueado_id);
create index if not exists user_blocks_bloqueador_idx on user_blocks(bloqueador_id);
create index if not exists user_blocks_bloqueado_idx on user_blocks(bloqueado_id);

alter table user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on user_blocks;
create policy "user_blocks_select_own"
on user_blocks for select
to authenticated
using (auth.uid() = bloqueador_id or auth.uid() = bloqueado_id);

drop policy if exists "user_blocks_insert_own" on user_blocks;
create policy "user_blocks_insert_own"
on user_blocks for insert
to authenticated
with check (auth.uid() = bloqueador_id and auth.uid() <> bloqueado_id);

drop policy if exists "user_blocks_delete_own" on user_blocks;
create policy "user_blocks_delete_own"
on user_blocks for delete
to authenticated
using (auth.uid() = bloqueador_id);
```

## Variável necessária

Para a exclusão completa da conta e para a moderação funcionar com segurança, confirme na Vercel:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

Ela deve estar disponível em **Production**.

## Observação sobre exclusão de conta

A exclusão remove dados sociais do app e exclui o usuário do Supabase Auth. Por segurança, o usuário precisa digitar `EXCLUIR` para confirmar.
