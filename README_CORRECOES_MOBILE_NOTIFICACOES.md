# Correções e melhorias — Mobile e Notificações do feed

Esta atualização ajusta os problemas reportados no celular e amplia a cobertura de
notificações no sininho. Nada anterior foi removido — tudo que já funcionava continua
funcionando.

## Arquivos alterados

- `app/page.tsx`
- `app/api/feed/comentarios/route.ts`
- `app/api/feed/posts/route.ts`
- `components/Header.tsx`

## O que foi corrigido

### 1. Layout dos comentários no celular

No mobile, o botão `EXCLUIR` aparecia cortado (virava `EXC`) porque a linha de ações
do comentário (`tempo · ❤️ · RESPONDER · EDITAR · EXCLUIR`) competia por espaço com
o avatar à esquerda dentro de um `<article>` com `overflow: hidden`.

Mudanças aplicadas:

- O wrapper interno de cada comentário recebeu `overflow-hidden` próprio para conter
  qualquer estouro do balão sem cortar a linha de ações.
- Cada botão da linha de ações recebeu `shrink-0` para forçar o `flex-wrap` a
  empurrar o último botão para a próxima linha em vez de truncar.
- O `gap-x` foi reduzido (`gap-x-3` → `gap-x-2`) e a fonte ficou menor no mobile
  (`text-[11px]` no celular, `text-xs` em telas ≥ sm).
- O texto longo do comentário agora quebra com `overflowWrap: anywhere`.
- A indentação das respostas no mobile foi reduzida (`ml-5` → `ml-3`), liberando
  mais espaço para a coluna de conteúdo.

### 2. Reestruturação da barra inferior do post

A barra `CURTIR / COMENTAR / COMPARTILHAR` mantinha o `<CardComentarios>` dentro
do mesmo `flex` container do botão `CURTIR`. Quando o painel de comentários
expandia, ele ficava espremido entre `CURTIR` e `COMPARTILHAR`, especialmente
no mobile.

Agora:

- A barra de ações fica em uma linha própria (com `flex-wrap` para quebrar em
  telas pequenas).
- O painel de comentários foi movido para **abaixo** dessa barra, ocupando a
  largura total do card (`w-full min-w-0`).
- O botão de compartilhar ganhou o rótulo `COMPARTILHAR` (antes ficava vazio
  enquanto não era clicado).

### 3. Menções com `@` que não notificavam

Mantivemos os três caminhos de resolução já existentes (sugestão escolhida,
Auth e tabelas do feed) e adicionamos:

- **No frontend**, a menção selecionada agora carrega também `handle` e `email`,
  e antes de enviar o comentário filtramos a lista pelos handles que ainda
  aparecem no texto. Assim, se você seleciona um usuário e depois apaga o `@`
  do texto, ele não é notificado por engano.
- **No backend**, validamos a menção contra o texto: o `user_id` selecionado
  só vira notificação se o handle (ou nome/email normalizado) realmente
  aparecer no texto enviado.

### 4. Cobertura de notificações no sininho

| Evento                                          | Antes | Agora |
| ----------------------------------------------- | ----- | ----- |
| Novo seguidor                                   | ✅    | ✅    |
| Curtida em publicação                           | ✅    | ✅    |
| Comentário em publicação                        | ✅    | ✅    |
| Resposta a comentário                           | ✅    | ✅    |
| Menção em comentário (`@usuario`)               | ✅\*  | ✅    |
| Menção em publicação (`@usuario` no post)       | ❌    | ✅    |
| Curtida em comentário                           | ❌    | ✅    |
| Novo post de quem você segue                    | ❌    | ✅    |
| Mensagem privada                                | ✅    | ✅    |

\*Já existia mas estava menos confiável; agora valida menção contra o texto.

Os tipos novos são:

- `mencao_post` — quando você é marcado dentro do texto de um post.
- `curtida_comentario` — quando alguém curte um comentário seu.
- `novo_post` — quando alguém que você segue publica algo novo.

O sininho (`components/Header.tsx`) reconhece os novos tipos com ícones próprios
(`@`, `💚`, `✨`).

### 5. Painel de notificações no celular

O painel de notificações agora usa largura adaptativa
(`w-[min(92vw,22rem)]`), evitando estouro em celulares pequenos.

## SQL recomendado no Supabase

Os tipos novos usam as mesmas colunas dos tipos antigos. Para garantir que
nenhuma coluna opcional esteja faltando e que o Realtime funcione no
celular/web, rode uma vez no SQL Editor:

```sql
alter table notificacoes add column if not exists lida boolean not null default false;
alter table notificacoes add column if not exists tipo text;
alter table notificacoes add column if not exists titulo text;
alter table notificacoes add column if not exists corpo text;
alter table notificacoes add column if not exists link text;
alter table notificacoes add column if not exists post_id bigint;
alter table notificacoes add column if not exists ator_id uuid;
alter table notificacoes add column if not exists ator_nome text;
alter table notificacoes add column if not exists ator_avatar text;

alter publication supabase_realtime add table notificacoes;
```

Se o Supabase informar que a tabela já faz parte da publicação, ignore o aviso.

## Como testar

### Layout mobile

1. Entre com qualquer usuário no celular.
2. Abra um post seu no feed e expanda os comentários.
3. Confirme que `EDITAR` e `EXCLUIR` aparecem inteiros, mesmo que precisem
   quebrar para a próxima linha.

### Menção em comentário

1. Entre com o usuário A.
2. Em uma publicação, digite `@` e escolha o usuário B na lista.
3. Envie o comentário.
4. Entre com o usuário B — o sininho deve mostrar
   "A marcou você em um comentário".

### Menção em publicação

1. Entre com o usuário A.
2. Toque em PUBLICAR e escreva um post mencionando `@b` (ou `@nome.do.b`).
3. Publique.
4. Entre com B — o sininho deve mostrar "A marcou você em uma publicação".

> Como o modal de criar post não tem lista de sugestões, as menções em posts
> são resolvidas pelo texto: o backend procura o handle digitado nos
> usuários do Auth e nas tabelas `feed_posts` / `feed_comentarios`.

### Curtida em comentário

1. Usuário A comenta em um post.
2. Usuário B abre o post e toca no coração ao lado do comentário do A.
3. A deve receber "B curtiu seu comentário" no sininho.

### Novo post de quem você segue

1. B segue A.
2. A publica um post.
3. B deve receber "A publicou algo novo" no sininho.

## Observações

- Nenhuma rota, função ou comportamento existente foi removido. Todas as
  mudanças são aditivas ou de layout.
- As notificações são criadas em `try/catch` silencioso: se a tabela
  `notificacoes` rejeitar uma coluna opcional, é feito fallback com as
  colunas mínimas (`user_id`, `tipo`, `titulo`, `corpo`, `link`, `lida`).
- Se você tem muitos seguidores, a notificação de novo post percorre todos
  com `limit(2000)` — mais do que suficiente por enquanto. Se um dia esse
  número crescer, vale migrar para uma fila/worker.
