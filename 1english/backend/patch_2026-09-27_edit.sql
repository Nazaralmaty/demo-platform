-- ═══════════════════════════════════════════════════════════════════════════
-- 1English · патч к схеме от 27.09.2026 · правка ученика из дашборда
-- ═══════════════════════════════════════════════════════════════════════════
--
-- КАК ПРИМЕНИТЬ. Supabase → SQL Editor → New query → вставить целиком → Run.
-- Запускать можно повторно: ничего не удаляет и не дублирует.
--
-- ЗАЧЕМ. Ученика заводят в два захода: сначала имя, номер и код, через
-- день-два — учитель и график. Править в дашборде было нечего: строку
-- en_students по правилам RLS меняет только сам ученик, а номер — это ещё
-- и логин (77011234567@1eng.kz в auth.users). Опечатка в имени или номере
-- лечилась только новым аккаунтом.
--
-- ЧТО ДЕЛАЕТ en_edit_student. Меняет имя, уровень курса и номер. Номер
-- меняется везде, где он живёт, одной транзакцией:
--   auth.users.email       — по нему ученик входит;
--   auth.identities        — без этого GoTrue считает пароль чужим;
--   en_students.phone      — по нему дашборд и кабинет узнают ученика;
--   en_allowed             — иначе с новым номером прогресс не ляжет в базу;
--   en_teacher_students    — карточка у учителя связана с аккаунтом номером;
--   en_teachers.phone      — если это учитель.
-- Код входа не трогается: ученик входит новым номером и старым кодом.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.en_edit_student(
  p_id uuid, p_name text, p_phone text, p_level text default null)
returns text language plpgsql security definer set search_path = public, auth as $$
declare
  v_old    text;
  v_oldnm  text;
  v_new    text;
  v_name   text := btrim(coalesce(p_name, ''));
  v_level  text := nullif(btrim(coalesce(p_level, '')), '');
begin
  if auth.role() in ('anon', 'authenticated') and not public.en_is_admin() then
    return 'Только для аккаунта из en_admins';
  end if;

  select phone, name into v_old, v_oldnm from public.en_students where id = p_id;
  if not found then return 'Такого ученика нет'; end if;

  if v_name = '' then return 'Имя обязательно'; end if;
  if length(v_name) > 40 then return 'Имя длиннее 40 знаков'; end if;
  if v_level is not null
     and v_level not in ('beginner','elementary','pre-intermediate','intermediate') then
    return 'Нет такого уровня: ' || v_level;
  end if;

  v_new := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  if length(v_new) = 10 then v_new := '7' || v_new; end if;
  if length(v_new) = 11 and left(v_new, 1) = '8' then
    v_new := '7' || substring(v_new from 2);
  end if;
  if length(v_new) <> 11 or left(v_new, 1) <> '7' then
    return 'Не похоже на номер: ' || coalesce(p_phone, '');
  end if;

  if v_new <> coalesce(v_old, '') then
    -- номер занят другим аккаунтом — два человека с одним логином быть не могут
    if exists (select 1 from auth.users
                where email = v_new || '@1eng.kz' and id <> p_id) then
      return 'Номер ' || v_new || ' уже занят другим аккаунтом';
    end if;

    update auth.users
       set email = v_new || '@1eng.kz', updated_at = now()
     where id = p_id;
    update auth.identities
       set identity_data = coalesce(identity_data, '{}'::jsonb)
                           || jsonb_build_object('email', v_new || '@1eng.kz'),
           updated_at = now()
     where user_id = p_id and provider = 'email';

    if exists (select 1 from public.en_allowed where phone = v_old) then
      insert into public.en_allowed (phone, note)
        select v_new, note from public.en_allowed where phone = v_old
        on conflict (phone) do nothing;
      delete from public.en_allowed where phone = v_old;
    end if;

    update public.en_teachers set phone = v_new where id = p_id;
  end if;

  -- Карточки у учителей. Номер в них лежит как ввели (8 701…, 701…),
  -- поэтому ищем по всем трём видам и заодно приводим к одному. Имя
  -- правим, только если оно совпадало со старым: в карточку могли
  -- намеренно записать другое — имя ребёнка, а не родителя.
  if coalesce(v_old, '') <> '' then
    update public.en_teacher_students c
       set phone = v_new,
           name  = case when c.name = v_oldnm then v_name else c.name end
     where regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') in
           (v_old, '8' || substring(v_old from 2), substring(v_old from 2));
  end if;

  update public.en_students
     set name = v_name, level = v_level, phone = v_new
   where id = p_id;

  return 'Готово: ' || v_name || ', ' || v_new ||
         case when v_new <> coalesce(v_old, '') then '. Входит новым номером и старым кодом' else '' end;
end $$;

revoke execute on function public.en_edit_student(uuid, text, text, text) from public, anon;
grant   execute on function public.en_edit_student(uuid, text, text, text) to authenticated;


-- ── Номер в профиле = номер, которым входят ────────────────────────────────
-- Строку en_students пишет браузер ученика, и номер в ней он мог прислать
-- любой: устаревший (после смены номера в дашборде) или чужой — и тогда
-- кабинет учителя показал бы прогресс другого человека. Триггер берёт
-- номер из логина 77011234567@1eng.kz и ставит его поверх присланного.

create or replace function public.en_phone_from_login()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare v text;
begin
  select split_part(email, '@', 1) into v from auth.users
   where id = new.id and email like '%@1eng.kz';
  if v ~ '^[0-9]{11}$' then new.phone := v; end if;
  return new;
end $$;

drop trigger if exists en_students_phone_login on public.en_students;
create trigger en_students_phone_login before insert or update on public.en_students
  for each row execute function public.en_phone_from_login();

-- проверка: у всех ли профилей номер совпадает с логином (должно быть 0)
select count(*) as phone_differs_from_login
  from public.en_students s join auth.users u on u.id = s.id
 where u.email like '%@1eng.kz' and s.phone <> split_part(u.email, '@', 1);

