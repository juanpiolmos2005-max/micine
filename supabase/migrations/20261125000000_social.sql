-- MiCine v3: puntajes y reseñas, perfiles públicos, conexiones (pareja / amigos) y listas en común.

-- Puntaje (1 a 5), reseña corta, fecha en que se vio y géneros (para el resumen).
alter table public.library add column if not exists rating smallint check (rating between 1 and 5);
alter table public.library add column if not exists review text check (char_length(review) <= 500);
alter table public.library add column if not exists watched_on date;
alter table public.library add column if not exists genres int[] not null default '{}';
update public.library set watched_on = created_at::date where status = 'watched' and watched_on is null;

alter table public.profiles add column if not exists is_public boolean not null default false;

-- Conexiones entre usuarios: una invitación que la otra persona acepta.
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null default auth.uid() references auth.users on delete cascade,
  addressee uuid not null references auth.users on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists connections_pair on public.connections (least(requester, addressee), greatest(requester, addressee));

alter table public.connections enable row level security;
create policy "ver mis conexiones" on public.connections
  for select using (auth.uid() in (requester, addressee));
create policy "invitar" on public.connections
  for insert with check (auth.uid() = requester and status = 'pending');
create policy "aceptar invitaciones" on public.connections
  for update using (auth.uid() = addressee) with check (auth.uid() = addressee);
create policy "borrar conexion" on public.connections
  for delete using (auth.uid() in (requester, addressee));

-- ¿Estas dos personas están conectadas? (security definer para usarla dentro de otras políticas)
create or replace function public.is_connected(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections c
    where c.status = 'accepted'
      and ((c.requester = a and c.addressee = b) or (c.requester = b and c.addressee = a))
  );
$$;

create or replace function public.in_connection(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.connections c
    where c.id = cid and c.status = 'accepted' and auth.uid() in (c.requester, c.addressee)
  );
$$;

-- La biblioteca y los actores seguidos se pueden ver si el perfil es público o si están conectados.
create policy "biblioteca visible" on public.library
  for select using (
    auth.uid() = user_id
    or public.is_connected(auth.uid(), user_id)
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );
create policy "actores visibles" on public.followed_people
  for select using (
    auth.uid() = user_id
    or public.is_connected(auth.uid(), user_id)
    or exists (select 1 from public.profiles p where p.id = user_id and p.is_public)
  );

-- Lista en común de cada conexión: lo que vieron juntos y lo que quieren ver juntos.
create table if not exists public.couple_items (
  connection_id uuid not null references public.connections on delete cascade,
  media_key text not null,
  status text not null check (status in ('watched', 'want')),
  tmdb_id int not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster text,
  year text,
  vote real,
  added_by uuid not null default auth.uid() references auth.users on delete cascade,
  watched_on date,
  created_at timestamptz not null default now(),
  primary key (connection_id, media_key)
);

alter table public.couple_items enable row level security;
create policy "lista en comun" on public.couple_items
  for all using (public.in_connection(connection_id)) with check (public.in_connection(connection_id));

grant select, insert, update, delete on public.connections to authenticated;
grant select, insert, update, delete on public.couple_items to authenticated;
grant execute on function public.is_connected(uuid, uuid) to anon, authenticated;
grant execute on function public.in_connection(uuid) to authenticated;
