-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 29.09.2026 · график ученика без учителя
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляет и не дублирует.
--
-- ЗАЧЕМ. Учителей подключаем позже, а график ученику нужен уже сейчас: по
-- нему в платформе висит плашка «скоро урок». Поэтому карточка ученика
-- (en_teacher_students) теперь заводится и без учителя: дни, время,
-- анкета. Учителя ставят потом в дашборде, «Изменить» → «Учитель».
--
-- Карточку без учителя видит и правит только админ: правило RLS
-- «teacher_id = auth.uid() or en_is_admin()» для пустого учителя
-- пропускает одного админа. В кабинет учителя она не попадает — кабинет
-- берёт карточки по teacher_id.
--
-- en_my_schedule() теперь отдаёт график и без учителя, а имени учителя
-- и тем уроков в ответе больше нет: плашка их не показывает.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.en_teacher_students alter column teacher_id drop not null;

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
                 where l.card_id = c.id and not l.done
                   and l.plan_date between v_today and v_today + 7), '[]'::jsonb)))
      from public.en_teacher_students c
     where not c.archived
       and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') in
           (v_phone, '8' || substring(v_phone from 2), substring(v_phone from 2))
  ), '[]'::jsonb);
end $$;

revoke execute on function public.en_my_schedule() from public, anon;
grant   execute on function public.en_my_schedule() to authenticated;

-- проверка: is_nullable должно быть YES
select column_name, is_nullable from information_schema.columns
 where table_schema = 'public' and table_name = 'en_teacher_students' and column_name = 'teacher_id';
