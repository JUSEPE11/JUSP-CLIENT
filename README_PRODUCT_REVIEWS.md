# JUSP — Reseñas verificadas de producto

## Objetivo

Esta feature permite:
- mostrar comentarios y calificaciones con estrellas por producto;
- aceptar reseñas solo de clientes con compra confirmada;
- impedir una segunda reseña del mismo cliente para el mismo producto.

## Estado de la implementación

La app ya está preparada para usar una tabla dedicada llamada `public.product_reviews`.

Mientras esa tabla no exista en Supabase:
- la app sigue funcionando con `logs` como fallback temporal;
- pero la protección fuerte contra duplicados depende de crear la tabla e índice único.

## SQL recomendado

Ejecuta esto en el SQL Editor de Supabase:

```sql
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_key text not null,
  product_id text not null,
  product_slug text null,
  product_title text null,
  rating int not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 12 and 700),
  author_name text null,
  user_id text null,
  user_email text null,
  reviewer_key text not null,
  verified_purchase boolean not null default true,
  order_id text null,
  order_code text null,
  purchase_status text null,
  purchased_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists product_reviews_one_per_reviewer_product_idx
  on public.product_reviews (product_key, reviewer_key);

create index if not exists product_reviews_product_key_created_at_idx
  on public.product_reviews (product_key, created_at desc);

create index if not exists product_reviews_user_id_idx
  on public.product_reviews (user_id);

create index if not exists product_reviews_user_email_idx
  on public.product_reviews (user_email);
```

## Migración opcional desde logs

Si ya existen reseñas guardadas en `logs`, puedes migrarlas así:

```sql
insert into public.product_reviews (
  product_key,
  product_id,
  product_slug,
  product_title,
  rating,
  comment,
  author_name,
  user_id,
  user_email,
  reviewer_key,
  verified_purchase,
  order_id,
  order_code,
  purchase_status,
  purchased_at,
  created_at
)
select
  lower(
    coalesce(
      nullif(meta->>'product_key', ''),
      nullif(meta->>'product_slug', ''),
      nullif(meta->>'product_id', '')
    )
  ) as product_key,
  nullif(meta->>'product_id', '') as product_id,
  nullif(meta->>'product_slug', '') as product_slug,
  nullif(meta->>'product_title', '') as product_title,
  nullif(meta->>'rating', '')::int as rating,
  nullif(meta->>'comment', '') as comment,
  nullif(meta->>'author_name', '') as author_name,
  nullif(meta->>'user_id', '') as user_id,
  nullif(user_email, '') as user_email,
  coalesce(
    nullif(meta->>'reviewer_key', ''),
    case
      when nullif(meta->>'user_id', '') is not null then 'uid:' || nullif(meta->>'user_id', '')
      when nullif(user_email, '') is not null then 'email:' || lower(user_email)
      else 'legacy:' || coalesce(nullif(order_id, ''), id::text)
    end
  ) as reviewer_key,
  coalesce((meta->>'verified_purchase')::boolean, true) as verified_purchase,
  nullif(order_id, '') as order_id,
  nullif(meta->>'order_code', '') as order_code,
  nullif(meta->>'purchase_status', '') as purchase_status,
  nullif(meta->>'purchased_at', '')::timestamptz as purchased_at,
  coalesce(created_at, now()) as created_at
from public.logs
where scope = 'product_review'
  and coalesce(meta->>'comment', '') <> ''
  and coalesce(meta->>'rating', '') <> ''
  and coalesce(
    nullif(meta->>'product_key', ''),
    nullif(meta->>'product_slug', ''),
    nullif(meta->>'product_id', '')
  ) <> ''
on conflict (product_key, reviewer_key) do nothing;
```

## Nota operativa

Desde esta actualización, `app/api/orders/route.ts` también guarda `slug` y `product_slug` dentro de `items` para que la verificación de compra sea más robusta.
