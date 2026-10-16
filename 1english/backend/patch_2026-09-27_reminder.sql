-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч от 27.09.2026 · напоминание об уроке
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- КАК ОТМЕНИТЬ.  drop function if exists public.en_my_schedule();
--
-- ЗАЧЕМ. Расписание ученика лежит в карточке у учителя (en_teacher_students:
-- дни и время), а читать карточки ученику нельзя — там ставка учителя и
-- заметки про него самого. Функция отдаёт ровно то, что нужно для
-- напоминания: учитель, дни, время и темы уроков, у которых стоит дата, на
-- ближайшую неделю. Ищет по номеру из логина, чужое не отдаёт.
--
-- Этим пользуется плашка «до урока» на главной и в уроках (app/app.js).
-- ═══════════════════════════════════════════════════════════════════════════

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
             'teacher', coalesce(t.name, 'учитель'),
             'format',  c.format,
             'days',    c.days,
             'time',    c.time_at,
             'planned', coalesce((
                select jsonb_agg(jsonb_build_object('date', l.plan_date, 'topic', l.topic)
                                 order by l.plan_date)
                  from public.en_teacher_lessons l
                 where l.card_id = c.id and not l.done
                   and l.plan_date between v_today and v_today + 7), '[]'::jsonb)))
      from public.en_teacher_students c
      join public.en_teachers t on t.id = c.teacher_id
     where not c.archived
       and regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') in
           (v_phone, '8' || substring(v_phone from 2), substring(v_phone from 2))
  ), '[]'::jsonb);
end $$;

revoke execute on function public.en_my_schedule() from public, anon;
grant   execute on function public.en_my_schedule() to authenticated;
