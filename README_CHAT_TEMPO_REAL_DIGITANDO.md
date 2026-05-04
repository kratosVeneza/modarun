# Chat em tempo real e indicador de digitação

## O que foi ajustado

Arquivo alterado:

- `app/chat/page.tsx`

Melhorias:

- Mantido o recebimento de mensagens em tempo real via Supabase Realtime na tabela `mensagens`.
- Adicionado indicador visual: `Fulano está digitando...`.
- O aviso de digitação é enviado via broadcast do Supabase Realtime, sem criar tabela nova.
- O aviso some automaticamente quando a pessoa para de digitar ou envia a mensagem.
- Ao abrir outra conversa, o indicador é limpo para não mostrar digitação da conversa anterior.

## Precisa rodar SQL?

Para o indicador de digitação, não precisa criar tabela nova.

Para as mensagens em tempo real, confirme que a tabela `mensagens` está no Realtime:

```sql
alter publication supabase_realtime add table mensagens;
```

Se aparecer que a tabela já faz parte da publicação, pode ignorar.

## Como testar

1. Abra o app em dois navegadores diferentes ou uma aba normal e uma aba anônima.
2. Entre com o usuário A em uma aba.
3. Entre com o usuário B na outra.
4. Abra a conversa entre eles.
5. Digite no campo de mensagem sem enviar.
6. O outro usuário deve ver `está digitando...`.
7. Envie a mensagem e confira se ela aparece sem precisar atualizar a página.
