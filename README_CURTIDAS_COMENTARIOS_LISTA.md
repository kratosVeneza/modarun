# Curtidas em comentários do feed

Esta atualização adiciona a possibilidade de ver quem curtiu um comentário no feed.

## O que mudou

- Ao lado do coração do comentário, quando houver curtidas, aparece:
  - `1 curtida`
  - `2 curtidas`
- Ao clicar nesse texto, abre uma lista com as pessoas que curtiram o comentário.
- Cada pessoa aparece com foto/nome e pode ser clicada para abrir o perfil.

## Arquivos alterados

- `app/page.tsx`
- `app/api/feed/comentarios/route.ts`

## Banco de dados

Não precisa criar tabela nova. A funcionalidade usa a tabela já existente:

```sql
feed_comentario_curtidas
```

Se ainda não tiver feito, mantenha este índice para evitar curtidas duplicadas:

```sql
create unique index if not exists feed_comentario_curtidas_unique
on feed_comentario_curtidas(comentario_id, user_id);
```
