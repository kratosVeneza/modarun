# Correção final: Seguir persistente + Chat

## O que foi corrigido

### 1. Seguir/Deixar de seguir

Arquivos alterados:

- `app/api/feed/follows/route.ts`
- `app/api/usuarios/route.ts`
- `app/perfil/[id]/page.tsx`
- `app/page.tsx`

A API de seguir agora:

- identifica o usuário logado pela sessão;
- usa `SUPABASE_SERVICE_ROLE_KEY` quando disponível para gravar no banco sem depender de RLS incorreta;
- grava com `insert` e trata duplicidade;
- depois consulta novamente o banco para confirmar se o follow realmente persistiu;
- devolve `viewer_segue` já confirmado;
- desativa cache nas respostas.

A página de perfil público agora, após clicar em seguir/desseguir, faz uma leitura extra em `/api/feed/follows?user_id=...` para evitar que o botão mude apenas visualmente.

### 2. Chat

Arquivo alterado:

- `app/chat/page.tsx`
- `app/api/mensagens/route.ts`

A conversa já possui:

- apagar só para mim;
- apagar para todos, se a mensagem foi enviada pelo usuário logado;
- clique na foto/nome do usuário no topo da conversa para abrir `/perfil/[id]`.

## SQL recomendado para garantir a tabela follows

Rode no Supabase uma vez:

```sql
create table if not exists follows (
  id bigserial primary key,
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_no_self_follow check (follower_id <> following_id)
);

create unique index if not exists follows_follower_following_unique
on follows(follower_id, following_id);

create index if not exists follows_follower_id_idx
on follows(follower_id);

create index if not exists follows_following_id_idx
on follows(following_id);

alter table follows enable row level security;

drop policy if exists "follows_select_public" on follows;
create policy "follows_select_public"
on follows for select
to authenticated
using (true);

drop policy if exists "follows_insert_own" on follows;
create policy "follows_insert_own"
on follows for insert
to authenticated
with check (auth.uid() = follower_id and auth.uid() <> following_id);

drop policy if exists "follows_delete_own" on follows;
create policy "follows_delete_own"
on follows for delete
to authenticated
using (auth.uid() = follower_id);
```

## Teste

1. Faça login com usuário A.
2. Abra o perfil público do usuário B.
3. Clique em seguir.
4. Atualize a página.
5. O botão deve continuar como `Seguindo`.
6. Abra `/chat`, converse com outro usuário e teste apagar mensagem.
7. Clique no nome/foto no topo da conversa para abrir o perfil.
