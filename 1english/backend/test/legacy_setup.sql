-- База «как до патча 16.10»: админ, два учителя, карточки и уроки, одна
-- старая галочка админа. На ней потом катится patch_2026-10-16_control.sql
-- и проверяется, что прежние выплаты не потерялись.

select public.en_add_student('+7 700 000 00 01', '111111', 'Админ');
select public.en_add_student('+7 700 000 00 02', '222222', 'Айгерім');
select public.en_add_student('+7 700 000 00 03', '333333', 'Дана');
select public.en_make_admin('77000000001');
select public.en_make_teacher('77000000002', 'Айгерім Нұрлан', 'IELTS', 1150, 'mon@18:00,wed@18:00');
select public.en_make_teacher('77000000003', 'Дана Абылкасымова', 'B1+', 1400, 'tue@19:00');

insert into public.en_teacher_students (id, teacher_id, name, phone, days, time_at, rate, started_on)
select '11111111-1111-1111-1111-111111111111', id, 'Аяжан', '77011234567', 'mon,wed,fri', '18:00', null, current_date - 40
  from public.en_teachers where phone = '77000000002';
insert into public.en_teacher_students (id, teacher_id, name, phone, days, time_at, rate, started_on)
select '22222222-2222-2222-2222-222222222222', id, 'Тимур', '77029876543', 'tue,thu', '19:00', 1400, current_date - 40
  from public.en_teachers where phone = '77000000003';

-- Аяжан: шесть прошедших уроков и два будущих. a0 — старый, отмечен админом.
insert into public.en_teacher_lessons (id, card_id, month, idx, topic, plan_date)
select ('aaaaaaaa-0000-0000-0000-00000000000' || i)::uuid, '11111111-1111-1111-1111-111111111111', 1, i + 1,
       'Урок ' || (i + 1), current_date - (12 - i * 2)
  from generate_series(0, 5) i;
insert into public.en_teacher_lessons (id, card_id, month, idx, topic, plan_date) values
  ('aaaaaaaa-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 1, 7, 'Урок 7', current_date + 3),
  ('aaaaaaaa-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 1, 8, 'Урок 8', current_date + 5);
insert into public.en_teacher_lessons (id, card_id, month, idx, topic, plan_date) values
  ('bbbbbbbb-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 1, 1, 'Passive', current_date - 6);

-- Старая галочка: админ отметил урок a0 до патча.
select set_config('request.jwt.claim.role', 'authenticated', false),
       set_config('request.jwt.claim.sub', (select id::text from auth.users where email = '77000000001@1eng.kz'), false);
set role authenticated;
select public.en_lesson_check('aaaaaaaa-0000-0000-0000-000000000000', true);
reset role;
select set_config('request.jwt.claim.role', '', false), set_config('request.jwt.claim.sub', '', false);
