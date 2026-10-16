-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 14.09.2026
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно.
--
-- ЧТО ЧИНИТ.
--   1. Ученик, заведённый из дашборда, не мог войти: en_add_student клал в
--      auth.users NULL в confirmation_token и соседние поля, GoTrue на этом
--      отвечает 500 «Database error querying schema». Функция исправлена,
--      уже заведённые аккаунты чинятся здесь же.
--   2. Проверка «ты админ?» в en_add_student и en_reset_code не работала:
--      смотрела на current_user, а внутри security definer это всегда
--      postgres. Любой ученик мог сбросить код любому номеру, в том числе
--      админскому. Теперь проверка идёт по токену запроса.
--   3. В конце — список, кто на самом деле админ. Админом делает только
--      en_admins. en_allowed — это список учеников, которых пускают писать
--      в базу, прав на дашборд он не даёт.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Уже заведённые аккаунты ─────────────────────────────────────────────

update auth.users
   set confirmation_token     = coalesce(confirmation_token, ''),
       recovery_token         = coalesce(recovery_token, ''),
       email_change_token_new = coalesce(email_change_token_new, ''),
       email_change           = coalesce(email_change, '')
 where email like '%@1eng.kz'
   and (confirmation_token is null or recovery_token is null
        or email_change_token_new is null or email_change is null);


-- ── 2. Сброс кода ──────────────────────────────────────────────────────────

create or replace function public.en_reset_code(p_phone text, p_code text)
returns text language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_digits text;
  v_id     uuid;
begin
  -- Кто зовёт — смотрим по токену запроса. current_user здесь не годится:
  -- внутри security definer это всегда владелец функции (postgres), и
  -- проверка с ним молча пропускала любого залогиненного ученика — тот мог
  -- сбросить код админу и войти в дашборд. Из браузера роль в токене anon
  -- или authenticated; в SQL Editor токена нет, auth.role() пустой, и
  -- владельцу базы разрешаем без вопросов — иначе первого админа не завести.
  if auth.role() in ('anon', 'authenticated') and not public.en_is_admin() then
    return 'Только для аккаунта из en_admins';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then return 'Код — ровно шесть цифр'; end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then v_digits := '7' || v_digits; end if;
  if length(v_digits) = 11 and left(v_digits, 1) = '8' then
    v_digits := '7' || substring(v_digits from 2);
  end if;

  select id into v_id from auth.users where email = v_digits || '@1eng.kz';
  if v_id is null then return 'Такого номера нет'; end if;

  update auth.users
     set encrypted_password = extensions.crypt(p_code, extensions.gen_salt('bf', 10)),
         updated_at = now()
   where id = v_id;

  return 'Готово: ' || v_digits || ' входит с новым кодом';
end $$;

revoke execute on function public.en_reset_code(text, text) from public, anon;
grant   execute on function public.en_reset_code(text, text) to authenticated;


-- ── 3. Завести ученика ─────────────────────────────────────────────────────

create or replace function public.en_add_student(
  p_phone text, p_code text, p_name text default null, p_level text default null)
returns text language plpgsql security definer set search_path = public, auth, extensions as $$
declare
  v_digits text;
  v_id     uuid := gen_random_uuid();
  v_old    uuid;
  v_email  text;
begin
  -- Кто зовёт — смотрим по токену запроса. current_user здесь не годится:
  -- внутри security definer это всегда владелец функции (postgres), и
  -- проверка с ним молча пропускала любого залогиненного ученика — тот мог
  -- сбросить код админу и войти в дашборд. Из браузера роль в токене anon
  -- или authenticated; в SQL Editor токена нет, auth.role() пустой, и
  -- владельцу базы разрешаем без вопросов — иначе первого админа не завести.
  if auth.role() in ('anon', 'authenticated') and not public.en_is_admin() then
    return 'Только для аккаунта из en_admins';
  end if;
  if p_code is null or p_code !~ '^[0-9]{6}$' then return 'Код — ровно шесть цифр'; end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then v_digits := '7' || v_digits; end if;
  if length(v_digits) = 11 and left(v_digits, 1) = '8' then
    v_digits := '7' || substring(v_digits from 2);
  end if;
  if length(v_digits) <> 11 then return 'Не похоже на номер: ' || coalesce(p_phone, ''); end if;
  v_email := v_digits || '@1eng.kz';

  -- Аккаунт может уже существовать: до закрытия регистрации люди заводили
  -- себя сами. Если профиля при этом нет — платформой не пользовались, и
  -- такой аккаунт мы дозаводим: ставим продиктованный код и создаём строку.
  -- Если профиль есть, это живой ученик, и молча менять ему код нельзя.
  select id into v_old from auth.users where email = v_email;
  if v_old is not null then
    if exists (select 1 from public.en_students where id = v_old) then
      return 'Такой ученик уже есть. Новый код — кнопка «Сбросить код» в строке';
    end if;
    update auth.users
       set encrypted_password = extensions.crypt(p_code, extensions.gen_salt('bf', 10)),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           confirmation_token = coalesce(confirmation_token, ''),
           recovery_token = coalesce(recovery_token, ''),
           email_change_token_new = coalesce(email_change_token_new, ''),
           email_change = coalesce(email_change, ''),
           updated_at = now()
     where id = v_old;
    -- у аккаунтов старого образца строки в identities может не быть вовсе
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) select gen_random_uuid(), v_old, v_old::text,
             jsonb_build_object('sub', v_old::text, 'email', v_email, 'email_verified', true),
             'email', now(), now(), now()
      where not exists (
        select 1 from auth.identities where user_id = v_old and provider = 'email');
    insert into public.en_students (id, phone, name, level)
      values (v_old, v_digits, nullif(p_name, ''), nullif(p_level, ''))
      on conflict (id) do update set phone = excluded.phone,
                                     name  = coalesce(excluded.name,  en_students.name),
                                     level = coalesce(excluded.level, en_students.level);
    insert into public.en_allowed (phone, note) values (v_digits, nullif(p_name, ''))
      on conflict do nothing;
    return 'Готово: ' || v_digits || ' входит с кодом ' || p_code || ' (аккаунт был заведён раньше)';
  end if;

  -- Токены — пустые строки, не NULL: на NULL в confirmation_token GoTrue
  -- падает при входе с 500 «Database error querying schema». Аккаунт при
  -- этом заведён, а ученик войти не может.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt(p_code, extensions.gen_salt('bf', 10)), now(),
    '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
  );

  -- без строки в identities GoTrue не считает пароль рабочим
  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  insert into public.en_students (id, phone, name, level)
    values (v_id, v_digits, nullif(p_name, ''), nullif(p_level, ''))
    on conflict (id) do nothing;
  insert into public.en_allowed (phone, note) values (v_digits, nullif(p_name, ''))
    on conflict do nothing;

  return 'Готово: ' || v_digits || ' входит с кодом ' || p_code;
end $$;

revoke execute on function public.en_add_student(text, text, text, text) from public, anon;
grant   execute on function public.en_add_student(text, text, text, text) to authenticated;


-- ── 4. Кто админ ───────────────────────────────────────────────────────────
-- Номера, которых нет в выдаче с admin = true, дашборд не откроют. Сделать
-- номер админом (аккаунт с этим номером должен уже существовать):
--
--   select public.en_make_admin('+7 701 123 45 67');

select split_part(u.email, '@', 1)                              as phone,
       exists (select 1 from public.en_admins x where x.id = u.id) as admin,
       exists (select 1 from public.en_allowed a
               where a.phone = split_part(u.email, '@', 1))       as allowed
from auth.users u
where u.email like '%@1eng.kz'
order by admin desc, phone;
