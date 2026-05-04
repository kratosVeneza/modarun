# Correções — Comentários, respostas, curtidas e menções no feed

## Arquivos alterados

- `app/page.tsx`
- `app/api/feed/comentarios/route.ts`

## O que foi corrigido/melhorado

1. **Layout mobile dos comentários**
   - O bloco de comentários agora usa `min-w-0`, quebra de linha e botões com `flex-wrap`.
   - Os botões `EDITAR` e `EXCLUIR` não devem mais ficar cortados no celular.
   - A área de curtir/comentar/compartilhar foi ajustada para empilhar melhor em telas pequenas.

2. **Curtida em comentário**
   - Agora a API retorna `curtido_por_mim` em cada comentário.
   - Quando o usuário curte um comentário, o coração fica marcado.
   - Ao recarregar a página e abrir os comentários novamente, a curtida continua marcada.
   - O total de curtidas do comentário é atualizado após curtir/descurtir.

3. **Quantidade de respostas**
   - Comentários principais agora mostram a quantidade de respostas abaixo do comentário.
   - Ao responder um comentário, o número de respostas aparece/atualiza imediatamente.

4. **Marcar usuários com @**
   - Ao digitar `@` e pelo menos 2 letras no campo de comentário/resposta, aparece uma lista de usuários.
   - Ao clicar em um usuário, a menção é inserida no comentário.
   - Menções aparecem destacadas em verde no texto.
   - O usuário marcado recebe notificação no sininho, quando a tabela `notificacoes` está ativa.

## SQL recomendado no Supabase

Rode uma vez no SQL Editor para garantir que a curtida de comentário não duplique e que a coluna de contagem exista:

```sql
alter table feed_comentarios
add column if not exists total_curtidas integer not null default 0;

create unique index if not exists feed_comentario_curtidas_unique
on feed_comentario_curtidas(comentario_id, user_id);
```

Se a tabela `notificacoes` ainda não estiver no Realtime, rode:

```sql
alter publication supabase_realtime add table notificacoes;
```

Se aparecer que já faz parte da publicação, pode ignorar.
