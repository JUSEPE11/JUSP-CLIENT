# JUSP — OTP real + Admin Metrics (PRO MAX)

## 1) ¿Envía un código real a tu Gmail?
✅ **Sí**, pero SOLO si configuras un proveedor de email.
Este fix usa **Resend** (sin librerías extra) para mandar un **código real de 6 dígitos**.

### Variables de entorno requeridas
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` (ej: `JUSP <no-reply@tudominio.com>`)
- `OTP_PEPPER` (string cualquiera, secreto)
- `JUSP_ADMIN_TOKEN` (tu token admin)

## 2) ¿Dónde ves cuántos usuarios hay registrados?
✅ En el panel:
- `/admin/metrics` (requiere cookie admin)

API:
- `/api/admin/metrics` (solo admin)

## 3) Tablas necesarias (SQL)
Ejecuta esto en Supabase SQL Editor:

### email_otps (OBLIGATORIA)
```sql
create table if not exists public.email_otps (
  email text primary key,
  user_id uuid not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists email_otps_user_id_idx on public.email_otps(user_id);
```

### daily_metrics (OPCIONAL, para métrica diaria guardada)
```sql
create table if not exists public.daily_metrics (
  day text primary key,
  new_users int not null default 0,
  created_at timestamptz not null default now()
);
```

## 4) Métrica de crecimiento diaria automática
Incluye endpoint:
- `/api/cron/daily-growth`

✅ Puedes llamarlo diariamente (Vercel Cron) para guardar el conteo en `daily_metrics`.

## 5) Admin Login
Endpoint:
- `POST /api/admin/login` body `{ "token": "TU_JUSP_ADMIN_TOKEN" }`
- `POST /api/admin/logout`
