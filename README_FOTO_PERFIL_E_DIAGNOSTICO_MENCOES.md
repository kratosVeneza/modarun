# Correções v2 — foto de perfil + diagnóstico de menções

Esta rodada complementa as correções anteriores. Não remove nada. Apenas
adiciona robustez aos pontos que ainda estavam com problema.

## Arquivos alterados

- `app/perfil/page.tsx` — leitura/escrita do avatar mais resistente
- `app/page.tsx` — log de diagnóstico das menções no console do navegador
- `app/api/feed/comentarios/route.ts` — `criarNotificacao` com fallback para
  client autenticado, resposta com diagnóstico das menções

## Arquivo novo

- `app/api/notificacoes/diagnostico/route.ts` — rota de diagnóstico

## 1. Foto do perfil voltando para a inicial do email

### Causa provável

O perfil só lia `user_metadata.avatar_url`. Mas em vários outros lugares do
app (criação de post, follows, busca de usuários) a foto é lida de qualquer
um destes campos: `avatar_url`, `picture`, `foto`, `foto_url`. Se o Supabase
mexeu na metadata por algum motivo (login com Google, link de identidades,
reset de metadata), o `avatar_url` pode ter virado `null` enquanto `picture`
ficou intacto — o resultado é que seu post no feed mostra a foto certa, mas
seu perfil mostra a inicial do email.

### O que mudou

- `setAvatarUrl` agora aceita `avatar_url || picture || foto || foto_url`,
  na mesma ordem que o resto do app.
- `uploadFoto` e `removerFoto` agora gravam o valor em todos os 4 campos ao
  mesmo tempo. Assim a foto fica consistente independente de qual campo o
  resto do app preferir ler.
- Apareceu um botão **↻ RESTAURAR FOTO ANTIGA** no perfil quando você não
  tem foto. Ele busca a foto do seu post mais recente em `feed_posts` e
  grava como sua foto de perfil. Útil quando o Supabase desincronizou a
  metadata.

### O que fazer agora

1. Abra `/perfil`.
2. Se a foto correta já apareceu, ótimo — significa que ela estava em
   `picture` e agora está sendo lida.
3. Se ainda aparece a inicial do email, clique em **↻ RESTAURAR FOTO ANTIGA**.
4. Se mesmo assim não restaurar, faça upload da foto novamente. A partir
   desse momento ela vai ficar gravada nos 4 campos e não suma mais.

## 2. Menção `@usuario` ainda não notifica

### O suspeito principal: SUPABASE_SERVICE_ROLE_KEY

A criação de notificação para outro usuário **precisa do service role key**
ou de uma política RLS permissiva. Em ordem:

- Se `SUPABASE_SERVICE_ROLE_KEY` está configurada na Vercel, tudo funciona.
- Se não está, o código agora tenta inserir como o usuário logado. Isso só
  funciona se a tabela `notificacoes` tiver uma política RLS permitindo
  INSERT por qualquer autenticado.

Antes desta versão, sem service key, o código simplesmente não inseria nada
e logava o erro num lugar que você não enxerga (`console.error` no servidor
da Vercel).

### Como descobrir o que está acontecendo no seu caso

Há duas formas:

**A) Console do navegador (rápido):**
1. Abra o DevTools (F12 → aba Console).
2. Comente em uma publicação mencionando alguém com `@`.
3. No console aparece uma linha começando com `[MODA RUN] menções enviadas:`.
4. Olhe o objeto `detalhes` — para cada menção mostra `ok: true/false` e o
   campo `error` quando falha. Por exemplo:
   - `ok: true, fallback: false` → tudo certo, foi com service key.
   - `ok: true, fallback: true` → funcionou usando sua sessão (RLS permite).
   - `ok: false, error: "..."` → mostra o motivo exato do banco.
5. O campo `admin_disponivel` indica se a `SUPABASE_SERVICE_ROLE_KEY` está
   configurada.

**B) Rota de diagnóstico (mais detalhado):**

Estando logado, abra no navegador:

```
https://modarun.com.br/api/notificacoes/diagnostico
```

Você verá um JSON com:

- `tem_service_key`: `true/false`
- `insercao_com_sessao_ok`: você consegue inserir como você mesmo?
- `insercao_com_admin_ok`: o servidor consegue inserir com service key?
- `erro_insercao_com_sessao` / `erro_insercao_com_admin`: mensagens claras
  quando dá erro.
- `proximos_passos`: orientação automática.

### Cenários e correções

#### Cenário 1: `tem_service_key: false`

Configure `SUPABASE_SERVICE_ROLE_KEY` na Vercel:

1. Vá em https://supabase.com/dashboard → seu projeto → Settings → API.
2. Copie o `service_role` key (cuidado, é uma chave secreta — nunca exponha
   no frontend).
3. Na Vercel: seu projeto → Settings → Environment Variables.
4. Adicione `SUPABASE_SERVICE_ROLE_KEY` com o valor copiado, em todos os
   ambientes (Production, Preview, Development).
5. Faça redeploy.

#### Cenário 2: `tem_service_key: true` mas `erro_insercao_com_admin` mostra erro de coluna

Significa que a tabela `notificacoes` não tem alguma das colunas. Rode no
SQL Editor:

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
```

#### Cenário 3: `tem_service_key: false` e quer que funcione sem service key

Se você prefere não configurar a service key, adicione esta política RLS
permitindo qualquer usuário autenticado criar notificações para qualquer
outro:

```sql
alter table notificacoes enable row level security;

create policy "auth_pode_inserir_notificacoes"
on notificacoes for insert
to authenticated
with check (true);

create policy "usuario_le_proprias_notificacoes"
on notificacoes for select
to authenticated
using (user_id = auth.uid());

create policy "usuario_atualiza_proprias_notificacoes"
on notificacoes for update
to authenticated
using (user_id = auth.uid());

create policy "usuario_apaga_proprias_notificacoes"
on notificacoes for delete
to authenticated
using (user_id = auth.uid());
```

> Se o Supabase reclamar que a política já existe, ignore ou use
> `drop policy if exists "..."` antes.

Com isso, o fallback para sessão autenticada vai conseguir inserir e a
notificação chega ao destinatário.

## 3. Outras notificações afetadas pelo mesmo problema

Não é só menção. Pelo mesmo motivo, podem estar falhando silenciosamente:

- `comentario_post` — alguém comentou no seu post
- `resposta_comentario` — alguém respondeu seu comentário
- `curtida_comentario` — alguém curtiu seu comentário (novo nesta versão)
- `mencao_post` — alguém te marcou no texto de um post (novo nesta versão)
- `novo_post` — alguém que você segue publicou (novo nesta versão)

Resolvendo o cenário 1, 2 ou 3 acima, **todas** essas notificações passam
a chegar.

## Por que não fiz tudo silenciosamente

Você só vai conseguir resolver o problema da raiz se souber se é falta de
service key, falta de coluna no banco, ou RLS bloqueando. Por isso a rota
de diagnóstico e o log no DevTools — assim você descobre em 30 segundos.
