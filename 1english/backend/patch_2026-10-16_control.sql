-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 16.10.2026 · контроль уроков и зарплата
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляет и не дублирует. Нужны все
-- прошлые патчи (кабинет учителя — patch_2026-09-20_teacher.sql).
--
-- ЧТО МЕНЯЕТСЯ.
--   Раньше галочку «урок проведён» ставил только админ, и от неё считалась
--   зарплата. Теперь урок проходит три шага:
--
--     1. Учитель отмечает урок проведённым (taught). Это заявка, не деньги.
--     2. Два раза в месяц, за 1–15 и за 16–конец, клиенту уходит ссылка.
--        Он отвечает по каждому уроку: был / не было / не уверен, и
--        ставит оценку 1–5. Без входа: ссылка сама и есть ключ.
--     3. Подтверждённое клиентом с оценкой 3–5 становится done само —
--        и уходит в зарплату. Спор, сомнение, оценка 1–2, молчание и
--        подозрительные отметки решает администратор (review).
--
--   done по-прежнему значит «к выплате», и дашборд со сводной считают от
--   него как раньше. Только ставит его теперь не рука, а правило:
--
--     review = 'paid'                                     → done
--     review = 'void'                                     → не done
--     taught и клиент 'yes' и оценка не ниже 3 (или нет)  → done
--
--   То же правило — в app/control.js (CTRL.payable), и тест
--   backend/test/control_test.sql сверяет их на одной таблице случаев.
--
-- СТАРЫЕ ГАЛОЧКИ. Всё, что админ отметил до патча, остаётся к выплате:
-- такие уроки становятся taught с решением review = 'paid'.
--
-- ЗАЩИТА ОТ ПРИПИСОК.
--   • taught, ответы клиента и решения админа из браузера напрямую не
--     пишутся — только функциями ниже, и каждая проверяет, кто зовёт.
--   • Отметку, на которую клиент уже ответил, учитель не снимет и не
--     поставит заново. Урок в будущем отметить нельзя.
--   • Учитель не может поднять себе ставку, перевесить или удалить
--     карточку, удалить отмеченный урок или вставить урок сразу
--     «проведённым и подтверждённым».
--   • Ссылки клиентов видит только админ: учитель, знающий ссылку, мог бы
--     ответить за клиента.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Урок: отметка учителя, ответ клиента, решение админа ────────────────

alter table public.en_teacher_lessons
  add column if not exists taught         boolean not null default false,
  add column if not exists taught_on      date,          -- день урока по словам учителя
  add column if not exists taught_at      timestamptz,   -- когда учитель поставил отметку
  add column if not exists client_answer  text check (client_answer in ('yes', 'no', 'unsure')),
  add column if not exists client_quality smallint check (client_quality between 1 and 5),
  add column if not exists client_note    text check (length(client_note) <= 1000),
  add column if not exists client_at      timestamptz,
  add column if not exists review         text check (review in ('paid', 'void')),
  add column if not exists review_note    text check (length(review_note) <= 500),
  add column if not exists review_at      timestamptz;

create index if not exists en_teacher_lessons_day_idx
  on public.en_teacher_lessons (coalesce(taught_on, plan_date));

-- Оплата клиента: план и «оплачено до». У индивидуальных учеников она у
-- всех своя, и раньше это жило в голове администратора.
alter table public.en_teacher_students
  add column if not exists pay_plan   text check (pay_plan in ('month', 'two_weeks', 'lessons8', 'other')),
  add column if not exists paid_until date;


-- ── 2. Старые галочки админа — к выплате, как и были ───────────────────────
-- Только один раз: повторный запуск их уже не находит (taught = true).

update public.en_teacher_lessons
   set taught      = true,
       taught_on   = coalesce(taught_on, (done_at at time zone 'Asia/Almaty')::date, plan_date),
       taught_at   = coalesce(taught_at, done_at),
       review      = coalesce(review, 'paid'),
       review_note = coalesce(review_note, 'отмечено администратором до контроля уроков'),
       review_at   = coalesce(review_at, done_at)
 where done and not taught;


-- ── 3. Кто правит что: триггеры ────────────────────────────────────────────
-- «Не админ» здесь — запрос из браузера с токеном anon или authenticated
-- без строки в en_admins. Функции ниже работают от владельца базы, но
-- auth.uid() внутри них — того, кто их позвал.

create or replace function public.en_is_staff_call()
returns boolean language sql stable as $$
  select coalesce(auth.role(), '') not in ('anon', 'authenticated') or public.en_is_admin();
