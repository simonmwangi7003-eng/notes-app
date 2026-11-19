-- =====================================================================
--  JOTBOOK – Supabase / PostgreSQL schema
--  Run this whole file once in:  Supabase Dashboard → SQL Editor → New query
--  It is idempotent: running it again is safe.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text,
  full_name     text,
  role          text not null default 'user' check (role in ('user', 'admin')),
  is_suspended  boolean not null default false,
  created_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 60),
  created_at  timestamptz not null default now()
);

create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  folder_id    uuid references public.folders(id) on delete set null,
  title        text not null default '',
  content      text not null default '',
  color        text not null default 'default',
  tags         text[] not null default '{}',
  is_pinned    boolean not null default false,
  is_favorite  boolean not null default false,
  is_archived  boolean not null default false,
  deleted_at   timestamptz,                         -- soft delete (Trash)
  is_shared    boolean not null default false,
  share_token  uuid not null unique default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index if not exists notes_folder_idx       on public.notes (folder_id);
create index if not exists notes_tags_idx         on public.notes using gin (tags);
create index if not exists folders_user_idx       on public.folders (user_id);

-- ---------------------------------------------------------------------
-- 2. HELPER FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_suspended()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_suspended from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- Create a profile row automatically for every new auth user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Back-fill profiles for users that already existed before this script
insert into public.profiles (id, email, full_name)
select id, email, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

-- Users must never be able to promote themselves or un-suspend themselves
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id           := old.id;
    new.email        := old.email;
    new.role         := old.role;
    new.is_suspended := old.is_suspended;
    new.created_at   := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ---------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.folders  enable row level security;
alter table public.notes    enable row level security;

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "folders_owner" on public.folders;
create policy "folders_owner" on public.folders for all
  using (auth.uid() = user_id and not public.is_suspended())
  with check (auth.uid() = user_id and not public.is_suspended());

-- NOTE: admins can NOT read note contents. They only get aggregate numbers
-- through the admin_* functions below (privacy by design).
drop policy if exists "notes_owner" on public.notes;
create policy "notes_owner" on public.notes for all
  using (auth.uid() = user_id and not public.is_suspended())
  with check (auth.uid() = user_id and not public.is_suspended());

-- ---------------------------------------------------------------------
-- 4. USER-FACING RPC FUNCTIONS
-- ---------------------------------------------------------------------
create or replace function public.touch_last_seen()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  delete from auth.users where id = auth.uid();   -- cascades to profile, notes, folders
end $$;

-- Public read access to a note that its owner chose to share
create or replace function public.get_shared_note(p_token uuid)
returns table (title text, content text, color text, tags text[], updated_at timestamptz, author text)
language sql security definer stable set search_path = public as $$
  select n.title, n.content, n.color, n.tags, n.updated_at, coalesce(p.full_name, 'Anonymous')
  from public.notes n
  left join public.profiles p on p.id = n.user_id
  where n.share_token = p_token and n.is_shared and n.deleted_at is null;
$$;

-- ---------------------------------------------------------------------
-- 5. ADMIN RPC FUNCTIONS (all check is_admin())
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns json language plpgsql security definer stable set search_path = public as $$
declare result json;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select json_build_object(
    'total_users',      (select count(*) from profiles),
    'admins',           (select count(*) from profiles where role = 'admin'),
    'suspended_users',  (select count(*) from profiles where is_suspended),
    'new_users_today',  (select count(*) from profiles where created_at >= date_trunc('day', now())),
    'new_users_7d',     (select count(*) from profiles where created_at > now() - interval '7 days'),
    'active_users_24h', (select count(*) from profiles where last_seen_at > now() - interval '24 hours'),
    'active_users_7d',  (select count(*) from profiles where last_seen_at > now() - interval '7 days'),
    'total_notes',      (select count(*) from notes where deleted_at is null),
    'notes_today',      (select count(*) from notes where created_at >= date_trunc('day', now())),
    'notes_7d',         (select count(*) from notes where created_at > now() - interval '7 days'),
    'archived_notes',   (select count(*) from notes where is_archived and deleted_at is null),
    'trashed_notes',    (select count(*) from notes where deleted_at is not null),
    'pinned_notes',     (select count(*) from notes where is_pinned and deleted_at is null),
    'favorite_notes',   (select count(*) from notes where is_favorite and deleted_at is null),
    'shared_notes',     (select count(*) from notes where is_shared and deleted_at is null),
    'total_folders',    (select count(*) from folders),
    'total_characters', (select coalesce(sum(length(content)), 0) from notes where deleted_at is null),
    'avg_notes_per_user', (select round(count(*)::numeric / greatest((select count(*) from profiles), 1), 1)
                           from notes where deleted_at is null)
  ) into result;
  return result;
