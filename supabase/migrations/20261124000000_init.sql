-- MiCine: perfiles, biblioteca (vistas / quiero ver) y actores seguidos.
-- Cada persona solo puede leer y escribir sus propios datos (Row Level Security).

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  avatar text not null default 'mago',
  color text not null default '#ff4d3d' check (color ~ '^#[0-9a-fA-F]{6}$'),
  theme text not null default 'cine',
  bio text not null default '' check (char_length(bio) <= 200),
  fav_genres int[] not null default '{}',
  prefs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Los perfiles (nombre, avatar, bio) son visibles para todos: permite chequear
-- si un @usuario está libre y, a futuro, ver perfiles de amigos.
create policy "perfiles visibles" on public.profiles
  for select using (true);
create policy "crear mi perfil" on public.profiles
  for insert with check (auth.uid() = id);
create policy "editar mi perfil" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.library (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  media_key text not null,                       -- 'movie:123' o 'tv:456'
  status text not null check (status in ('watched', 'want')),
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster text,
  year text,
  vote real,
  created_at timestamptz not null default now(),
  primary key (user_id, media_key)
);

alter table public.library enable row level security;
create policy "mi biblioteca" on public.library
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.followed_people (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  person_id int not null,
  name text not null,
  profile_path text,
  created_at timestamptz not null default now(),
  primary key (user_id, person_id)
);

alter table public.followed_people enable row level security;
create policy "mis actores" on public.followed_people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.library to authenticated;
grant select, insert, update, delete on public.followed_people to authenticated;
