git add .# Ajuste de banners por página

Esta versão separa duas coisas que antes estavam misturadas:

1. `ativo`: liga/desliga o banner no sistema inteiro.
2. `exibir_loja`: controla se o banner aparece no topo da loja.

Assim, você pode deixar `exibir_loja = false` e ainda marcar o banner para aparecer em páginas como Feed, Eventos, Calculadora de Pace, Calculadora de FC e Criar treino.

Também foi adicionada a coluna `config_paginas`, que salva ajustes individuais por local, por exemplo:

- Loja
- Feed / Comunidade
- Eventos
- Calc. Pace
- Calc. FC
- Criar treino

Cada local pode ter:

- modo da imagem: `cover` ou `contain`
- altura do banner
- posição X
- posição Y

## Rode este SQL no Supabase

```sql
alter table banners
add column if not exists exibir_loja boolean default true;

alter table banners
add column if not exists config_paginas jsonb default '{}'::jsonb;

update banners
set exibir_loja = true
where exibir_loja is null;

update banners
set config_paginas = '{}'::jsonb
where config_paginas is null;
```

## Como usar no admin

1. Vá em Admin > Banners.
2. Crie ou edite um banner.
3. Use `Banner ativo` para ligar/desligar completamente o banner.
4. Use `Exibir na loja` para decidir se ele aparece no topo da loja.
5. Marque as páginas onde ele deve aparecer como propaganda.
6. Em `Ajuste visual por página`, escolha a página e configure altura, modo da imagem e posição.

## Diferença entre os modos

- `Preencher / cortar`: a imagem preenche todo o espaço, mas pode cortar bordas.
- `Inteira / sem cortar`: a imagem aparece inteira, mas pode sobrar espaço nas laterais ou acima/abaixo.
