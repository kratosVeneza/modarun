# Correção - Seguir usuário e chat

Alterações feitas nesta versão:

1. Seguir/desseguir
- A API `/api/feed/follows` agora confirma no banco antes de alterar a interface.
- O botão de seguir no perfil público deixa de fazer apenas alteração visual otimista.
- A leitura do perfil em `/api/usuarios?id=...` agora usa `SUPABASE_SERVICE_ROLE_KEY` quando disponível, evitando que RLS ou falta de posts impeça o app de saber se o usuário já segue aquele perfil.
- A busca de usuário também consegue encontrar usuários do Auth que ainda não publicaram no feed.

2. Chat
- Na conversa, a foto e o nome do usuário no topo agora são links para `/perfil/[id]`.
- A exclusão de mensagens pede confirmação.
- Os botões de apagar ficaram sempre visíveis.
- A API de exclusão usa service role quando disponível, mas valida antes se o usuário participa daquela conversa.

3. Banco necessário
A tabela `follows` precisa existir com colunas:
- follower_id uuid
- following_id uuid

E índice único:

```sql
create unique index if not exists follows_follower_following_unique
on follows(follower_id, following_id);
```

A tabela `mensagens` precisa ter as colunas de exclusão:
- apagada_para_todos
- apagada_em
- apagada_por
- oculta_para
