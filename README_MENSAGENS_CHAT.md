# Correção e evolução da aba Mensagens / Chat

Esta versão adiciona uma página completa em `/chat` e melhora a API `/api/mensagens`.

## O que foi corrigido

- O menu já apontava para `/chat`, mas a página não existia.
- O botão “MENSAGEM” no perfil público abria `/perfil?mensagem=...`, mas isso não iniciava uma conversa nova corretamente.
- A lista de conversas dependia de consultas repetidas em `feed_posts` e não tinha página completa de chat.
- A exclusão apagava fisicamente apenas mensagens enviadas pelo usuário, sem opção “apagar só para mim” ou “apagar para todos”.

## O que foi adicionado

- Página `/chat` com layout em duas colunas.
- Busca de usuários/corredores.
- Iniciar conversa privada com outro usuário.
- Lista de conversas com contador de não lidas.
- Histórico da conversa.
- Envio com Enter e quebra de linha com Shift + Enter.
- Realtime via Supabase para novas mensagens e atualizações.
- Marcação de mensagens como lidas ao abrir conversa.
- Apagar só para mim.
- Apagar para todos, apenas para quem enviou.
- Notificação para o destinatário quando recebe mensagem privada.

## SQL necessário no Supabase

Rode no SQL Editor do Supabase antes de usar a nova versão:

```sql
create table if not exists mensagens (
  id bigserial primary key,
  remetente_id uuid not null references auth.users(id) on delete cascade,
  destinatario_id uuid not null references auth.users(id) on delete cascade,
  texto text,
  lida boolean not null default false,
  created_at timestamptz not null default now(),
  lida_em timestamptz,
  apagada_para_todos boolean not null default false,
  apagada_em timestamptz,
  apagada_por uuid,
  oculta_para uuid[] not null default '{}'
);

alter table mensagens add column if not exists lida_em timestamptz;
alter table mensagens add column if not exists apagada_para_todos boolean not null default false;
alter table mensagens add column if not exists apagada_em timestamptz;
alter table mensagens add column if not exists apagada_por uuid;
alter table mensagens add column if not exists oculta_para uuid[] not null default '{}';

create index if not exists idx_mensagens_remetente_destinatario on mensagens(remetente_id, destinatario_id, created_at desc);
create index if not exists idx_mensagens_destinatario_lida on mensagens(destinatario_id, lida, created_at desc);

alter table mensagens enable row level security;

drop policy if exists "mensagens_select_participantes" on mensagens;
create policy "mensagens_select_participantes"
on mensagens for select
to authenticated
using (auth.uid() = remetente_id or auth.uid() = destinatario_id);

drop policy if exists "mensagens_insert_remetente" on mensagens;
create policy "mensagens_insert_remetente"
on mensagens for insert
to authenticated
with check (auth.uid() = remetente_id and auth.uid() <> destinatario_id);

drop policy if exists "mensagens_update_participantes" on mensagens;
create policy "mensagens_update_participantes"
on mensagens for update
to authenticated
using (auth.uid() = remetente_id or auth.uid() = destinatario_id)
with check (auth.uid() = remetente_id or auth.uid() = destinatario_id);
```

## Realtime

Para o chat atualizar ao vivo, ative Realtime na tabela `mensagens` no Supabase:

Database > Replication > marque a tabela `mensagens`.

Mesmo sem Realtime, o chat continua funcionando ao enviar e abrir conversas, mas as mensagens recebidas podem exigir recarregar/abrir a conversa.