$$;

-- Урок: done считается правилом, а не ставится руками. Вставленный не
-- админом урок всегда начинается с чистого листа.
create or replace function public.en_lesson_settle()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' and not public.en_is_staff_call() then
    new.taught := false;  new.taught_on := null; new.taught_at := null;
    new.client_answer := null; new.client_quality := null; new.client_note := null; new.client_at := null;
    new.review := null; new.review_note := null; new.review_at := null;
  end if;

  new.done := case
    when new.review = 'paid' then true
    when new.review = 'void' then false
    -- coalesce обязателен: без ответа клиента «= 'yes'» даёт NULL, а не false
    else coalesce(new.taught, false) and coalesce(new.client_answer = 'yes', false)
         and coalesce(new.client_quality, 5) > 2
  end;
  if new.done and (tg_op = 'INSERT' or not old.done or old.done_at is null) then
    new.done_at := coalesce(case when tg_op = 'UPDATE' then old.done_at end, now());
  end if;
  if not new.done then new.done_at := null; end if;
  return new;
end $$;

drop trigger if exists en_lesson_settle on public.en_teacher_lessons;
create trigger en_lesson_settle before insert or update on public.en_teacher_lessons
  for each row execute function public.en_lesson_settle();

-- Карточка: ставку, учителя, оплату и архив меняет только админ. Учитель
-- правит в своей карточке всё остальное, как раньше.
create or replace function public.en_card_guard()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.en_is_staff_call() then
    new.rate := old.rate; new.teacher_id := old.teacher_id; new.archived := old.archived;
    new.pay_plan := old.pay_plan; new.paid_until := old.paid_until;
    new.months := old.months; new.per_month := old.per_month; new.started_on := old.started_on;
  end if;
  return new;
end $$;

drop trigger if exists en_card_guard on public.en_teacher_students;
create trigger en_card_guard before update on public.en_teacher_students
  for each row execute function public.en_card_guard();

-- Учитель: ставку и рабочие часы меняет админ.
create or replace function public.en_teacher_guard()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.en_is_staff_call() then
    new.rate := old.rate; new.slots := old.slots;
  end if;
  return new;
end $$;

drop trigger if exists en_teacher_guard on public.en_teachers;
create trigger en_teacher_guard before update on public.en_teachers
  for each row execute function public.en_teacher_guard();

-- Удалять карточки — только админу; уроки — только неотмеченные и без
-- ответа клиента. Ограничивающие политики складываются с прежними через И.
drop policy if exists en_teacher_students_del on public.en_teacher_students;
create policy en_teacher_students_del on public.en_teacher_students as restrictive
  for delete using (public.en_is_admin());

drop policy if exists en_teacher_lessons_del on public.en_teacher_lessons;
create policy en_teacher_lessons_del on public.en_teacher_lessons as restrictive
  for delete using (public.en_is_admin() or (not taught and client_answer is null and review is null));


-- ── 4. Запросы клиентам ────────────────────────────────────────────────────
-- Одна строка — один ученик за один период. token — ключ ссылки: 36
-- случайных шестнадцатеричных знаков, подобрать нельзя.

create table if not exists public.en_confirm_requests (
  id          uuid primary key default gen_random_uuid(),
  token       text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  card_id     uuid not null references public.en_teacher_students on delete cascade,
  period_from date not null,
  period_to   date not null,
  created_at  timestamptz not null default now(),
  sent_at     timestamptz,
  reminded_at timestamptz,
  answered_at timestamptz,
  note        text check (length(note) <= 1000),
  unique (card_id, period_from),
  check (period_to >= period_from)
);

alter table public.en_confirm_requests enable row level security;
drop policy if exists en_confirm_requests_admin on public.en_confirm_requests;
create policy en_confirm_requests_admin on public.en_confirm_requests
  for all using (public.en_is_admin()) with check (public.en_is_admin());


-- ── 5. Учитель: урок проведён ──────────────────────────────────────────────

create or replace function public.en_lesson_taught(p_id uuid, p_taught boolean, p_on date default null)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v   public.en_teacher_lessons%rowtype;
  v_today date := (now() at time zone 'Asia/Almaty')::date;
  v_day   date;
