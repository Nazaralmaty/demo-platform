-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 29.09.2026 · шаги «практика» и «чтение»
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляет и не дублирует.
--
-- ЗАЧЕМ. У урока теперь две секции: теория и практика. В практике два
-- новых шага: prac — «видеоурок практики посмотрел», text — «текст
-- прочитал» (чтение с флип-картами, есть у 14 уроков Beginner). Старое
-- правило в en_progress пускало только read, task и words, поэтому без
-- патча новые отметки остаются на телефоне ученика и в базу не доезжают:
-- ни дашборд, ни учитель их не увидят.
--
-- ПЕРЕНОС ПРОЙДЕННОГО. С новыми шагами у урока выросло число шагов, и
-- процент у всех упал бы. Поэтому кто до переделки прошёл урок целиком —
-- все шаги, которые у урока были (read, и task, и words, если они есть), —
-- получает новые шаги этого урока пройденными. Дата у них — дата
-- последнего шага ученика в этом уроке, а не сегодняшняя: иначе дашборд
-- показал бы, что все разом зашли сегодня.
--
-- Урок, пройденный не целиком, не трогается. Строки read, которые уже
-- лежат в базе, не меняются: теперь это шаг «теория».
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Новые шаги разрешены ────────────────────────────────────────────────
alter table public.en_progress drop constraint if exists en_progress_step_check;
alter table public.en_progress add constraint en_progress_step_check
  check (step in ('read','prac','text','task','words'));

-- ── 2. Пройденным целиком — новые шаги ─────────────────────────────────────
-- Урок, какие шаги у него были до переделки, какие добавились.
with need (lesson, old_steps, new_steps) as (values
  ('b1', array['read','task','words'], array['prac','text']),
  ('b2', array['read','task','words'], array['prac','text']),
  ('b3', array['read','task','words'], array['prac','text']),
  ('b4', array['read','task','words'], array['prac','text']),
  ('b5', array['read','task','words'], array['prac','text']),
  ('b6', array['read','task','words'], array['prac','text']),
  ('b7', array['read','task','words'], array['prac','text']),
  ('b8', array['read','task','words'], array['prac','text']),
  ('b9', array['read','task','words'], array['prac','text']),
  ('b10', array['read','task','words'], array['prac','text']),
  ('b11', array['read','task','words'], array['prac','text']),
  ('b12', array['read','task','words'], array['prac','text']),
  ('b13', array['read','task','words'], array['prac','text']),
  ('b14', array['read','task','words'], array['prac','text']),
  ('e1', array['read'], array['prac']),
  ('e2', array['read'], array['prac']),
  ('e3', array['read'], array['prac']),
  ('e4', array['read'], array['prac']),
  ('e5', array['read'], array['prac']),
  ('e6', array['read'], array['prac']),
  ('e7', array['read'], array['prac']),
  ('e8', array['read'], array['prac']),
  ('e9', array['read'], array['prac']),
  ('e10', array['read'], array['prac']),
  ('e11', array['read'], array['prac']),
  ('e12', array['read'], array['prac']),
  ('e13', array['read','task','words'], array['prac']),
  ('e14', array['read'], array['prac']),
  ('p1', array['read'], array['prac']),
  ('p2', array['read'], array['prac']),
  ('p3', array['read'], array['prac']),
  ('p4', array['read'], array['prac']),
  ('p5', array['read'], array['prac']),
  ('p6', array['read'], array['prac']),
  ('p7', array['read'], array['prac']),
  ('p8', array['read'], array['prac']),
  ('p9', array['read'], array['prac']),
  ('p10', array['read'], array['prac']),
  ('p11', array['read'], array['prac']),
  ('p12', array['read'], array['prac']),
  ('p13', array['read'], array['prac']),
  ('p14', array['read'], array['prac'])
),
full_done as (
  select p.student_id, n.lesson, n.new_steps, max(p.updated_at) as at
    from need n
    join public.en_progress p on p.lesson = n.lesson and p.step = any (n.old_steps)
   group by p.student_id, n.lesson, n.new_steps, n.old_steps
  having count(distinct p.step) = cardinality(n.old_steps)
)
insert into public.en_progress (student_id, lesson, step, updated_at)
select f.student_id, f.lesson, s.step, f.at
  from full_done f cross join unnest(f.new_steps) as s(step)
on conflict (student_id, lesson, step) do nothing;

-- ── 3. Проверка ────────────────────────────────────────────────────────────
-- Правило должно перечислять пять шагов; ниже — сколько строк каждого шага.
select pg_get_constraintdef(oid) as step_rule
  from pg_constraint
 where conrelid = 'public.en_progress'::regclass and conname = 'en_progress_step_check';

select step, count(*) as rows from public.en_progress group by step order by step;
