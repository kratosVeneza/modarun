# Ajustes de Chat, Mensagens e Pesquisa

Alterações nesta versão:

- Removido o botão extra de mensagem no canto superior direito do Header.
- Mantido apenas o item principal **Chat** no menu superior, com badge de mensagens não lidas.
- Removida a aba **Mensagens** de dentro do perfil próprio para evitar redundância.
- A página `/chat` agora tem uma barra de pesquisa grande no topo para encontrar usuários cadastrados.
- A busca também continua na coluna lateral da página de mensagens.
- A API `/api/usuarios` agora tenta buscar usuários também pelo Auth do Supabase usando `SUPABASE_SERVICE_ROLE_KEY`, permitindo encontrar usuários que ainda não fizeram publicações no feed.

Observação: para a busca listar usuários que nunca postaram, a variável `SUPABASE_SERVICE_ROLE_KEY` precisa estar cadastrada na Vercel.
