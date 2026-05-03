# Correção do feed — curtidas e comentários

Esta versão melhora a experiência social do feed no estilo Instagram/Facebook.

## O que foi corrigido

- O feed agora mostra sempre a quantidade de comentários: `0 comentários`, `1 comentário`, `2 comentários` etc.
- Ao comentar uma publicação, o contador de comentários atualiza na hora.
- Ao excluir comentário principal, o contador reduz na hora.
- O feed recalcula curtidas e comentários na API, evitando depender de valores antigos da view.
- A publicação agora mostra um resumo de curtidas acima dos botões.
- Ao clicar no resumo de curtidas, abre uma lista com os usuários que curtiram.
- A lista de curtidas permite clicar no usuário e abrir o perfil dele.

## Arquivos alterados

- `app/page.tsx`
- `app/api/feed/posts/route.ts`
- `app/api/feed/curtir/route.ts`

## SQL recomendado

Rode uma vez no Supabase para evitar curtidas duplicadas:

```sql
create unique index if not exists feed_curtidas_post_user_unique
on feed_curtidas(post_id, user_id);

create unique index if not exists feed_comentario_curtidas_unique
on feed_comentario_curtidas(comentario_id, user_id);
```

Se a tabela `feed_curtidas` ainda não existir, crie com:

```sql
create table if not exists feed_curtidas (
  id bigserial primary key,
  post_id bigint not null references feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists feed_curtidas_post_user_unique
on feed_curtidas(post_id, user_id);
```

Para exibir nomes reais na lista de curtidas, mantenha a variável `SUPABASE_SERVICE_ROLE_KEY` configurada na Vercel.
