-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · минимальная схема: профиль ученика и его прогресс
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Скрипт можно запускать повторно: он ничего не удаляет и не дублирует.
--
-- ЗАЧЕМ ОТДЕЛЬНЫЙ ФАЙЛ, если есть schema.sql. Тот файл — полная схема на
-- вырост: группы, ұстаз, банк вопросов, проверка ответов на сервере. Здесь
-- ровно два стола, которые нужны прямо сейчас: кто вошёл и что он прошёл.
--
-- ГЛАВНОЕ ПРО ДОСТУП. Платформа — статические файлы, её anon-ключ виден
-- любому, кто откроет исходник страницы. Так и задумано: ключ ничего не
-- открывает сам по себе, вся защита живёт в правилах RLS ниже. Ученик
-- читает и пишет только свои строки, чужие для него не существуют.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Профиль ученика ─────────────────────────────────────────────────────
-- Строка появляется сразу после входа. Вход по номеру телефона: номер
-- превращается в технический адрес 77001234567@1eng.kz, потому что вход по
-- SMS в Supabase требует платного провайдера. Настоящий номер лежит здесь.

create table if not exists public.en_students (
  id         uuid primary key references auth.users on delete cascade,
  phone      text not null,
  name       text check (length(name) <= 40),
  birth      date,
  gender     text check (gender in ('m','f')),
  level      text check (level in ('beginner','elementary','pre-intermediate','intermediate')),
  lang       text not null default 'ru'     check (lang  in ('ru','kk')),
  theme      text not null default 'system' check (theme in ('system','light','dark')),
  -- согласие на обработку персональных данных: когда нажал и какую версию
  -- текста видел. Без даты согласие ничего не значит.
  consent_at timestamptz,
  consent_v  text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table  public.en_students       is '1English: профиль ученика';
comment on column public.en_students.phone is 'Настоящий номер. Логин — производный от него адрес';


-- Если таблица уже была создана раньше, create table её не трогает. Поэтому
-- новые колонки добавляются отдельно: скрипт должен доводить до нужного вида
-- и старую базу, а не только пустую.
alter table public.en_students add column if not exists phone      text;
alter table public.en_students add column if not exists name       text;
alter table public.en_students add column if not exists birth      date;
alter table public.en_students add column if not exists gender     text;
alter table public.en_students add column if not exists level      text;
alter table public.en_students add column if not exists lang       text not null default 'ru';
alter table public.en_students add column if not exists theme      text not null default 'system';
alter table public.en_students add column if not exists consent_at timestamptz;
alter table public.en_students add column if not exists consent_v  text;


-- ── 2. Прогресс по шагам ───────────────────────────────────────────────────
-- Одна строка на «урок + шаг». Шагов пять: read (теория), prac (практика), text (чтение),
-- task (задание), words (словарь). У задания дополнительно счёт: сколько
-- верных из скольких.

create table if not exists public.en_progress (
  student_id  uuid not null references public.en_students on delete cascade,
  lesson      text not null check (length(lesson) between 2 and 8),
  step        text not null check (step in ('read','prac','text','task','words')),
  right_count int check (right_count >= 0),
  total_count int check (total_count >= 0),
  updated_at  timestamptz not null default now(),
  primary key (student_id, lesson, step)
);

create index if not exists en_progress_student_idx
  on public.en_progress (student_id, updated_at desc);


-- ── 3. updated_at сам себя проставляет ─────────────────────────────────────
-- Клиент может забыть, а по этому полю потом считается активность.

create or replace function public.en_touch()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists en_students_touch on public.en_students;
create trigger en_students_touch before update on public.en_students
  for each row execute function public.en_touch();

drop trigger if exists en_progress_touch on public.en_progress;
create trigger en_progress_touch before update on public.en_progress
  for each row execute function public.en_touch();


-- ── 4. Кто смотрит дашборд ─────────────────────────────────────────────────
-- Ученик видит только себя. Чтобы видеть всех, аккаунт должен лежать в этой
-- таблице. Номер сюда не пишется: здесь id пользователя из auth.users.
--
-- КАК ДОБАВИТЬ СЕБЯ.
--   1. Сначала войдите в платформу своим номером — без этого аккаунта нет.
--   2. Потом одной строкой, со своим номером в любом виде:
--
--        select public.en_make_admin('+7 701 123 45 67');
--
--      Функция сама найдёт id и ответит словами, что получилось.

create table if not exists public.en_admins (
  id         uuid primary key references auth.users on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- Ищет пользователя по номеру и кладёт его в en_admins.
-- security definer нужен, чтобы функция дотянулась до auth.users; сразу
-- после неё права на вызов отбираются у всех, кроме владельца базы —
-- иначе любой залогиненный сделал бы админом сам себя и увидел всех.
create or replace function public.en_make_admin(p_phone text)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_digits text;
  v_id     uuid;
begin
  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then v_digits := '7' || v_digits; end if;
  if length(v_digits) = 11 and left(v_digits, 1) = '8' then
    v_digits := '7' || substring(v_digits from 2);
  end if;
  if length(v_digits) <> 11 then
    return 'Не похоже на номер: ' || coalesce(p_phone, '');
  end if;

  select id into v_id from auth.users where email = v_digits || '@1eng.kz';
  if v_id is null then
    return 'Аккаунта с номером ' || v_digits || ' ещё нет. Сначала войдите в платформу этим номером.';
  end if;

  insert into public.en_admins (id, note) values (v_id, v_digits)
  on conflict (id) do nothing;
  return 'Готово: ' || v_digits || ' видит дашборд.';
end $$;

revoke execute on function public.en_make_admin(text) from public;
revoke execute on function public.en_make_admin(text) from anon, authenticated;

-- security definer: функция читает en_admins в обход RLS, иначе политика,
-- которая спрашивает «а он админ?», уходила бы в бесконечную рекурсию.
create or replace function public.en_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.en_admins where id = auth.uid());
$$;


-- ── 5. Правила доступа ─────────────────────────────────────────────────────
-- Без этого anon-ключ открыл бы базу любому. Включать обязательно.

alter table public.en_students enable row level security;
alter table public.en_progress enable row level security;
alter table public.en_admins   enable row level security;

-- старая политика «всё своё» заменяется на разделённые: писать — только своё,
-- читать — своё либо всё, если аккаунт в en_admins
drop policy if exists en_students_own    on public.en_students;
drop policy if exists en_students_read   on public.en_students;
drop policy if exists en_students_write  on public.en_students;
drop policy if exists en_students_update on public.en_students;

create policy en_students_read on public.en_students
  for select using (auth.uid() = id or public.en_is_admin());
create policy en_students_write on public.en_students
  for insert with check (auth.uid() = id);
create policy en_students_update on public.en_students
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists en_progress_own    on public.en_progress;
drop policy if exists en_progress_read   on public.en_progress;
drop policy if exists en_progress_write  on public.en_progress;
drop policy if exists en_progress_update on public.en_progress;

create policy en_progress_read on public.en_progress
  for select using (auth.uid() = student_id or public.en_is_admin());
create policy en_progress_write on public.en_progress
  for insert with check (auth.uid() = student_id);
create policy en_progress_update on public.en_progress
  for update using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- удалять — только своё. Без этой политики кнопка «удалить мои данные»
-- молча ничего не делает: PostgREST вернёт 0 строк и код 204.
drop policy if exists en_students_delete on public.en_students;
create policy en_students_delete on public.en_students
  for delete using (auth.uid() = id);

drop policy if exists en_progress_delete on public.en_progress;
create policy en_progress_delete on public.en_progress
  for delete using (auth.uid() = student_id);

drop policy if exists en_admins_self on public.en_admins;
create policy en_admins_self on public.en_admins
  for select using (auth.uid() = id);


-- ── 6. «Удалить мои данные» ────────────────────────────────────────────────
-- Строки ученик может стереть и сам, а вот запись в auth.users — только
-- через функцию: удаление пользователей закрыто от браузера. Функция
-- трогает исключительно auth.uid(), то есть того, кто её вызвал, поэтому
-- отдать её залогиненным безопасно.

create or replace function public.en_delete_me()
returns text language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then return 'Не вошли'; end if;
  delete from public.en_progress where student_id = v_id;
  delete from public.en_students where id = v_id;
  delete from auth.users where id = v_id;
  return 'Удалено';
end $$;

revoke execute on function public.en_delete_me() from public, anon;
grant   execute on function public.en_delete_me() to authenticated;


-- ── 7. Кого вообще пускать ─────────────────────────────────────────────────
-- Пока таблица пуста — пускаем всех, это удобно на пробном этапе. Как только
-- в ней появится хоть один номер, писать в базу смогут только те, кто в
-- списке: чужой человек зарегистрируется, но данные его никуда не лягут.
--
-- Добавить ученика:   insert into public.en_allowed (phone, note)
--                     values ('77011234567', 'Айсұлтан') on conflict do nothing;
-- Выключить фильтр:   delete from public.en_allowed;

create table if not exists public.en_allowed (
  phone      text primary key,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.en_allowed enable row level security;

-- списком управляет дашборд, поэтому читать и править его может админ
drop policy if exists en_allowed_admin on public.en_allowed;
create policy en_allowed_admin on public.en_allowed
  for all using (public.en_is_admin()) with check (public.en_is_admin());

-- en_phone_ok идёт первой: тело SQL-функции Postgres проверяет при
-- создании, и en_am_i_allowed, заведённая раньше неё, роняла весь файл на
-- чистой базе — новую школу с нуля было не поднять.
create or replace function public.en_phone_ok()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select not exists (select 1 from public.en_allowed)
      or exists (
        select 1 from public.en_allowed a
        where a.phone = split_part((select email from auth.users where id = auth.uid()), '@', 1)
      );
$$;

-- ученику нужно знать одно: пускают его или нет. Строк он при этом не видит.
create or replace function public.en_am_i_allowed()
returns boolean language sql stable security definer set search_path = public, auth as $$
  select public.en_phone_ok();
$$;
grant execute on function public.en_am_i_allowed() to authenticated;

-- фильтр вешается на запись: читать своё пустое ученику не вредно
drop policy if exists en_students_write on public.en_students;
create policy en_students_write on public.en_students
  for insert with check (auth.uid() = id and public.en_phone_ok());

drop policy if exists en_progress_write on public.en_progress;
create policy en_progress_write on public.en_progress
  for insert with check (auth.uid() = student_id and public.en_phone_ok());


-- ── 8. Сброс кода ──────────────────────────────────────────────────────────
-- Ученик забыл шесть цифр — восстановить нечем: почты нет, SMS нет. Функция
-- ставит новый код вместо старого. Вызвать её может только админ, и только
-- через неё, потому что таблица auth.users из браузера закрыта наглухо.
--
-- Пароли GoTrue хранит хешем bcrypt, поэтому нужен pgcrypto.

create extension if not exists pgcrypto with schema extensions;

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


-- ── 8б. Завести ученика ────────────────────────────────────────────────────
-- Сам себя зарегистрировать никто не может: в Supabase → Authentication →
-- Sign In / Providers → Email надо снять «Allow new users to sign up».
-- После этого аккаунты появляются только отсюда.
--
--   select public.en_add_student('+7 701 123 45 67', '481902', 'Айсұлтан', 'beginner');
--
-- Номер и шесть цифр кода вы диктуете ученику сами. Заодно номер кладётся в
-- en_allowed, чтобы не делать это второй строкой. Уровень необязателен —
-- ученик выберет сам при первом входе.
--
-- В дашборде то же самое лежит в форме «Новый ученик», SQL руками не нужен.

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
-- старая трёхаргументная версия, если успели применить прошлый вариант
drop function if exists public.en_add_student(text, text, text);


-- ── 9. Ошибки платформы ────────────────────────────────────────────────────
-- Если у ученика что-то падает, об этом не знает никто: он просто закрывает
-- вкладку. Платформа пишет сюда, дашборд показывает последние.

create table if not exists public.en_errors (
  id         bigint generated always as identity primary key,
  student_id uuid references auth.users on delete set null,
  message    text not null check (length(message) <= 500),
  source     text check (length(source) <= 200),
  agent      text check (length(agent) <= 200),
  created_at timestamptz not null default now()
);
create index if not exists en_errors_time_idx on public.en_errors (created_at desc);

alter table public.en_errors enable row level security;

drop policy if exists en_errors_write on public.en_errors;
create policy en_errors_write on public.en_errors
  for insert with check (auth.uid() = student_id);

drop policy if exists en_errors_read on public.en_errors;
create policy en_errors_read on public.en_errors
  for select using (public.en_is_admin());



-- ── 9б. Номер цифрами и партии в играх ─────────────────────────────────────
-- То же, что в backend/patch_2026-09-13.sql: в уже работающую базу патч
-- применяется отдельным файлом, в пустую — приезжает вместе с этой схемой.

-- номер ученика хранится и проверяется цифрами

-- то, что уже лежит в базе, приводится к одному виду
update public.en_students
   set phone = regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g')
 where phone is distinct from regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g');

update public.en_students set phone = '7' || substring(phone from 2)
 where length(phone) = 11 and left(phone, 1) = '8';
update public.en_students set phone = '7' || phone
 where length(phone) = 10;

-- дальше номер нормализуется при каждой записи: клиент может прислать что
-- угодно, в таблицу ляжет только то, что нужно
create or replace function public.en_norm_phone()
returns trigger language plpgsql as $$
declare v text;
begin
  v := regexp_replace(coalesce(new.phone, ''), '[^0-9]', '', 'g');
  if length(v) = 10 then v := '7' || v; end if;
  if length(v) = 11 and left(v, 1) = '8' then v := '7' || substring(v from 2); end if;
  new.phone := left(v, 20);
  return new;
end $$;

drop trigger if exists en_students_phone on public.en_students;
create trigger en_students_phone before insert or update on public.en_students
  for each row execute function public.en_norm_phone();

-- и проверка поверх триггера: если триггер когда-нибудь снимут, поле всё
-- равно не примет ничего, кроме цифр
alter table public.en_students drop constraint if exists en_students_phone_digits;
alter table public.en_students add  constraint en_students_phone_digits
  check (phone ~ '^[0-9]{0,20}$');


-- партии в играх: одна строка на партию
-- Одна строка на партию. Счёт присылает браузер, и это нормально: цифра
-- нужна учителю как признак «ребёнок занимался», а не как оценка.

create table if not exists public.en_games (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.en_students on delete cascade,
  game        text not null check (length(game) <= 40),
  right_count int check (right_count >= 0),
  wrong_count int check (wrong_count >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists en_games_student_idx on public.en_games (student_id, created_at desc);
create index if not exists en_games_time_idx    on public.en_games (created_at desc);

alter table public.en_games enable row level security;

-- писать — только свои партии и только тем, кого пускают в группу
drop policy if exists en_games_write on public.en_games;
create policy en_games_write on public.en_games
  for insert with check (auth.uid() = student_id and public.en_phone_ok());

-- читать — свои; все видит только аккаунт из en_admins
drop policy if exists en_games_read on public.en_games;
create policy en_games_read on public.en_games
  for select using (auth.uid() = student_id or public.en_is_admin());

drop policy if exists en_games_delete on public.en_games;
create policy en_games_delete on public.en_games
  for delete using (auth.uid() = student_id);


-- «удалить мои данные» забирает и партии
-- Без этой правки кнопка в профиле оставляла бы за учеником хвост в en_games.

create or replace function public.en_delete_me()
returns text language plpgsql security definer set search_path = public, auth as $$
declare v_id uuid := auth.uid();
begin
  if v_id is null then return 'Не вошли'; end if;
  delete from public.en_games    where student_id = v_id;
  delete from public.en_progress where student_id = v_id;
  delete from public.en_students where id = v_id;
  delete from auth.users where id = v_id;
  return 'Удалено';
end $$;

revoke execute on function public.en_delete_me() from public, anon;
grant   execute on function public.en_delete_me() to authenticated;

-- ── 10. Проверка ───────────────────────────────────────────────────────────
-- После Run должно вернуться шесть строк, у всех rls_on = true.

select tablename, rowsecurity as rls_on
from pg_tables
where schemaname = 'public'
  and tablename in ('en_students','en_progress','en_admins','en_allowed','en_errors','en_games')
order by tablename;
