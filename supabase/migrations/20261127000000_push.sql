-- MiCine: notificaciones push (estrenos y recordatorios).

create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  prefs jsonb not null default '{"estrenos": true, "recordatorios": true}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.push_subs enable row level security;
create policy "mis suscripciones" on public.push_subs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.push_subs to authenticated;

-- Registro de avisos enviados, para no repetirlos. Solo lo usa el servidor.
create table if not exists public.push_log (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.push_log enable row level security;
