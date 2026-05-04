# Correção — notificações de menção e curtida em comentário

Arquivo alterado:

- `app/api/feed/comentarios/route.ts`

## Por que responder comentário notificava, mas @ e curtida não?

A resposta funcionava porque o sistema usa diretamente `resposta_para` para buscar o `user_id` do comentário original.

A menção com `@` falhava porque a API tentava conferir se o texto do @ batia exatamente com o handle/nome/e-mail normalizado. Isso quebrava com nomes com acento, ponto, espaço, sobrenome ou diferença entre nome público e e-mail.

A curtida em comentário até tentava criar notificação, mas não retornava diagnóstico e podia falhar silenciosamente. Agora a API consulta o comentário alvo antes, evita duplicar notificação para curtida repetida e retorna diagnóstico interno.

## Como testar

1. Usuário A comenta uma publicação de outro usuário.
2. Usuário B responde o comentário: usuário A deve receber notificação.
3. Usuário B digita `@`, escolhe usuário A na lista e envia: usuário A deve receber notificação.
4. Usuário B curte comentário de usuário A: usuário A deve receber notificação.

## Observação

A menção é mais confiável quando o usuário é escolhido na lista que aparece após digitar `@`.
