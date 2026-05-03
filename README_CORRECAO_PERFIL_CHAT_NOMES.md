# Correção — perfil não encontrado e nomes no chat

Alterações principais:

- `app/api/usuarios/route.ts`
  - busca o usuário primeiro no Auth do Supabase via `SUPABASE_SERVICE_ROLE_KEY`;
  - aceita `nome_exibicao`, `display_name`, `full_name`, `name` e `nome` como fonte de nome;
  - mescla dados do Auth com os dados do último post do feed;
  - evita retornar “Usuário não encontrado” quando o usuário existe no Auth, mas ainda não publicou no feed.

- `app/api/mensagens/route.ts`
  - a lista de conversas agora busca nomes e fotos pelo Auth do Supabase;
  - o destinatário deixa de ver “Corredor” quando o remetente tem nome salvo no perfil;
  - notificações de mensagem usam o nome correto do remetente.

- `app/api/feed/posts/route.ts`
  - posts novos passam a salvar `nome_exibicao` quando existir.

- `app/api/feed/comentarios/route.ts`
  - comentários novos passam a salvar `nome_exibicao` quando existir.

Importante: mantenha `SUPABASE_SERVICE_ROLE_KEY` cadastrada na Vercel em Production e Preview.
