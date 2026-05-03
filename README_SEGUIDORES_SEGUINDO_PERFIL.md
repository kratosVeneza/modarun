# Seguidores e Seguindo no perfil

Alteração feita somente na área social/perfil:

- Ao clicar em **Seguidores**, abre uma janela com as pessoas que seguem o usuário.
- Ao clicar em **Seguindo**, abre uma janela com as pessoas que o usuário segue.
- Cada pessoa da lista mostra foto, nome e e-mail quando disponível.
- Clicar na pessoa abre o perfil público dela em `/perfil/[id]`.
- Funciona no perfil próprio (`/perfil`) e no perfil público (`/perfil/[id]`).

Arquivos alterados/criados:

- `app/api/feed/follows/route.ts`
- `app/perfil/page.tsx`
- `app/perfil/[id]/page.tsx`
- `components/SeguidoresModal.tsx`

A função usa a tabela existente `follows`.
