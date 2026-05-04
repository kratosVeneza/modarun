# Correção de menções com @ e notificações

Esta versão corrige a criação de notificações quando um usuário é marcado com `@` em comentários do feed.

## O que mudou

- O comentário agora envia ao backend os usuários selecionados na lista de sugestões.
- A API também tenta resolver menções digitadas manualmente por nome, e-mail ou handle.
- A notificação `mencao_comentario` é criada com fallback caso o banco não tenha todas as colunas opcionais.
- O sininho reconhece o tipo `mencao_comentario`.
- A resposta da API informa `mencoes_encontradas` e `mencoes_notificadas`, útil para diagnóstico.

## SQL recomendado

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

Se o comando do Realtime disser que a tabela já faz parte da publicação, pode ignorar.

## Como testar

1. Entre com o usuário A.
2. Abra uma publicação.
3. Digite `@` e escolha o usuário B na lista de sugestões.
4. Envie o comentário.
5. Entre com o usuário B e confira o sininho.

Se a notificação aparecer ao atualizar, mas não ao vivo, o problema é apenas Realtime.
