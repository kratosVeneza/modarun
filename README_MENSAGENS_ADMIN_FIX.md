# Correção — Mensagens do Admin

Arquivos alterados somente nesta correção:

- `app/admin/page.tsx`
- `app/api/admin/mensagem/route.ts`

## O que foi corrigido

- A seleção de usuário agora usa o ID do usuário escolhido na busca, sem depender do campo manual.
- O campo manual continua disponível, mas só é usado quando não houver usuário selecionado.
- O botão **Calcular destinatários** valida o destino antes de enviar.
- Envio para todos usa os usuários reais do Auth do Supabase.
- Envio por cidade considera `user_cidades_interesse` e cidade salva no metadata do usuário.
- Envio para usuário específico valida se o UUID existe no Auth.
- A API envia notificações em lotes de 500.

## Importante

A variável abaixo precisa existir na Vercel em Production:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

A funcionalidade usa a tabela já existente:

```txt
notificacoes
```