end $$;

create or replace function public.admin_timeseries(p_days int default 30)
returns table (day date, new_users bigint, new_notes bigint)
language sql security definer stable set search_path = public as $$
  select d::date,
         (select count(*) from profiles p where p.created_at::date = d::date),
         (select count(*) from notes n    where n.created_at::date = d::date)
  from generate_series(current_date - (greatest(p_days, 1) - 1), current_date, interval '1 day') d
  where public.is_admin()
  order by 1;
$$;

create or replace function public.admin_users()
returns table (id uuid, email text, full_name text, role text, is_suspended boolean,
               created_at timestamptz, last_seen_at timestamptz, note_count bigint, folder_count bigint)
language sql security definer stable set search_path = public as $$
  select p.id, p.email, p.full_name, p.role, p.is_suspended, p.created_at, p.last_seen_at,
         (select count(*) from notes n   where n.user_id = p.id and n.deleted_at is null),
         (select count(*) from folders f where f.user_id = p.id)
  from profiles p
  where public.is_admin()
  order by p.created_at desc;
$$;

create or replace function public.admin_top_tags()
returns table (tag text, uses bigint)
language sql security definer stable set search_path = public as $$
  select t, count(*)
  from notes n, unnest(n.tags) t
  where n.deleted_at is null and public.is_admin()
  group by t order by 2 desc, 1 limit 10;
$$;

create or replace function public.admin_set_role(target uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'You cannot change your own role'; end if;
  if new_role not in ('user', 'admin') then raise exception 'invalid role'; end if;
  update public.profiles set role = new_role where id = target;
end $$;

create or replace function public.admin_set_suspended(target uuid, suspended boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'You cannot suspend yourself'; end if;
  update public.profiles set is_suspended = suspended where id = target;
end $$;

create or replace function public.admin_delete_user(target uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if target = auth.uid() then raise exception 'You cannot delete yourself'; end if;
  delete from auth.users where id = target;
end $$;

-- ---------------------------------------------------------------------
-- 6. FUNCTION PERMISSIONS
-- ---------------------------------------------------------------------
revoke execute on function public.admin_stats()                      from public, anon;
revoke execute on function public.admin_timeseries(int)              from public, anon;
revoke execute on function public.admin_users()                      from public, anon;
revoke execute on function public.admin_top_tags()                   from public, anon;
revoke execute on function public.admin_set_role(uuid, text)         from public, anon;
revoke execute on function public.admin_set_suspended(uuid, boolean) from public, anon;
revoke execute on function public.admin_delete_user(uuid)            from public, anon;
revoke execute on function public.delete_my_account()                from public, anon;
revoke execute on function public.touch_last_seen()                  from public, anon;

grant execute on function public.admin_stats()                      to authenticated;
grant execute on function public.admin_timeseries(int)              to authenticated;
grant execute on function public.admin_users()                      to authenticated;
grant execute on function public.admin_top_tags()                   to authenticated;
grant execute on function public.admin_set_role(uuid, text)         to authenticated;
grant execute on function public.admin_set_suspended(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_user(uuid)            to authenticated;
grant execute on function public.delete_my_account()                to authenticated;
grant execute on function public.touch_last_seen()                  to authenticated;
grant execute on function public.get_shared_note(uuid)              to anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. REALTIME (live sync between devices)
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.notes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.folders;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 8. MAKE YOURSELF AN ADMIN
--    1) Sign up in the app with your email.
--    2) Replace the email below and run this statement:
--
--    update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------
