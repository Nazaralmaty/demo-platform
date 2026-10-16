-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 20.09.2026 · кабинет учителя
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляет и не дублирует.
--
-- ЧТО ПОЯВЛЯЕТСЯ.
--   en_teachers          — учитель: имя, резюме, ставка за проведённый урок.
--   en_teacher_students  — карточка ученика у учителя: возраст, город, цель,
--                          уровень, формат, график, номер. Это НЕ аккаунт в
--                          платформе: ученик может в ней вообще не завестись.
--   en_teacher_lessons   — уроки этой карточки по месяцам обучения: тема,
--                          домашнее задание и галочка «проведён».
--
-- ГЛАВНОЕ ПРО ГАЛОЧКУ. Ставит её админ, а не учитель — иначе зарплата
-- считается по словам самого получателя. Поэтому колонка done закрыта от
-- записи из браузера правами на колонки, а меняется только функцией
-- en_lesson_check, и та сначала спрашивает en_is_admin().
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Учитель ─────────────────────────────────────────────────────────────
-- Аккаунт учителю заводится там же, где ученику: форма «Новый ученик» в
-- дашборде или select public.en_add_student(...). После этого номер
-- отмечается учителем:  select public.en_make_teacher('+7 701 123 45 67',
--                              'Айгерім', 'Резюме одной-двумя фразами');