begin
  select l.* into v from public.en_teacher_lessons l
    join public.en_teacher_students c on c.id = l.card_id
   where l.id = p_id and (c.teacher_id = auth.uid() or public.en_is_admin());
  if not found then return 'Урок не ваш'; end if;
  if v.client_answer is not null or v.review is not null then
    return 'Клиент уже ответил по этому уроку — отметка закрыта';
  end if;
  v_day := coalesce(p_on, v.plan_date, v_today);
  if coalesce(p_taught, false) and v_day > v_today then return 'Урок ещё не наступил'; end if;

  update public.en_teacher_lessons
     set taught    = coalesce(p_taught, false),
         taught_on = case when coalesce(p_taught, false) then v_day end,
         taught_at = case when coalesce(p_taught, false) then now() end
   where id = p_id;
  return 'Готово';
end $$;

revoke execute on function public.en_lesson_taught(uuid, boolean, date) from public, anon;
grant   execute on function public.en_lesson_taught(uuid, boolean, date) to authenticated;


-- ── 6. Админ: галочка в кабинете и решения по очереди ──────────────────────
-- Старая галочка админа теперь — решение: поставил = «засчитать»,
-- снял = «не засчитывать». Кабинет учителя зовёт её как раньше.

create or replace function public.en_control_resolve(p_ids uuid[], p_how text, p_note text default null)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_today date := (now() at time zone 'Asia/Almaty')::date;
  v_n int;
begin
  if not public.en_is_admin() then return 'Решает админ: аккаунт из en_admins'; end if;
  if p_how not in ('paid', 'void', 'reopen') then return 'Не понял решение: ' || coalesce(p_how, ''); end if;

  update public.en_teacher_lessons
     set review      = case when p_how = 'reopen' then null else p_how end,
         review_note = case when p_how = 'reopen' then null else left(nullif(p_note, ''), 500) end,
         review_at   = case when p_how = 'reopen' then null else now() end,
         -- засчитанный урок без отметки учителя становится проведённым
         taught      = taught or p_how = 'paid',
         taught_on   = case when p_how = 'paid' and not taught then coalesce(taught_on, plan_date, v_today) else taught_on end,
         taught_at   = case when p_how = 'paid' and not taught then now() else taught_at end
   where id = any(p_ids);
  get diagnostics v_n = row_count;
  if v_n = 0 then return 'Таких уроков нет'; end if;
  return 'Готово';
end $$;

revoke execute on function public.en_control_resolve(uuid[], text, text) from public, anon;
grant   execute on function public.en_control_resolve(uuid[], text, text) to authenticated;

create or replace function public.en_lesson_check(p_id uuid, p_done boolean)
returns text language plpgsql security definer set search_path = public, auth as $$
begin
  return public.en_control_resolve(array[p_id],
    case when coalesce(p_done, false) then 'paid' else 'void' end,
    'галочка администратора');
end $$;

revoke execute on function public.en_lesson_check(uuid, boolean) from public, anon;
grant   execute on function public.en_lesson_check(uuid, boolean) to authenticated;


-- ── 7. Админ: открыть запросы за период ────────────────────────────────────
-- Каждой живой карточке с учителем, у которой в периоде есть отмеченный
-- урок или урок по плану, — строка запроса с ключом. Повторный вызов
-- ничего не дублирует. Отправляет админ из дашборда: кнопка открывает
-- WhatsApp с готовым текстом и ставит sent_at.

create or replace function public.en_confirm_open(p_from date, p_to date)
returns int language plpgsql security definer set search_path = public, auth as $$
declare v_n int;
begin
  if not public.en_is_admin() then raise exception 'Только для аккаунта из en_admins'; end if;
  insert into public.en_confirm_requests (card_id, period_from, period_to)
  select c.id, p_from, p_to
    from public.en_teacher_students c
   where not c.archived and c.teacher_id is not null
     and exists (select 1 from public.en_teacher_lessons l
                  where l.card_id = c.id
                    and (l.taught or l.plan_date is not null)
                    and coalesce(l.taught_on, l.plan_date) between p_from and p_to)
  on conflict (card_id, period_from) do nothing;
  get diagnostics v_n = row_count;
  return v_n;
end $$;

revoke execute on function public.en_confirm_open(date, date) from public, anon;
grant   execute on function public.en_confirm_open(date, date) to authenticated;


-- ── 8. Клиент: что показать по ссылке и принять ответ ──────────────────────
-- Без входа: роль anon. Ссылка живёт 45 дней. Наружу уходит только имя
-- ученика и учителя, даты и темы уроков — ни номеров, ни денег.

create or replace function public.en_confirm_get(p_token text)
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  r public.en_confirm_requests%rowtype;
  v_today date := (now() at time zone 'Asia/Almaty')::date;
