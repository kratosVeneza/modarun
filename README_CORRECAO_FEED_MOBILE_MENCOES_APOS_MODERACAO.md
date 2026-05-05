# Correção do feed após moderação

Esta versão corrige a regressão causada na última atualização de moderação.

## Corrigido

- Layout dos comentários no celular restaurado para não cortar os botões.
- Botão **EXCLUIR** aparece completo novamente.
- Curtida em comentário volta a ficar marcada corretamente.
- Contagem de respostas volta a aparecer no comentário principal.
- Menção com `@` volta a funcionar com lista de usuários e envio da notificação.
- A opção de denúncia no feed foi mantida sem quebrar o layout.

## Arquivos ajustados

- `app/page.tsx`
- `app/api/feed/comentarios/route.ts`

As demais funcionalidades de moderação, bloqueio, admin e exclusão de conta foram preservadas.
