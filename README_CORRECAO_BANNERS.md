# Correção dos banners da loja

Esta versão ajusta a exibição dos banners criados no Admin > Banners nas páginas:

- Feed / tela inicial (`/`)
- Calculadora de Pace (`/calculadora-pace`)
- Calculadora de FC (`/calculadora-fc`)
- Eventos (`/eventos`) já funcionava e foi mantida

## Arquivos alterados

- `components/CardLoja.tsx`
- `app/api/admin/banners/route.ts`
- `app/calculadora-pace/page.tsx`
- `app/calculadora-fc/page.tsx`
- `app/page.tsx`

## SQL para conferir no Supabase

Rode no SQL Editor caso alguma coluna ainda não exista:

```sql
alter table banners
add column if not exists paginas text[] default '{}';

alter table banners
add column if not exists produto_id uuid null;

alter table banners
add column if not exists ativo boolean default true;

alter table banners
add column if not exists ordem integer default 0;
```

Depois entre no Admin > Banners, edite ou crie um banner e marque as páginas onde ele deve aparecer.
