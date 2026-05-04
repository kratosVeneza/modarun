# Correção: chat digitando e comentários em tempo real

## O que foi alterado

### `app/chat/page.tsx`
- O indicador de **digitando...** agora usa um canal próprio por conversa:
  - `chat-digitando-userA-userB`
- O app só envia o evento de digitação depois que o canal Realtime estiver inscrito (`SUBSCRIBED`).
- Ao trocar de conversa, o estado de digitação é limpo.

### `app/page.tsx`
- Os comentários do feed agora escutam alterações em tempo real nas tabelas:
  - `feed_comentarios`
  - `feed_comentario_curtidas`
- Quando outro usuário comenta, responde, edita, exclui ou curte um comentário, a lista aberta é recarregada automaticamente.
- Se o painel de comentários estiver fechado, o contador de comentários principais é atualizado quando chega comentário novo.

## SQL necessário no Supabase

Rode uma vez no SQL Editor:

```sql
alter publication supabase_realtime add table mensagens;
alter publication supabase_realtime add table feed_comentarios;
alter publication supabase_realtime add table feed_comentario_curtidas;
```

Se aparecer erro dizendo que a tabela já faz parte da publicação, pode ignorar.

## Como testar

### Digitando no chat
1. Abra o app com o usuário A em um navegador.
2. Abra o app com o usuário B em outro navegador ou aba anônima.
3. Os dois devem abrir a mesma conversa em `/chat`.
4. Quando A digitar, B deve ver `está digitando...`.

### Comentários em tempo real
1. Usuário A abre uma publicação no feed e deixa os comentários abertos.
2. Usuário B comenta nessa mesma publicação.
3. O comentário deve aparecer para A sem atualizar a página.
4. Teste também responder comentário e curtir comentário.
