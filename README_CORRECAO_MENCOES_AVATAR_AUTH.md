# Correção — menções no sininho e foto de perfil

## O que foi corrigido

### 1. Menções com @ nos comentários

Antes, a notificação de menção dependia de o texto digitado depois do `@` bater exatamente com o handle calculado pelo app. Isso falhava em nomes com acentos, espaços, pontos, sobrenomes ou quando o usuário era selecionado na lista mas o texto ficava em uma variação diferente.

Agora o comentário envia também os IDs dos usuários escolhidos na lista de sugestões do `@`, e a API usa esses IDs como caminho principal para criar a notificação no sininho.

Também foi mantido um fallback para menções digitadas manualmente, aceitando variações com e sem acentos/pontos.

Arquivos alterados:

- `app/page.tsx`
- `app/api/feed/comentarios/route.ts`

### 2. Foto de perfil não deve ser substituída pela foto do Google/provedor

O app agora prioriza a foto escolhida dentro do Moda Run usando o campo:

```txt
moda_run_avatar_url
```

A foto do provedor externo (`picture`) fica apenas como fallback. Isso evita que, ao entrar por Google/OAuth, a foto anterior escolhida no Moda Run seja trocada visualmente pela foto do e-mail.

Arquivos alterados:

- `app/perfil/page.tsx`
- `app/api/usuarios/route.ts`
- `app/api/feed/comentarios/route.ts`
- `app/api/feed/posts/route.ts`
- `app/api/feed/curtir/route.ts`
- `app/api/feed/follows/route.ts`
- `app/api/mensagens/route.ts`
- `components/AuthForm.tsx`

## Sobre entrar com email/senha e Google

É correto o app permitir os dois caminhos:

- email e senha;
- Google.

O ideal é que o usuário use o mesmo email para manter a mesma identidade no app. O aviso foi adicionado no formulário de login/cadastro.

## Conferência importante na Vercel

A notificação de menção depende da variável:

```txt
SUPABASE_SERVICE_ROLE_KEY
```

Ela precisa estar disponível em **Production** na Vercel.

## Teste recomendado

1. Entre com o usuário A.
2. Abra um comentário no feed.
3. Digite `@` e clique no usuário B na lista de sugestões.
4. Envie o comentário.
5. Entre com o usuário B.
6. Confira o sininho.

A notificação deve aparecer como:

```txt
Fulano marcou você em um comentário
```

Se não aparecer ao vivo, atualize a página. Se aparecer só após atualizar, o problema restante é apenas o Realtime da tabela `notificacoes`.
