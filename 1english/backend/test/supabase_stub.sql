-- Заглушка Supabase для локальной проверки схемы в обычном Postgres 16.
-- Ровно то, на что опираются наши файлы: роли anon/authenticated, схема
-- auth с users и identities, auth.uid() и auth.role() из «токена»
-- (настройки request.jwt.claim.*), pgcrypto в схеме extensions и права
-- по умолчанию, как в Supabase: всё в public выдано anon и authenticated,
-- а закрывает доступ RLS.
--
-- Запрос «от имени» пользователя в тесте:
--   set role authenticated;
--   select set_config('request.jwt.claim.sub', '<uuid>', false),
--          set_config('request.jwt.claim.role', 'authenticated', false);

do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
end $$;

create schema if not exists auth;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists auth.users (
  instance_id uuid, id uuid primary key, aud text, role text, email text unique,
  encrypted_password text, email_confirmed_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text,
  raw_app_meta_data jsonb, raw_user_meta_data jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists auth.identities (
  id uuid primary key, user_id uuid references auth.users on delete cascade, provider_id text,
  identity_data jsonb, provider text, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.role', true), '') $$;

grant usage on schema public, auth, extensions to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
