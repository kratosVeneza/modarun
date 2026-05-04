# Correção final — notificações de menção e curtida em comentários

Esta correção atua apenas na rota de comentários do feed:

- `app/api/feed/comentarios/route.ts`

## O que foi corrigido

1. Menções com `@`:
   - Quando o usuário é escolhido na lista de sugestões, a API passa a confiar no `user_id` real enviado pelo frontend.
   - Isso evita falhas por causa de acento, espaço, ponto, sobrenome ou diferenças no handle.

2. Curtida em comentário:
   - A curtida agora valida erro de gravação na tabela `feed_comentario_curtidas`.
   - A notificação só é enviada quando é uma curtida nova, evitando duplicações.

3. Compatibilidade com o banco atual:
   - Se a tabela `notificacoes` tiver restrição/enum/check que ainda não aceite os tipos novos `mencao_comentario` e `curtida_comentario`, a API tenta gravar a notificação usando tipos já compatíveis:
     - `mencao_comentario` → fallback para `comentario_post`
     - `curtida_comentario` → fallback para `curtida_post`
   - O título e o corpo da notificação continuam dizendo que foi menção ou curtida no comentário.

## SQL recomendado

Rode no Supabase para garantir que a tabela de curtidas de comentários está correta:

```sql
create table if not exists feed_comentario_curtidas (
  comentario_id bigint not null references feed_comentarios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comentario_id, user_id)
);

create unique index if not exists feed_comentario_curtidas_unique
on feed_comentario_curtidas(comentario_id, user_id);
```

Se quiser permitir oficialmente os tipos novos na tabela `notificacoes`, confira se existe alguma constraint/check no Supabase. Se existir, adicione também:

- `mencao_comentario`
- `curtida_comentario`

Mesmo sem isso, o fallback desta correção deve fazer a notificação aparecer no sininho.
