-- Тест патча контроля уроков. Запускает backend/test/check_sql.mjs поверх
-- legacy_setup.sql и patch_2026-10-16_control.sql. Каждый блок — от имени
-- своей роли: учитель, админ, клиент без входа. Упал assert — упал тест.
\set ON_ERROR_STOP on
\set QUIET on

select id as admin_id from auth.users where email = '77000000001@1eng.kz' \gset
select id as t1_id from auth.users where email = '77000000002@1eng.kz' \gset
select id as t2_id from auth.users where email = '77000000003@1eng.kz' \gset

-- ── 1. Старые галочки не потерялись ─────────────────────────────────────────
do $$ declare l record; begin
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000000';
  assert l.taught and l.review = 'paid' and l.done and l.done_at is not null,
    'старая галочка админа: урок проведён и к выплате';
  assert l.taught_on is not null, 'у старой галочки есть день урока';
end $$;

-- ── 2. Учитель ──────────────────────────────────────────────────────────────
set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false), set_config('request.jwt.claim.sub', :'t1_id', false);

do $$ declare r text; l record; n int; begin
  r := public.en_lesson_taught('aaaaaaaa-0000-0000-0000-000000000001', true);
  assert r = 'Готово', 'учитель отмечает свой прошедший урок: ' || r;
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert l.taught and l.taught_on = l.plan_date and l.taught_at is not null and not l.done,
    'отметка учителя — заявка, не деньги';

  for i in 2..5 loop
    perform public.en_lesson_taught(('aaaaaaaa-0000-0000-0000-00000000000' || i)::uuid, true);
  end loop;

  r := public.en_lesson_taught('aaaaaaaa-0000-0000-0000-000000000006', true);
  assert r = 'Урок ещё не наступил', 'будущий урок не отметить: ' || r;
  r := public.en_lesson_taught('bbbbbbbb-0000-0000-0000-000000000000', true);
  assert r = 'Урок не ваш', 'чужой урок не отметить: ' || r;
  r := public.en_lesson_taught('aaaaaaaa-0000-0000-0000-000000000000', false);
  assert r like 'Клиент уже ответил%', 'зачтённый урок не снять: ' || r;

  -- напрямую колонки контроля не пишутся
  begin
    update public.en_teacher_lessons set taught = true where id = 'aaaaaaaa-0000-0000-0000-000000000006';
    assert false, 'прямая запись taught должна падать';
  exception when insufficient_privilege then null; end;
  begin
    update public.en_teacher_lessons set client_answer = 'yes' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    assert false, 'прямая запись ответа клиента должна падать';
  exception when insufficient_privilege then null; end;
  update public.en_teacher_lessons set topic = 'Going To' where id = 'aaaaaaaa-0000-0000-0000-000000000006';
  assert (select topic from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000006') = 'Going To',
    'тему учитель правит как раньше';

  -- урок, вставленный «сразу проведённым и подтверждённым», приходит чистым
  insert into public.en_teacher_lessons (id, card_id, month, idx, topic, plan_date, taught, client_answer, review, done)
  values ('aaaaaaaa-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 2, 1, 'Липовый', current_date - 1,
          true, 'yes', 'paid', true);
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000009';
  assert not l.taught and l.client_answer is null and l.review is null and not l.done,
    'вставка учителя не может родить оплаченный урок';

  -- ставка, учитель карточки и удаление
  update public.en_teacher_students set rate = 9999, teacher_id = null, name = 'Аяжан К.'
   where id = '11111111-1111-1111-1111-111111111111';
  select rate, teacher_id, name into l from public.en_teacher_students where id = '11111111-1111-1111-1111-111111111111';
  assert l.rate is null and l.teacher_id = current_setting('request.jwt.claim.sub')::uuid and l.name = 'Аяжан К.',
    'учитель не поднимет ставку и не перевесит карточку, а имя поправит';
  update public.en_teachers set rate = 9999, bio = 'Новое резюме' where id = current_setting('request.jwt.claim.sub')::uuid;
  assert (select rate from public.en_teachers where id = current_setting('request.jwt.claim.sub')::uuid) = 1150,
    'свою ставку учитель не поднимет';
  delete from public.en_teacher_students where id = '11111111-1111-1111-1111-111111111111';
  get diagnostics n = row_count;
  assert n = 0, 'учитель не удалит карточку';
  delete from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  assert n = 0, 'учитель не удалит отмеченный урок';
  delete from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000009';
  get diagnostics n = row_count;
  assert n = 1, 'неотмеченный урок удалить можно';

  r := public.en_control_resolve(array['aaaaaaaa-0000-0000-0000-000000000001'::uuid], 'paid');
  assert r like 'Решает админ%', 'учитель сам себе не засчитает: ' || r;
  assert (select count(*) from public.en_confirm_requests) = 0, 'ссылки клиентов учителю не видны';
  begin
    perform public.en_confirm_open(current_date - 14, current_date - 1);
    assert false, 'учитель не открывает запросы';
  exception when raise_exception then null; end;
end $$;

-- ── 3. Админ открывает запросы ─────────────────────────────────────────────
select set_config('request.jwt.claim.sub', :'admin_id', false);
do $$ declare n int; begin
  n := public.en_confirm_open(current_date - 14, current_date - 1);
  assert n = 2, 'запросы двум карточкам с уроками в периоде: ' || n;
  n := public.en_confirm_open(current_date - 14, current_date - 1);
  assert n = 0, 'повторно запросы не дублируются';
  assert (select count(*) from public.en_confirm_requests where length(token) = 36) = 2, 'у каждого запроса ключ из 36 знаков';
end $$;
select token as tok from public.en_confirm_requests where card_id = '11111111-1111-1111-1111-111111111111' \gset
select token as tok2 from public.en_confirm_requests where card_id = '22222222-2222-2222-2222-222222222222' \gset

-- ── 4. Клиент без входа ─────────────────────────────────────────────────────
reset role;
set role anon;
select set_config('request.jwt.claim.role', 'anon', false), set_config('request.jwt.claim.sub', '', false);

do $$ begin
  assert (select count(*) from public.en_teacher_lessons) = 0, 'без входа уроки таблицей не читаются';
  assert public.en_confirm_get('нет-такого') is null, 'чужой ключ ничего не открывает';
  begin
    perform public.en_lesson_taught('aaaaaaaa-0000-0000-0000-000000000001', true);
    assert false, 'без входа отметку не поставить';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('t.tok', :'tok', false), set_config('t.tok2', :'tok2', false);
do $$ declare p jsonb; ids text[]; r text; begin
  p := public.en_confirm_get(current_setting('t.tok'));
  assert p->>'student' = 'Аяжан К.' and p->>'teacher' = 'Айгерім Нұрлан', 'клиент видит ученика и учителя';
  assert p::text not like '%7701%' and p::text not like '%1150%', 'ни номеров, ни денег наружу';
  select array_agg(x->>'id' order by x->>'date') into ids from jsonb_array_elements(p->'lessons') x;
  -- a0 зачтён (в периоде, если не старше 14 дней), a1..a5 отмечены, будущих нет
  assert array_length(ids, 1) >= 5, 'клиент видит уроки периода: ' || coalesce(array_length(ids, 1), 0);
  assert not exists (select 1 from jsonb_array_elements(p->'lessons') x where (x->>'date')::date >= current_date),
    'будущие уроки клиенту не показываются';

  r := public.en_confirm_answer(current_setting('t.tok'), jsonb_build_array(
    jsonb_build_object('id', 'aaaaaaaa-0000-0000-0000-000000000001', 'answer', 'yes', 'quality', 5),
    jsonb_build_object('id', 'aaaaaaaa-0000-0000-0000-000000000002', 'answer', 'no'),
    jsonb_build_object('id', 'aaaaaaaa-0000-0000-0000-000000000003', 'answer', 'unsure'),
    jsonb_build_object('id', 'aaaaaaaa-0000-0000-0000-000000000004', 'answer', 'yes', 'quality', 2),
    jsonb_build_object('id', 'aaaaaaaa-0000-0000-0000-000000000005', 'answer', 'yes'),
    jsonb_build_object('id', 'bbbbbbbb-0000-0000-0000-000000000000', 'answer', 'yes')   -- чужой урок
  ), 'Второго урока не было');
  assert r = 'ok', 'ответ клиента принят: ' || r;
  r := public.en_confirm_answer(current_setting('t.tok'), '[{"id":"не-uuid","answer":"yes"}]'::jsonb, null);
  assert r = 'Ответ не разобран', 'мусор в ответе не роняет базу: ' || r;
  r := public.en_confirm_answer('нет-такого', '[]'::jsonb, null);
  assert r = 'Ссылка устарела', 'чужой ключ ответа не принимает';
end $$;

reset role;
select set_config('request.jwt.claim.role', '', false);
do $$ declare l record; begin
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  assert l.done and l.client_quality = 5 and l.client_note is null, 'подтверждено с оценкой 5 — к выплате само';
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000002';
  assert not l.done and l.client_answer = 'no' and l.client_note = 'Второго урока не было', 'спор не платится, слова клиента на уроке';
  assert not (select done from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000003'), '«не уверен» не платится';
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000004';
  assert not l.done and l.client_quality = 2, 'оценка 2 не платится';
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000005';
  assert l.done and l.client_quality = 5, 'подтверждено без оценки — 5 и к выплате';
  assert (select client_answer from public.en_teacher_lessons where id = 'bbbbbbbb-0000-0000-0000-000000000000') is null,
    'по чужой ссылке чужой урок не подтвердить';
  assert (select answered_at is not null and note = 'Второго урока не было'
            from public.en_confirm_requests where card_id = '11111111-1111-1111-1111-111111111111'), 'запрос помечен отвеченным';
end $$;

-- ── 5. После ответа учитель отметку не трогает, админ решает ───────────────
set role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', false), set_config('request.jwt.claim.sub', :'t1_id', false);
do $$ declare r text; begin
  r := public.en_lesson_taught('aaaaaaaa-0000-0000-0000-000000000002', false);
  assert r like 'Клиент уже ответил%', 'спорную отметку учитель не снимет: ' || r;
end $$;

select set_config('request.jwt.claim.sub', :'admin_id', false);
do $$ declare r text; l record; begin
  r := public.en_control_resolve(array['aaaaaaaa-0000-0000-0000-000000000002'::uuid], 'paid', 'перенос подтвердил учитель');
  assert r = 'Готово', r;
  assert (select done from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000002'), 'спор в пользу урока — к выплате';
  r := public.en_control_resolve(array['aaaaaaaa-0000-0000-0000-000000000004'::uuid], 'void');
  assert not (select done from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000004'), 'снято — не платится';
  r := public.en_control_resolve(array['aaaaaaaa-0000-0000-0000-000000000004'::uuid], 'reopen');
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000004';
  assert l.review is null and not l.done, 'вернули в очередь — снова по правилу';
  -- галочка кабинета учителя у админа = решение
  r := public.en_lesson_check('aaaaaaaa-0000-0000-0000-000000000006', true);
  select * into l from public.en_teacher_lessons where id = 'aaaaaaaa-0000-0000-0000-000000000006';
  assert l.done and l.taught and l.review = 'paid', 'галочка админа засчитывает урок';
  assert (select count(*) from public.en_confirm_requests) = 2, 'админ видит запросы';
end $$;

-- ── 6. Правило выплаты: та же таблица, что в app/control.js ────────────────
reset role;
select set_config('request.jwt.claim.role', '', false), set_config('request.jwt.claim.sub', '', false);
create temp table cases (n int, taught boolean, answer text, quality smallint, review text, want boolean);
insert into cases values
  (1,  true,  'yes',    5,    null,   true),
  (2,  true,  'yes',    null, null,   true),
  (3,  true,  'yes',    3,    null,   true),
  (4,  true,  'yes',    2,    null,   false),
  (5,  true,  'no',     null, null,   false),
  (6,  true,  'unsure', null, null,   false),
  (7,  true,  null,     null, null,   false),
  (8,  false, 'yes',    5,    null,   false),
  (9,  false, 'no',     null, null,   false),
  (10, false, null,     null, null,   false),
  (11, true,  'no',     null, 'paid', true),
  (12, false, 'yes',    null, 'paid', true),
  (13, true,  'yes',    5,    'void', false);
do $$ declare c record; got boolean; begin
  for c in select * from cases order by n loop
    insert into public.en_teacher_lessons (card_id, month, idx, plan_date, taught, client_answer, client_quality, review)
    values ('22222222-2222-2222-2222-222222222222', 9, c.n, current_date - 1, c.taught, c.answer, c.quality, c.review)
    returning done into got;
    assert got = c.want, 'правило выплаты, случай ' || c.n;
  end loop;
end $$;

\echo 'sql ok: старые галочки, учитель, админ, клиент без входа, правило выплаты — 13 случаев'
