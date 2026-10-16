/*!
 * 1English · Supabase.
 *
 * Чистый fetch, без библиотек: платформа остаётся набором файлов, который
 * открывается по ссылке и работает внутри WebView.
 *
 * ЧТО ЗДЕСЬ ЛЕЖИТ ОТКРЫТО. anon-ключ виден любому, кто откроет исходник
 * страницы, и так задумано. Сам по себе он ничего не открывает: вся защита
 * в правилах RLS (backend/supabase_min.sql) — ученик читает и пишет только
 * свои строки. Ключ, который нельзя показывать, — service_role, его в
 * браузере нет и быть не должно.
 *
 * ВХОД ПО НОМЕРУ. Телефонный вход в Supabase требует платного SMS-провайдера
 * (около 30 ₸ за сообщение, и при регистрации, и при каждом входе). Поэтому
 * номер превращается в технический адрес 77001234567@1eng.kz, письма туда
 * физически не уходят. Настоящий номер лежит в en_students.phone: когда
 * подключим SMS-шлюз, переход будет без потери аккаунтов.
 *
 * ОФЛАЙН. База — зеркало, а не источник правды на экране. Состояние живёт
 * в localStorage и рисуется мгновенно; на сервер уходит копия. Нет сети —
 * приложение работает как раньше, копия уедет при следующем сохранении.
 */