create table if not exists public.en_teachers (
  id         uuid primary key references auth.users on delete cascade,
  name       text check (length(name) <= 60),
  bio        text check (length(bio) <= 2000),
  phone      text,
  -- ставка по умолчанию, ₸ за проведённый урок. 1150 — цена одного урока
  -- в 1English, от неё считается вся зарплата. В карточке ученика её можно
  -- перебить: индивид и группа стоят по-разному.
  rate       integer not null default 1150 check (rate >= 0),
  -- Рабочий график: когда учитель вообще готов вести. Список слотов через
  -- запятую, слот — «день@время»: 'mon@15:00,mon@16:00,wed@18:00'. Держим
  -- строкой, а не таблицей: график читается и пишется целиком, одним
  -- запросом, и отдельная таблица здесь только добавила бы джойн.
  -- Заполняет и правит его администратор.
  slots      text check (length(slots) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.en_teachers add column if not exists slots text;
alter table public.en_teachers alter column rate set default 1150;
update public.en_teachers set rate = 1150 where rate = 0;

drop trigger if exists en_teachers_touch on public.en_teachers;
create trigger en_teachers_touch before update on public.en_teachers
  for each row execute function public.en_touch();


-- ── 2. Карточка ученика у учителя ──────────────────────────────────────────
-- Связь с аккаунтом в платформе — по номеру, а не по id: карточку заводят
-- раньше, чем ученик первый раз войдёт, и ключ на несуществующую строку
-- пришлось бы чинить руками. Номер один и нормализован, этого хватает.

create table if not exists public.en_teacher_students (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.en_teachers on delete cascade,
  name       text not null check (length(name) between 1 and 60),
  age        smallint check (age between 3 and 99),
  city       text check (length(city) <= 40),
  goal       text check (length(goal) <= 300),   -- цель обучения
  level      text check (length(level) <= 40),   -- нынешний уровень
  format     text not null default 'individual' check (format in ('individual','group')),
  days       text check (length(days) <= 60),    -- 'mon,wed,fri'
  time_at    text check (length(time_at) <= 20), -- '18:00'
  phone      text check (length(phone) <= 20),
  note       text check (length(note) <= 2000),  -- описание ученика
  months     smallint not null default 1  check (months between 1 and 36),
  per_month  smallint not null default 12 check (per_month between 1 and 31),
  rate       integer check (rate >= 0),           -- null → ставка учителя (1150)
  started_on date not null default current_date,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists en_teacher_students_idx
  on public.en_teacher_students (teacher_id, archived, created_at);

drop trigger if exists en_teacher_students_touch on public.en_teacher_students;
create trigger en_teacher_students_touch before update on public.en_teacher_students
  for each row execute function public.en_touch();


-- ── 3. Уроки карточки ──────────────────────────────────────────────────────
-- Одна строка на «месяц обучения + номер урока в месяце». Строки заводит
-- учитель вместе с карточкой: 4 месяца по 12 уроков — 48 строк сразу, и
-- сетка видна заранее, а не появляется по мере проведения.

create table if not exists public.en_teacher_lessons (
  id        uuid primary key default gen_random_uuid(),
  card_id   uuid not null references public.en_teacher_students on delete cascade,
  month     smallint not null check (month between 1 and 36),
  idx       smallint not null check (idx between 1 and 31),
  topic     text check (length(topic) <= 500),
  homework  text check (length(homework) <= 2000),
  plan_date date,
  done      boolean not null default false,
  done_at   timestamptz,
  unique (card_id, month, idx)
);

create index if not exists en_teacher_lessons_idx
  on public.en_teacher_lessons (card_id, month, idx);


-- ── 4. Кто что видит ───────────────────────────────────────────────────────

alter table public.en_teachers         enable row level security;
alter table public.en_teacher_students enable row level security;
alter table public.en_teacher_lessons  enable row level security;

-- Учитель видит и правит только себя; админ — всех.
drop policy if exists en_teachers_read   on public.en_teachers;
drop policy if exists en_teachers_update on public.en_teachers;
create policy en_teachers_read on public.en_teachers
  for select using (auth.uid() = id or public.en_is_admin());
create policy en_teachers_update on public.en_teachers
  for update using (auth.uid() = id or public.en_is_admin())
          with check (auth.uid() = id or public.en_is_admin());

-- Карточки: свои у учителя, все у админа.
drop policy if exists en_teacher_students_all on public.en_teacher_students;
create policy en_teacher_students_all on public.en_teacher_students
  for all using      (teacher_id = auth.uid() or public.en_is_admin())
          with check (teacher_id = auth.uid() or public.en_is_admin());

-- Уроки наследуют право от карточки. security definer — иначе политика на
-- уроках читала бы en_teacher_students под своей же RLS и уходила в рекурсию.
create or replace function public.en_card_mine(p_card uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.en_teacher_students c
     where c.id = p_card and (c.teacher_id = auth.uid() or public.en_is_admin()));
$$;

drop policy if exists en_teacher_lessons_all on public.en_teacher_lessons;
create policy en_teacher_lessons_all on public.en_teacher_lessons
  for all using (public.en_card_mine(card_id)) with check (public.en_card_mine(card_id));

-- Галочку из браузера не поставить никому: права на колонку done не выданы.
-- Остальное учитель правит обычным PATCH.
grant select, insert, delete on public.en_teacher_lessons to authenticated;
revoke update on public.en_teacher_lessons from authenticated;
grant  update (topic, homework, plan_date) on public.en_teacher_lessons to authenticated;


-- ── 5. Отметить урок проведённым ───────────────────────────────────────────
-- Единственная дверь к колонке done. Зовёт её админ из того же кабинета:
-- у него галочки кликабельны, у учителя — нет.

create or replace function public.en_lesson_check(p_id uuid, p_done boolean)
returns text language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.en_is_admin() then
    return 'Галочку ставит админ: аккаунт из en_admins';
  end if;
  update public.en_teacher_lessons
     set done = coalesce(p_done, false),
         done_at = case when coalesce(p_done, false) then now() else null end
   where id = p_id;
  if not found then return 'Такого урока нет'; end if;
  return 'Готово';
end $$;

revoke execute on function public.en_lesson_check(uuid, boolean) from public, anon;
grant   execute on function public.en_lesson_check(uuid, boolean) to authenticated;


-- ── 6. Прогресс ученика в самой платформе ──────────────────────────────────
-- Кнопка «?» рядом с описанием ученика. Карточка и аккаунт связаны номером,
-- поэтому функция сама его нормализует и ищет. Учителю не выдаётся право
-- читать en_students целиком: он получает готовый ответ ровно по своему
-- ученику и ровно то, что нужно показать.

create or replace function public.en_student_progress(p_card uuid)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_phone  text;
  v_digits text;
  v_id     uuid;
  v_out    jsonb;
begin
  select phone into v_phone from public.en_teacher_students
   where id = p_card and (teacher_id = auth.uid() or public.en_is_admin());
  if not found then return jsonb_build_object('error', 'Карточка не ваша'); end if;

  v_digits := regexp_replace(coalesce(v_phone, ''), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then v_digits := '7' || v_digits; end if;
  if length(v_digits) = 11 and left(v_digits, 1) = '8' then
    v_digits := '7' || substring(v_digits from 2);
  end if;

  select id into v_id from public.en_students where phone = v_digits;
  if v_id is null then
    return jsonb_build_object('linked', false);
  end if;

  select jsonb_build_object(
           'linked', true,
           'name',   s.name,
           'level',  s.level,
           'last',   s.updated_at,
           'steps',  coalesce((select count(*) from public.en_progress p
                                where p.student_id = v_id), 0),
           'lessons', coalesce((select jsonb_agg(jsonb_build_object(
                                  'lesson', p.lesson, 'step', p.step,
                                  'right', p.right_count, 'total', p.total_count,
                                  'at', p.updated_at) order by p.updated_at desc)
                                from public.en_progress p where p.student_id = v_id), '[]'::jsonb))
    into v_out
    from public.en_students s where s.id = v_id;
  return v_out;
end $$;

revoke execute on function public.en_student_progress(uuid) from public, anon;
grant   execute on function public.en_student_progress(uuid) to authenticated;


-- ── 7. Завести учителя ─────────────────────────────────────────────────────
-- Аккаунт (номер + код) уже должен существовать: его заводит форма «Новый
-- ученик» в дашборде. Здесь номер только помечается учителем.

create or replace function public.en_make_teacher(
  p_phone text, p_name text default null, p_bio text default null,
  p_rate integer default 1150, p_slots text default null)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_digits text;
  v_id     uuid;
begin
  if auth.role() in ('anon', 'authenticated') and not public.en_is_admin() then
    return 'Только для аккаунта из en_admins';
  end if;

  v_digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_digits) = 10 then v_digits := '7' || v_digits; end if;
  if length(v_digits) = 11 and left(v_digits, 1) = '8' then
    v_digits := '7' || substring(v_digits from 2);
  end if;
  if length(v_digits) <> 11 then return 'Не похоже на номер: ' || coalesce(p_phone, ''); end if;

  select id into v_id from auth.users where email = v_digits || '@1eng.kz';
  if v_id is null then
    return 'Аккаунта с номером ' || v_digits || ' ещё нет. Сначала заведите его формой «Новый ученик».';
  end if;

  insert into public.en_teachers (id, name, bio, phone, rate, slots)
    values (v_id, nullif(p_name, ''), nullif(p_bio, ''), v_digits,
            case when coalesce(p_rate, 0) > 0 then p_rate else 1150 end, nullif(p_slots, ''))
    on conflict (id) do update
      set name  = coalesce(nullif(excluded.name, ''), en_teachers.name),
          bio   = coalesce(nullif(excluded.bio, ''),  en_teachers.bio),
          rate  = case when excluded.rate > 0 then excluded.rate else en_teachers.rate end,
          slots = coalesce(nullif(excluded.slots, ''), en_teachers.slots);

  return 'Готово: ' || v_digits || ' открывает teacher.html';
end $$;

revoke execute on function public.en_make_teacher(text, text, text, integer, text) from public, anon;
grant   execute on function public.en_make_teacher(text, text, text, integer, text) to authenticated;
-- версия без графика, если успели применить прошлый вариант патча
drop function if exists public.en_make_teacher(text, text, text, integer);


-- ── 8. Кто сейчас учитель ──────────────────────────────────────────────────
select t.phone, t.name, t.rate, t.slots,
       (select count(*) from public.en_teacher_students c where c.teacher_id = t.id) as cards
  from public.en_teachers t order by t.created_at;
