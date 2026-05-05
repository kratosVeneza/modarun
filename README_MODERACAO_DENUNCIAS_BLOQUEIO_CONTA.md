# Moda Run — moderação, denúncias, bloqueio e exclusão de conta

Esta atualização adiciona somente recursos de segurança/moderação, sem alterar a lógica das notificações sociais que já estava funcionando.

## Recursos adicionados

- Denunciar publicação no feed.
- Denunciar comentário no feed.
- Denunciar usuário no perfil público.
- Bloquear/desbloquear usuário no perfil público.
- Admin visualizar denúncias em `/admin`, aba **DENÚNCIAS**.
- Admin remover publicação ou comentário denunciado.
- Campo no perfil do próprio usuário para excluir a conta digitando `EXCLUIR`.

## Banco de dados

Se as tabelas `denuncias` e `user_blocks` ainda não existirem no Supabase, execute o SQL:

`supabase/migrations/20260505_moderacao_denuncias_bloqueios.sql`

A aplicação tenta avisar no painel/API caso essas tabelas ainda não existam.

## Variáveis necessárias

Para remoção admin e exclusão de conta funcionar de forma completa na Vercel, mantenha configurada uma destas variáveis:

- `SUPABASE_SERVICE_ROLE_KEY`, ou
- `SUPABASE_SERVICE_KEY`

As notificações não foram alteradas nesta implementação.
