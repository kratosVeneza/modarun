# Melhoria da aba Admin > Mensagens

Foram alterados somente os arquivos ligados ao envio de mensagens/notificações do app pelo painel admin:

- `app/admin/page.tsx`
- `app/api/admin/mensagem/route.ts`

## O que mudou

- Envio para todos agora busca usuários reais no Auth do Supabase usando `SUPABASE_SERVICE_ROLE_KEY`. Antes dependia de `feed_posts`, então usuários sem publicação podiam não receber.
- Envio por cidade agora considera `user_cidades_interesse` e também cidade salva nos metadados do usuário, quando existir.
- Envio para usuário específico ganhou busca por nome/e-mail, sem precisar copiar UUID manualmente.
- Foi adicionado botão para calcular destinatários antes de enviar.
- Foi adicionada confirmação antes do disparo.
- A API envia em lotes de 500 notificações.

## Requisito

A variável abaixo precisa existir na Vercel em Production:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

## Banco

Não precisa rodar SQL novo. A funcionalidade usa a tabela existente `notificacoes`.