(function (global) {
  'use strict';

  var URL_BASE = '';   /* тестовая копия в demo-platform: к боевой базе 1English не ходит */
  var ANON_KEY = '';
  var AUTH_DOMAIN = '1eng.kz';
  var STORE_KEY = '1eng-test.session';   /* свой ключ: живую сессию 1English на том же github.io не трогаем */
  var LESSON_COLS = 'id,card_id,month,idx,topic,plan_date,done,done_at,taught,taught_on,taught_at,' +
                    'client_answer,client_quality,client_note,client_at,review,review_note,review_at';

  var session = null;

  /* ── сессия ───────────────────────────────────────────────────────── */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; }
  }
  function keep(s) {
    session = s;
    try {
      if (s) localStorage.setItem(STORE_KEY, JSON.stringify(s));
      else localStorage.removeItem(STORE_KEY);
    } catch (e) {}
  }
  function store(data) {
    if (!data || !data.access_token) return null;
    keep({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user_id: data.user && data.user.id,
      expires_at: Date.now() + ((data.expires_in || 3600) - 60) * 1000
    });
    return session;
  }

  /* ── запрос ───────────────────────────────────────────────────────── */
  function req(path, opt) {
    opt = opt || {};
    var headers = { apikey: ANON_KEY, 'Content-Type': 'application/json' };
    if (opt.token) headers.Authorization = 'Bearer ' + opt.token;
    if (opt.headers) Object.keys(opt.headers).forEach(function (k) { headers[k] = opt.headers[k]; });

    return fetch(URL_BASE + path, {
      method: opt.method || 'GET',
      headers: headers,
      body: opt.body ? JSON.stringify(opt.body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
          var e = new Error((data && (data.msg || data.message || data.error_description ||
                                      data.error || data.hint)) || ('Ошибка ' + res.status));
          e.status = res.status;
          e.code = data && (data.error_code || data.code);
          throw e;
        }
        return data;
      });
    });
  }

  /* Токен живёт час. Истёк — молча обновляем. */
  function token() {
    if (!session) return Promise.reject(new Error('Нужно войти'));
    if (Date.now() < session.expires_at) return Promise.resolve(session.access_token);
    return req('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', body: { refresh_token: session.refresh_token }
    }).then(function (d) { return store(d).access_token; })
      .catch(function (err) { keep(null); throw err; });
  }

  /* Любой казахстанский формат → 77001234567, чтобы один человек не завёл
     два аккаунта, набрав номер по-разному. */
  function normPhone(raw) {
    var d = (raw || '').replace(/\D/g, '');
    if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1);
    if (d.length === 10) d = '7' + d;
    return (d.length === 11 && d.charAt(0) === '7') ? d : null;
  }
  function asEmail(phone) { return phone + '@' + AUTH_DOMAIN; }

  var DB = {
    ready: false,          /* есть живая сессия */
    online: true,          /* последняя запись прошла */
    userId: null,

    init: function () {
      session = load();
      DB.ready = !!session;
      DB.userId = session && session.user_id;
      return DB.ready;
    },

    /* Только вход. Аккаунт заводит администратор (en_add_student в базе),
       сам себя зарегистрировать нельзя: в проекте выключены sign-ups, а
       запасной /auth/v1/signup отсюда убран намеренно. */
    enter: function (rawPhone, pin) {
      var phone = normPhone(rawPhone);
      if (!phone) return Promise.reject(new Error('Проверьте номер'));
      if (!pin || pin.length < 6) return Promise.reject(new Error('Код из шести цифр'));

      return req('/auth/v1/token?grant_type=password', {
        method: 'POST', body: { email: asEmail(phone), password: pin }
      }).catch(function (err) {
        /* база не различает «код не тот» и «такого номера нет» — и не должна:
           иначе по ответу можно перебирать, кто в группе есть. */
        if (err.status === 400) { err = new Error('NO_ACCESS'); err.noAccess = true; }
        throw err;
      }).then(function (d) {
        store(d);
        DB.ready = true;
        DB.userId = session.user_id;
        return DB.saveProfile({ phone: phone }).then(function () { return { created: false }; });
      });
    },

    signOut: function () { keep(null); DB.ready = false; DB.userId = null; },

    /* Профиль: одна строка на ученика, перезаписывается целиком.
       Если в базе ещё нет какой-то колонки (схему обновили позже кода),
       PostgREST называет её по имени — выкидываем и пробуем снова, чтобы
       из-за одного нового поля не потерялось всё остальное. */
    saveProfile: function (fields) {
      if (!DB.ready) return Promise.resolve(null);

      var body = { id: session.user_id };
      Object.keys(fields).forEach(function (k) {
        if (fields[k] !== undefined && fields[k] !== '' && fields[k] !== null) body[k] = fields[k];
      });

      function attempt(left) {
        return token().then(function (tk) {
          return req('/rest/v1/en_students?on_conflict=id', {
            method: 'POST', token: tk,
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: body
          });
        }).catch(function (err) {
          var miss = /Could not find the '([a-z_]+)' column/i.exec(err.message || '');
          if (miss && left > 0 && (miss[1] in body)) {
            console.warn('[db] в базе нет колонки ' + miss[1] + ', отправляю без неё');
            delete body[miss[1]];
            return attempt(left - 1);
          }
          throw err;
        });
      }

      return attempt(3)
        .then(function (rows) { DB.online = true; return (rows && rows[0]) || null; })
        .catch(function (err) { DB.online = false; console.warn('[db] профиль не сохранён:', err.message); return null; });
    },

    /* Шаг урока: read (теория) | prac (практика) | text (чтение) | task | words. */
    saveStep: function (lesson, step, right, total) {
      if (!DB.ready) return Promise.resolve(null);
      return token().then(function (tk) {
        return req('/rest/v1/en_progress?on_conflict=student_id,lesson,step', {
          method: 'POST', token: tk,
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: {
            student_id: session.user_id, lesson: lesson, step: step,
            right_count: right == null ? null : right,
            total_count: total == null ? null : total
          }
        });
      }).then(function () { DB.online = true; return true; })
        .catch(function (err) { DB.online = false; console.warn('[db] шаг не сохранён:', err.message); return false; });
    },

    /* Всё, что есть на сервере: профиль и прогресс — строго свои.
       Фильтр по id обязателен, а не декор: у аккаунта из en_admins RLS
       отдаёт ВСЕ строки, и запрос без условия приносил ему чужой профиль
       (последнего заведённого ученика) и чужой прогресс, а следующий
       syncProfile записывал чужое имя и пол уже в его собственную строку. */
    pull: function () {
      if (!DB.ready) return Promise.resolve(null);
      var me = session.user_id;
      return token().then(function (tk) {
        return Promise.all([
          req('/rest/v1/en_students?select=*&id=eq.' + me, { token: tk }),
          req('/rest/v1/en_progress?select=*&student_id=eq.' + me, { token: tk })
        ]);
      }).then(function (r) {
        DB.online = true;
        return { profile: (r[0] && r[0][0]) || null, progress: r[1] || [] };
      }).catch(function (err) {
        DB.online = false;
        console.warn('[db] не прочитали сервер:', err.message);
        return null;
      });
    },

    /* Пускают ли этого ученика. Пустой список допущенных означает «всех». */
    amIAllowed: function () {
      if (!DB.ready) return Promise.resolve(true);
      return token().then(function (tk) {
        return req('/rest/v1/rpc/en_am_i_allowed', { method: 'POST', token: tk, body: {} });
      }).then(function (v) { return v !== false; })
        .catch(function () { return true; });   /* база молчит — не запираем ученика */
    },

    /* Партия в игре. Шагов у урока три и других не будет, поэтому игра
       не притворяется шагом, а лежит своей строкой: что играли, сколько
       верных и сколько мимо. Таблицы может ещё не быть (патч к схеме
       применяется руками) — тогда партия просто не уезжает, игра от
       этого не ломается. */
    saveGame: function (game, right, wrong) {
      if (!DB.ready) return Promise.resolve(false);
      return token().then(function (tk) {
        return req('/rest/v1/en_games', {
          method: 'POST', token: tk, headers: { Prefer: 'return=minimal' },
          body: {
            student_id: session.user_id,
            game: String(game || '').slice(0, 40),
            right_count: right == null ? null : right,
            wrong_count: wrong == null ? null : wrong
          }
        });
      }).then(function () { DB.online = true; return true; })
        .catch(function (err) { console.warn('[db] партия не сохранена:', err.message); return false; });
    },

    /* Журнал падений: без него о поломке у ученика не узнает никто. */
    logError: function (message, source) {
      if (!DB.ready) return Promise.resolve(false);
      return token().then(function (tk) {
        return req('/rest/v1/en_errors', {
          method: 'POST', token: tk, headers: { Prefer: 'return=minimal' },
          body: {
            student_id: session.user_id,
            message: String(message).slice(0, 500),
            source: String(source || '').slice(0, 200),
            agent: navigator.userAgent.slice(0, 200)
          }
        });
      }).then(function () { return true; }).catch(function () { return false; });
    },

    /* Список допущенных номеров: читает и правит только админ. */
    allowed: {
      list: function () {
        return token().then(function (tk) {
          return req('/rest/v1/en_allowed?select=*&order=created_at.desc', { token: tk });
        });
      },
      add: function (phone, note) {
        var p = normPhone(phone);
        if (!p) return Promise.reject(new Error('Проверьте номер'));
        return token().then(function (tk) {
          return req('/rest/v1/en_allowed?on_conflict=phone', {
            method: 'POST', token: tk,
            headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
            body: { phone: p, note: note || null }
          });
        });
      },
      remove: function (phone) {
        return token().then(function (tk) {
          return req('/rest/v1/en_allowed?phone=eq.' + encodeURIComponent(phone), {
            method: 'DELETE', token: tk, headers: { Prefer: 'return=minimal' }
          });
        });
      }
    },

    /* Завести ученика. Права проверяет сама функция в базе; форма в
       дашборде — единственный способ, регистрация с улицы выключена. */
    addStudent: function (phone, code, name, level) {
      return token().then(function (tk) {
        return req('/rest/v1/rpc/en_add_student', {
          method: 'POST', token: tk,
          body: { p_phone: phone, p_code: code, p_name: name || null, p_level: level || null }
        });
      });
    },

    /* Новый код вместо забытого. Проверку прав делает сама функция в базе. */
    resetCode: function (phone, code) {
      return token().then(function (tk) {
        return req('/rest/v1/rpc/en_reset_code', {
          method: 'POST', token: tk, body: { p_phone: phone, p_code: code }
        });
      });
    },

    /* Дашборд: всё, что есть в базе. Обычному ученику RLS отдаст только
       его собственные строки, поэтому запрос безопасен сам по себе. */
    listAll: function () {
      return token().then(function (tk) {
        return Promise.all([
          req('/rest/v1/en_students?select=*&order=updated_at.desc', { token: tk }),
          req('/rest/v1/en_progress?select=*', { token: tk }),
          req('/rest/v1/en_admins?select=id', { token: tk }),
          req('/rest/v1/en_errors?select=*&order=created_at.desc&limit=20', { token: tk })
            .catch(function () { return []; }),
          req('/rest/v1/en_games?select=*&order=created_at.desc&limit=500', { token: tk })
            .catch(function () { return []; }),
          /* учителя и их карточки. Патча кабинета учителя может ещё не
             быть — тогда панель честно показывает «учителей нет», а не
             роняет весь дашборд. */
          req('/rest/v1/en_teachers?select=*&order=created_at', { token: tk })
            .catch(function () { return []; }),
          /* Уроки — со всем, что нужно контролю: отметка учителя, ответ
             клиента, решение админа. Патча 16.10 в базе ещё нет — колонок
             нет, и запрос откатывается к прежнему, а дашборд работает как
             раньше, только без вкладки контроля. */
          req('/rest/v1/en_teacher_students?select=*,lessons:en_teacher_lessons(' + LESSON_COLS + ')' +
              '&order=archived,name', { token: tk })
            .catch(function () {
              return req('/rest/v1/en_teacher_students?select=*,lessons:en_teacher_lessons(id,done,done_at)' +
                         '&order=archived,name', { token: tk });
            })
            .catch(function () { return []; }),
          req('/rest/v1/en_confirm_requests?select=*&order=period_from.desc', { token: tk })
            .catch(function () { return null; })
        ]);
      }).then(function (r) {
        return {
          students: r[0] || [], progress: r[1] || [],
          isAdmin: (r[2] || []).length > 0, errors: r[3] || [], games: r[4] || [],
          teachers: r[5] || [], cards: r[6] || [],
          /* null — таблицы запросов нет: патч контроля не применён */
          requests: r[7]
        };
      });
    },

    /* Удалить себя целиком: строки и сам аккаунт. Делает функция в базе,
       потому что удаление пользователей из браузера закрыто. */
    deleteMe: function () {
      if (!DB.ready) return Promise.resolve(false);
      return token().then(function (tk) {
        return req('/rest/v1/rpc/en_delete_me', { method: 'POST', token: tk, body: {} });
      }).then(function () { keep(null); DB.ready = false; DB.userId = null; return true; });
    },

    /* Общая дверь к PostgREST для отдельных экранов (кабинет учителя).
       Токен и обновление токена берутся отсюда, а не переписываются
       заново: экранов будет больше, а способ войти — один. Защита не
       здесь, а в правилах RLS: этот же запрос из чужого браузера вернёт
       чужому только его собственные строки. */
    rest: function (path, opt) {
      opt = opt || {};
      return token().then(function (tk) {
        return req('/rest/v1/' + path, {
          method: opt.method || 'GET', body: opt.body,
          headers: opt.headers, token: tk
        });
      });
    },
    rpc: function (name, body) {
      return token().then(function (tk) {
        return req('/rest/v1/rpc/' + name, { method: 'POST', token: tk, body: body || {} });
      });
    },
    /* Без входа: экран клиента по ссылке. Пускает функция в базе по ключу
       ссылки, а не токен — у клиента аккаунта нет. */
    anonRpc: function (name, body) {
      return req('/rest/v1/rpc/' + name, { method: 'POST', body: body || {} });
    },

    normPhone: normPhone
  };

  global.DB = DB;
})(window);
