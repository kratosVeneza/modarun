# Correções Social/Chat - Moda Run

## O que foi corrigido

1. Chat privado
- Corrigido o loop que fazia a tela ficar atualizando quando a conversa era aberta por `/chat?user=...`.
- Realtime agora atualiza a conversa aberta sem reabrir a tela repetidamente.
- Foi criada leitura resumida de mensagens não lidas: `/api/mensagens?resumo=1`.
- Adicionado `PATCH /api/mensagens` com `acao: "marcar_lidas"` para marcar conversa como lida sem recarregar tudo.

2. Caixa de mensagens
- O menu agora mostra badge/contador de mensagens privadas não lidas no item Chat e no ícone de mensagens do topo.

3. Seguir usuários
- Corrigido o estado inicial do botão Seguir/Seguindo no feed.
- Agora, ao atualizar a página, o botão continua como Seguindo se o usuário já segue aquele perfil.
- A API de seguir ficou mais resistente a problemas de RLS usando Service Role quando disponível, mas ainda exige usuário autenticado.

4. Curtidas no feed
- Corrigido o contador de curtidas para usar a tabela `feed_curtidas` diretamente.
- O botão de curtida agora sincroniza com o banco e corrige o total caso o retorno da API seja diferente do valor otimista.
- Ao atualizar a página, o post já sabe se o usuário logado curtiu.

5. Comentários
- Corrigido o contador local de comentários no card do post.
- Ao comentar, o número sobe na hora.
- Ao excluir comentário principal, o número reduz na hora.

6. Notificações e sugestões
- O painel de notificações agora filtra notificações pelo usuário logado no Realtime.
- Adicionado bloco de sugestões de perfis para seguir dentro do painel de notificações.
- A API `/api/usuarios?sugestoes=1` retorna perfis recentes ainda não seguidos pelo usuário.

## SQL recomendado no Supabase

Rode uma vez no SQL Editor para garantir que os upserts funcionem corretamente:

```sql
create unique index if not exists feed_curtidas_post_user_unique
on feed_curtidas(post_id, user_id);

create unique index if not exists follows_follower_following_unique
on follows(follower_id, following_id);
```

Se algum índice já existir com outro nome, o Supabase pode avisar. Nesse caso, não tem problema.

## Arquivos alterados

- `app/chat/page.tsx`
- `app/api/mensagens/route.ts`
- `app/api/feed/posts/route.ts`
- `app/api/feed/curtir/route.ts`
- `app/api/feed/follows/route.ts`
- `app/api/usuarios/route.ts`
- `app/page.tsx`
- `components/Header.tsx`
