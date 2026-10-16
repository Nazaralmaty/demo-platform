-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 13.09.2026
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляется и не дублируется.
--
-- ЧТО ДЕЛАЕТ.
--   1. Номер ученика приводится к цифрам и держится цифрами. До этого в
--      en_students.phone лежали два вида одного номера: 77011234567 при входе
--      и «+7 (701) 123 45 67» после правки профиля. Сверять такое поле со
--      списком допущенных и с выгрузками нельзя.
--   2. В номер больше не попадают кавычки и угловые скобки. Строку ученик
--      правит сам, а дашборд рисует её у себя: номер вида
--      77011111111" onmouseover="…  выламывался из атрибута и исполнялся под
--      админским токеном. В браузере это уже закрыто экранированием, здесь —
--      второй замок, на стороне базы.
--   3. Заводится en_games: партии в играх. Шагов у урока три и других не
--      будет, поэтому игра лежит своей строкой, а не притворяется шагом.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Номер — только цифры ────────────────────────────────────────────────

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


-- ── 2. Партии в играх ──────────────────────────────────────────────────────
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


-- ── 3. «Удалить мои данные» забирает и партии ──────────────────────────────
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


-- ── 4. Проверка ────────────────────────────────────────────────────────────
-- После Run должно вернуться шесть строк, у всех rls_on = true.

select tablename, rowsecurity as rls_on
from pg_tables
where schemaname = 'public'
  and tablename in ('en_students','en_progress','en_admins','en_allowed','en_errors','en_games')
order by tablename;
