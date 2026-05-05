# Correção: comentários quase em tempo real e chat digitando

## O que foi corrigido

### 1. Comentários do feed
O app já tentava usar Supabase Realtime, mas em alguns projetos isso pode falhar por causa de configuração de publicação/RLS/cache. Para garantir a experiência no celular, a área de comentários agora usa duas camadas:

1. Supabase Realtime, quando funcionar corretamente.
2. Polling leve a cada 1,8s enquanto a caixa de comentários estiver aberta.

Com isso, quando outra pessoa comentar, responder ou curtir comentário, a lista aberta atualiza sem precisar recarregar a página.

### 2. Chat: “está digitando...”
Foi ajustada a referência da conversa ativa para o broadcast de digitação não usar uma conversa antiga ou nula. Agora, ao abrir uma conversa, a referência interna é atualizada imediatamente.

## Arquivos alterados

- `app/page.tsx`
- `app/chat/page.tsx`

## Supabase
Confirme que estas tabelas estão no Realtime:

```sql
alter publication supabase_realtime add table feed_comentarios;
alter publication supabase_realtime add table feed_comentario_curtidas;
alter publication supabase_realtime add table mensagens;
```

Se alguma delas já estiver ativa, o Supabase mostrará erro de `already member`; nesse caso pode ignorar.
