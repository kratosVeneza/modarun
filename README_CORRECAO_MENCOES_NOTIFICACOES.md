# Correção de notificações de menção com @

Esta versão corrige a criação de notificações quando um usuário é marcado com @ em comentários do feed.

## O que foi ajustado

- A API `app/api/feed/comentarios/route.ts` agora resolve menções por três caminhos:
  1. usuário selecionado na lista de sugestões do frontend;
  2. usuários reais do Auth do Supabase;
  3. nomes/e-mails gravados em `feed_posts` e `feed_comentarios`.

- A criação da notificação ficou mais robusta: tenta salvar todos os campos e, se alguma coluna opcional ainda não existir no banco, salva uma notificação mínima com `user_id`, `tipo`, `titulo`, `corpo`, `link` e `lida`.

- O sininho agora reconhece o tipo `mencao_comentario` com ícone próprio.

## Como testar

1. Entre com o usuário A.
2. Comente em uma publicação digitando `@` e escolha o usuário B na lista.
3. Envie o comentário.
4. Entre com o usuário B.
5. O sininho deve mostrar: `Usuário A marcou você em um comentário`.

## Importante

A tabela `notificacoes` precisa estar no Realtime para aparecer ao vivo sem recarregar:

```sql
alter publication supabase_realtime add table notificacoes;
```

Se o Supabase informar que a tabela já faz parte da publicação, pode ignorar.