begin
  select * into r from public.en_confirm_requests
   where token = p_token and created_at > now() - interval '45 days';
  if not found then return null; end if;

  return (
    select jsonb_build_object(
      'student', c.name,
      'teacher', t.name,
      'period', jsonb_build_object('from', r.period_from, 'to', r.period_to),
      'answered_at', r.answered_at,
      'note', r.note,
      'lessons', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', l.id, 'date', coalesce(l.taught_on, l.plan_date), 'topic', l.topic,
                 'taught', l.taught, 'answer', l.client_answer, 'quality', l.client_quality,
                 'locked', l.review is not null)
               order by coalesce(l.taught_on, l.plan_date), l.month, l.idx)
          from public.en_teacher_lessons l
         where l.card_id = c.id
           and coalesce(l.taught_on, l.plan_date) between r.period_from and r.period_to
           and (l.taught or l.client_answer is not null or l.plan_date < v_today)), '[]'::jsonb))
      from public.en_teacher_students c
      left join public.en_teachers t on t.id = c.teacher_id
     where c.id = r.card_id);
end $$;

revoke execute on function public.en_confirm_get(text) from public;
grant   execute on function public.en_confirm_get(text) to anon, authenticated;

-- p_answers: [{ "id": "<урок>", "answer": "yes|no|unsure", "quality": 1..5 }]
create or replace function public.en_confirm_answer(p_token text, p_answers jsonb, p_note text default null)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  r public.en_confirm_requests%rowtype;
  a jsonb;
  v_answer text;
  v_q smallint;
  v_note text := left(nullif(btrim(coalesce(p_note, '')), ''), 1000);
  v_n int := 0;
begin
  select * into r from public.en_confirm_requests
   where token = p_token and created_at > now() - interval '45 days';
  if not found then return 'Ссылка устарела'; end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) > 60 then return 'Ответ не разобран'; end if;

  for a in select * from jsonb_array_elements(p_answers) loop
    v_answer := a->>'answer';
    if v_answer not in ('yes', 'no', 'unsure') then continue; end if;
    v_q := case when v_answer = 'yes' then
             least(5, greatest(1, coalesce(nullif(a->>'quality', '')::smallint, 5))) end;
    update public.en_teacher_lessons l
       set client_answer  = v_answer,
           client_quality = v_q,
           -- комментарий — к периоду; на урок он ложится только там, где есть вопрос
           client_note    = case when v_answer <> 'yes' or v_q <= 2 then v_note end,
           client_at      = now()
     where l.id = (a->>'id')::uuid
       and l.card_id = r.card_id
       and l.review is null
       and coalesce(l.taught_on, l.plan_date) between r.period_from and r.period_to;
    if found then v_n := v_n + 1; end if;
  end loop;

  update public.en_confirm_requests set answered_at = now(), note = v_note where id = r.id;
  return 'ok';
exception when invalid_text_representation then
  return 'Ответ не разобран';
end $$;

revoke execute on function public.en_confirm_answer(text, jsonb, text) from public;
grant   execute on function public.en_confirm_answer(text, jsonb, text) to anon, authenticated;


-- ── 9. Плашка «скоро урок»: проведённый урок уже не «скоро» ───────────────

create or replace function public.en_my_schedule()
returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare
  v_phone text;
  v_today date := (now() at time zone 'Asia/Almaty')::date;
begin
  select split_part(email, '@', 1) into v_phone from auth.users where id = auth.uid();
  if v_phone is null or v_phone !~ '^[0-9]{11}$' then return '[]'::jsonb; end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
             'format',  c.format,
             'days',    c.days,
             'time',    c.time_at,
             'planned', coalesce((
                select jsonb_agg(jsonb_build_object('date', l.plan_date) order by l.plan_date)
                  from public.en_teacher_lessons l
                 where l.card_id = c.id and not l.done and not l.taught
                   and l.plan_date between v_today and v_today + 7), '[]'::jsonb)))
      from public.en_teacher_students c
     where not c.archived
       and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') in
           (v_phone, '8' || substring(v_phone from 2), substring(v_phone from 2))
  ), '[]'::jsonb);
end $$;

revoke execute on function public.en_my_schedule() from public, anon;
grant   execute on function public.en_my_schedule() to authenticated;


-- ── 10. Проверка: что получилось ──────────────────────────────────────────
select count(*) filter (where taught)                    as taught,
       count(*) filter (where done)                      as to_pay,
       count(*) filter (where review = 'paid')           as paid_by_admin,
       (select count(*) from public.en_confirm_requests) as requests
  from public.en_teacher_lessons;
