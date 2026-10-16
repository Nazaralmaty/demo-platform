/* Демо-мир школы: учителя, ученики, уроки, запросы клиентам и журнал.

   Строки лежат в той же форме, что таблицы живой платформы (en_teachers,
   en_teacher_students, en_teacher_lessons, en_confirm_requests), и считает
   их тот же движок app/control.js. То есть витрина показывает не макет, а
   настоящую логику на выдуманных людях.

   Уроки не написаны руками — они сгенерированы по графику каждого ученика
   (пн-ср-пт, вт-чт…), поэтому «урок не по графику» в демо ловится честно.
   Темы — настоящие уроки курса из app/course.js.

   Состояние общее для всех экранов: учитель отметил урок в своём кабинете —
   администратор видит это в контроле, клиент — у себя в телефоне. Живёт в
   localStorage этого браузера; «Сбросить демо» возвращает всё как было. */
(function (global) {
  'use strict';
  var C = global.CTRL;

  /* День демо-мира: понедельник. Первая половина октября закрыта, запросы
     клиентам ушли в пятницу 16-го, в воскресенье — напоминание. */
  var TODAY = '2026-10-19';
  var NOW_TIME = '12:00';
  var P1 = C.period('2026-10-01');   /* 1–15 октября, закрыт */
  var P2 = C.period('2026-10-16');   /* 16–31 октября, идёт */
  /* Ключ — папка демо, а не первый кусок адреса: на github.io это имя
     репозитория, а на своём домене первым куском оказывается сама
     страница, и у каждого экрана получался бы свой мир. */
  var STORE = 'eco.' + (location.pathname.replace(/[^/]*$/, '') || '/') + '.v2';

  var TEACHERS = [
    { id: 't1', name: 'Айгерім Нұрлан', phone: '77015550000', rate: 1150,
      bio: 'Десять лет в школе, пять — онлайн. Готовит к IELTS, ведёт разговорные клубы для подростков.',
      slots: 'mon@18:00,wed@18:00,fri@18:00,tue@18:30,thu@18:30,mon@17:00,wed@17:00' },
    { id: 't2', name: 'Гүлнара Серикова', phone: '77025551111', rate: 1300,
      bio: 'Восемь лет с детьми 7–12 лет: игра, песни, пересказ.',
      slots: 'tue@16:00,thu@16:00,sat@16:00,tue@17:00,thu@17:00,sat@17:00,tue@17:30,thu@17:30' },
    { id: 't3', name: 'Дана Абылкасымова', phone: '77035552222', rate: 1400,
      bio: 'Взрослые и подростки с A2: разговорный английский, IELTS, учёба и переезд.',
      slots: 'tue@19:00,thu@19:00,mon@19:30,wed@19:30,fri@19:30' }
  ];

  /* course — номер урока курса, с которого ученик начал октябрь. Два
     занятия на урок курса: правило со словами, потом практика. */
  var STUDENTS = [
    { id: 's1', name: 'Аяжан', phone: '77011234567', teacher_id: 't1', level: 'pre-intermediate',
      days: 'mon,wed,fri', time_at: '18:00', rate: 1150, started_on: '2026-08-12', course: 3,
      pay_plan: 'month', paid_until: '2026-11-01', goal: 'IELTS 6.5 к лету',
      note: 'Стесняется говорить вслух, письменные задания делает быстро.' },
    { id: 's2', name: 'Тимур', phone: '77029876543', teacher_id: 't3', level: 'intermediate',
      days: 'tue,thu', time_at: '19:00', rate: 1400, started_on: '2026-09-02', course: 6,
      pay_plan: 'two_weeks', paid_until: '2026-10-16', goal: 'Переезд в Канаду, IELTS 7.0',
      note: 'Быстрый темп, любит обсуждать новости.' },
    { id: 's3', name: 'Диана', phone: '77031112233', teacher_id: 't2', level: 'elementary',
      days: 'tue,thu,sat', time_at: '17:00', rate: 1150, started_on: '2026-09-20', course: 2,
      pay_plan: 'month', paid_until: '2026-10-20', goal: 'Школьная программа на 5',
      note: 'Приходит с братом, вдвоём работают лучше.' },
    { id: 's4', name: 'Арман', phone: '77045556677', teacher_id: 't1', level: 'pre-intermediate',
      days: 'tue,thu', time_at: '18:30', rate: 1150, started_on: '2026-09-28', course: 2,
      pay_plan: 'month', paid_until: '2026-10-28', goal: 'Разговорный для поездок',
      note: 'Спокойный, пунктуальный.' },
    { id: 's5', name: 'Аружан', phone: '77056667788', teacher_id: 't2', level: 'beginner',
      days: 'tue,thu,sat', time_at: '16:00', rate: 1150, started_on: '2026-10-05', course: 1,
      pay_plan: 'lessons8', paid_until: '2026-11-05', goal: 'С нуля, понимать мультики',
      note: 'Первый месяц, знакомство с языком.' },
    { id: 's6', name: 'Ерасыл', phone: '77067778899', teacher_id: 't3', level: 'intermediate',
      days: 'mon,wed,fri', time_at: '19:30', rate: 1500, started_on: '2026-06-15', course: 9,
      pay_plan: 'month', paid_until: '2026-11-05', goal: 'IELTS 8.0 для NYU Shanghai',
      note: 'Сильный ученик, занимается с июня.' },
    { id: 's7', name: 'Мадина', phone: '77078889900', teacher_id: 't2', level: 'elementary',
      days: 'tue,thu', time_at: '17:30', rate: 1200, started_on: '2026-10-06', course: 1,
      pay_plan: 'two_weeks', paid_until: '2026-10-20', goal: 'Подтянуть оценки',
      note: 'Только начала, стесняется.' }
  ];

  var PAY_PLAN = { month: 'Помесячно', two_weeks: 'Раз в 2 недели', lessons8: 'Пакет 8 уроков' };

  /* ── курс ────────────────────────────────────────────────────────── */
  function levelOf(card) {
    return ((global.COURSE || {}).levels || []).filter(function (l) { return l.id === card.level; })[0];
  }
  function courseLesson(card, n) {
    var lv = levelOf(card);
    var L = lv && lv.lessons[Math.max(1, Math.min(n, lv.lessons.length)) - 1];
    if (!L) return null;
    var c = (global.CONTENT || {})[L.id] || {};
    return { id: L.id, n: L.n || n, title: L.title, subtitle: L.subtitle, rule: c.rule || '',
             examples: c.examples || [], words: c.words || [], tasks: c.tasks || [], level: lv };
  }
  function topicOf(card, n, part) {
    var L = courseLesson(card, n);
    return L ? 'Урок ' + L.n + ' · ' + L.title + (part ? ' — практика' : ' — правило и слова') : '';
  }
  function homeworkOf(card, n, part) {
    var L = courseLesson(card, n);
    if (!L) return '';
    return part
      ? 'В платформе: урок ' + L.n + ', задания (' + L.tasks.length + ') и чтение. Повторить слова флип-картами.'
      : 'В платформе: урок ' + L.n + ', видео с правилом и ' + L.words.length + ' слов: ' +
        L.words.slice(0, 4).map(function (w) { return w.en; }).join(', ') + '…';
  }

  /* ── генерация мира ─────────────────────────────────────────────────── */
  function at(date, hm) { return date + 'T' + (hm || '12:00') + ':00+05:00'; }
  function plusHour(hm) { var h = +hm.slice(0, 2) + 1; return (h < 10 ? '0' : '') + h + hm.slice(2); }

  /* Ответы клиентов за 1–15 октября. Ключ — дата урока. */
  var SCENE = {
    s1: { answered: '11:20', q: [5, 5, 4, 5, 5, 5],
          by: { '2026-10-12': { a: 'no', note: '12-го урока не было: учитель написала, что заболела, и перенесла.' } } },
    s2: { silent: true },
    s3: { answered: '12:05', q: [5, 5, 5, 5, 5, 5, 5],
          by: { '2026-10-08': { a: 'yes', q: 5, notTaught: true },
                '2026-10-13': { a: 'yes', q: 2, note: 'Урок был, но полчаса у учителя не работал микрофон.' } } },
    s4: { answered: '14:40', q: [5, 4, 5, 5, 5] },
    s5: { answered: '13:10', q: [5, 5, 5, 4, 5],
          by: { '2026-10-15': { a: 'unsure', note: 'Не помню, был ли урок в четверг: я был в отъезде, сын говорит, что был.' } } },
    s6: { answered: '14:55', q: [5, 5, 4, 5, 5, 4],
          /* Две отметки за выходные, поставленные в субботу вечером — уже
             после того, как клиент подтвердил период. */
          extra: [{ date: '2026-10-10', at: at('2026-10-17', '21:10') },
                  { date: '2026-10-11', at: at('2026-10-17', '21:12') }] },
    s7: { answered: '15:20', q: [4, 5, 5, 5] }
  };

  function seed() {
    var lessons = [], requests = [], log = [], messages = [];
    var cards = STUDENTS.map(function (s) {
      var c = {}; Object.keys(s).forEach(function (k) { c[k] = s[k]; });
      return c;
    });

    cards.forEach(function (card) {
      var scene = SCENE[card.id] || {};
      var dates = C.plannedDates(card, P1).concat(C.plannedDates(card, P2));
      var p1count = 0;
      dates.forEach(function (d, i) {
        var n = card.course + Math.floor(i / 2), part = i % 2;
        var past = d < TODAY;
        var l = { id: card.id + '-' + d, card_id: card.id, plan_date: d,
                  course_id: (courseLesson(card, n) || {}).id || null,
                  topic: topicOf(card, n, part), homework: homeworkOf(card, n, part),
                  taught: past, taught_on: past ? d : null,
                  taught_at: past ? at(d, plusHour(card.time_at)) : null,
                  client_answer: null, client_quality: null, client_note: null, client_at: null,
                  review: null };
        if (C.inPeriod(d, P1) && !scene.silent) {
          var over = (scene.by || {})[d] || {};
          if (over.notTaught) { l.taught = false; l.taught_on = null; l.taught_at = null; }
          l.client_answer = over.a || 'yes';
          l.client_quality = l.client_answer === 'yes' ? (over.q || scene.q[p1count] || 5) : null;
          l.client_note = over.note || null;
          l.client_at = at('2026-10-16', scene.answered);
        }
        if (C.inPeriod(d, P1)) p1count++;
        lessons.push(l);
      });
      (scene.extra || []).forEach(function (x) {
        lessons.push({ id: card.id + '-' + x.date, card_id: card.id, plan_date: null,
                       course_id: null, topic: 'Разговорный клуб: доп. занятие', homework: '',
                       taught: true, taught_on: x.date, taught_at: x.at,
                       client_answer: null, client_quality: null, client_note: null, client_at: null,
                       review: null });
      });

      /* Запрос за первую половину октября. */
      var req = { id: 'r-' + card.id + '-' + P1.key, token: 'gsc-' + card.id + '-' + P1.key,
                  card_id: card.id, period_key: P1.key, period_from: P1.from, period_to: P1.to,
                  created_at: at('2026-10-16', '10:00'), sent_at: at('2026-10-16', '10:00'),
                  reminded_at: scene.silent ? at('2026-10-18', '10:00') : null,
                  answered_at: scene.answered ? at('2026-10-16', scene.answered) : null,
                  note: Object.keys(scene.by || {}).map(function (k) { return scene.by[k].note; }).filter(Boolean).join(' ') || null };
      requests.push(req);
    });

    var state = { v: 2, today: TODAY, teachers: TEACHERS, cards: cards, lessons: lessons,
                  requests: requests, log: log, messages: messages, seen: {} };

    /* Письма, которые уже ушли: запросы, ответы, напоминание и алерты. */
    requests.forEach(function (r) {
      var card = byId(state.cards, r.card_id);
      msg(state, { at: r.sent_at, kind: 'request', to: 'client', card_id: card.id,
                   text: requestText(state, r) });
      if (r.answered_at) {
        note(state, r.answered_at, 'client', card.name + ' ответил(а) на запрос за ' + C.periodLabel(P1, 'ru'));
      }
      if (r.reminded_at) {
        msg(state, { at: r.reminded_at, kind: 'reminder', to: 'client', card_id: card.id,
                     text: C.text('reminder', textArgs(state, r), 'ru') });
      }
    });
    note(state, at('2026-10-16', '10:00'), 'system',
         'Запросы за ' + C.periodLabel(P1, 'ru') + ' ушли клиентам: ' + requests.length + ' шт., WhatsApp');
    note(state, at('2026-10-18', '10:00'), 'system', 'Напоминание тем, кто не ответил за 2 дня: 1 шт.');
    note(state, at('2026-10-17', '21:12'), 'teacher',
         'Дана Абылкасымова добавила 2 урока Ерасыла за 10 и 11 октября');
    /* Алерты по тому, что уже лежит в очереди, — со временем, когда
       расхождение появилось. */
    var an = C.analyze(state, TODAY);
    an.tickets.forEach(function (t) {
      var when = t.kind === 'silent' ? at('2026-10-18', '10:00')
        : t.kind === 'suspect' ? t.rows[0].l.taught_at
        : (t.request && t.request.answered_at) || at('2026-10-16', '15:30');
      msg(state, { at: when, kind: 'alert', to: 'admin', card_id: t.card.id, text: C.alertText(t) });
      state.seen[t.id] = true;
    });
    sortLog(state);
    return state;
  }

  /* ── хранилище ────────────────────────────────────────────────────── */
  var state = null;
  function load() {
    if (state) return state;
    try {
      var raw = JSON.parse(localStorage.getItem(STORE));
      if (raw && raw.v === 2 && raw.today === TODAY && raw.lessons) state = raw;
    } catch (e) {}
    if (!state) state = seed();
    return state;
  }
  function save() {
    alerts(state);
    sortLog(state);
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
    listeners.forEach(function (fn) { fn(state); });
  }
  function reset() {
    try { localStorage.removeItem(STORE); } catch (e) {}
    state = seed();
    save();
  }
  var listeners = [];
  function onChange(fn) { listeners.push(fn); }
  /* Другая вкладка поменяла мир — подтягиваем. Учитель и клиент могут
     быть открыты рядом на одном ноутбуке во время показа. */
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', function (e) {
      if (e.key !== STORE) return;
      state = null; load();
      listeners.forEach(function (fn) { fn(state); });
    });
  }

  /* Новое расхождение — сразу алерт администратору, ровно один раз. */
  function alerts(st) {
    var an = C.analyze(st, TODAY);
    an.tickets.forEach(function (t) {
      if (st.seen[t.id]) return;
      st.seen[t.id] = true;
      msg(st, { at: now(), kind: 'alert', to: 'admin', card_id: t.card.id, text: C.alertText(t) });
    });
  }

  /* ── время и журнал ─────────────────────────────────────────────────── */
  function now() {
    var d = new Date();
    var hm = (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    return at(TODAY, hm < NOW_TIME ? NOW_TIME : hm);
  }
  var seq = 0;
  function note(st, when, who, text) { st.log.push({ id: 'n' + (++seq) + '-' + Date.now(), at: when, who: who, text: text }); }
  function msg(st, m) { m.id = 'm' + (++seq) + '-' + Date.now(); st.messages.push(m); }
  function sortLog(st) {
    st.log.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    st.messages.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  }

  /* ── выборки ────────────────────────────────────────────────────────── */
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0] || null; }
  function teacherOf(st, card) { return byId(st.teachers, card.teacher_id); }
  function lessonsOf(st, cardId) {
    return st.lessons.filter(function (l) { return l.card_id === cardId; })
      .sort(function (a, b) { return String(C.dateOf(a)).localeCompare(String(C.dateOf(b))); });
  }
  function confirmUrl(token) {
    var base = location.href.replace(/[^/]*$/, '');
    return base + 'confirm.html?t=' + encodeURIComponent(token);
  }
  function textArgs(st, r) {
    var card = byId(st.cards, r.card_id);
    var p = C.periodByKey(r.period_key);
    var count = st.lessons.filter(function (l) {
      return l.card_id === card.id && l.taught && C.inPeriod(C.dateOf(l), p);
    }).length;
    return { school: (global.BRAND || {}).name || 'Школа', student: card.name,
             teacher: teacherOf(st, card).name, period: p, count: count, url: confirmUrl(r.token) };
  }
  function requestText(st, r, lang) { return C.text('request', textArgs(st, r), lang || 'ru'); }
  function nextLesson(st, cardId) {
    return lessonsOf(st, cardId).filter(function (l) { return !l.taught && C.dateOf(l) >= TODAY; })[0] || null;
  }

  /* Что видит клиент по ссылке: уроки учителя за период и уроки по
     графику, которые учитель не отметил, — «а этот был?». */
  function confirmPayload(st, token) {
    var r = st.requests.filter(function (x) { return x.token === token; })[0];
    if (!r) return null;
    var card = byId(st.cards, r.card_id), p = C.periodByKey(r.period_key);
    var list = lessonsOf(st, card.id).filter(function (l) {
      var d = C.dateOf(l);
      return C.inPeriod(d, p) && d <= TODAY && (l.taught || l.client_answer);
    }).concat(lessonsOf(st, card.id).filter(function (l) {
      var d = C.dateOf(l);
      return C.inPeriod(d, p) && d < TODAY && !l.taught && !l.client_answer;
    })).sort(function (a, b) { return C.dateOf(a).localeCompare(C.dateOf(b)); });
    return {
      school: (global.BRAND || {}).name || 'Школа', student: card.name,
      teacher: teacherOf(st, card).name, period: p, answered_at: r.answered_at, note: r.note || null,
      lessons: list.map(function (l) {
        return { id: l.id, date: C.dateOf(l), topic: l.topic, taught: !!l.taught,
                 answer: l.client_answer, quality: l.client_quality, note: l.client_note, locked: !!l.review };
      })
    };
  }

  /* ── действия ───────────────────────────────────────────────────────── */
  var A = {
    /* Учитель: урок проведён / снять отметку. Закрыто, если клиент уже
       ответил или администратор разобрал — иначе можно было бы задним
       числом переписать то, за что уже заплатили. */
    teach: function (lessonId, on) {
      var st = load(), l = byId(st.lessons, lessonId);
      if (!l) return 'Урока нет';
      if (l.client_answer || l.review) return 'Урок уже подтверждён клиентом — отметка закрыта';
      var d = C.dateOf(l);
      if (on && d > TODAY) return 'Урок ещё не наступил';
      var card = byId(st.cards, l.card_id), t = teacherOf(st, card);
      l.taught = !!on; l.taught_on = on ? d : null; l.taught_at = on ? now() : null;
      note(st, now(), 'teacher', t.name + (on ? ' отметила урок: ' : ' сняла отметку: ') +
           card.name + ', ' + C.dateLabel(d, 'ru'));
      save();
      return 'ok';
    },
    /* Клиент ответил по ссылке. answers: { lessonId: {answer, quality} } */
    answer: function (token, answers, text) {
      var st = load();
      var r = st.requests.filter(function (x) { return x.token === token; })[0];
      if (!r) return 'Ссылка устарела';
      var card = byId(st.cards, r.card_id), when = now(), counts = { yes: 0, no: 0, unsure: 0 };
      Object.keys(answers).forEach(function (id) {
        var l = byId(st.lessons, id), a = answers[id];
        if (!l || l.card_id !== card.id || l.review) return;
        l.client_answer = a.answer;
        l.client_quality = a.answer === 'yes' ? (a.quality || 5) : null;
        /* Комментарий — к периоду; на урок он ложится только там, где
           есть вопрос, иначе «всё хорошо» висело бы цитатой на споре. */
        var issue = a.answer !== 'yes' || l.client_quality <= C.LOW_Q;
        l.client_note = issue ? (text || null) : null;
        l.client_at = when;
        counts[a.answer]++;
      });
      r.answered_at = when;
      r.note = text || null;
      note(st, when, 'client', card.name + ': подтверждено ' + counts.yes +
           (counts.no ? ', «не было» ' + counts.no : '') + (counts.unsure ? ', не уверен ' + counts.unsure : '') +
           (text ? ' · «' + text + '»' : ''));
      save();
      return 'ok';
    },
    /* Администратор разобрал строку очереди. */
    resolve: function (ticketId, how, comment) {
      var st = load();
      var t = C.analyze(st, TODAY).tickets.filter(function (x) { return x.id === ticketId; })[0];
      if (!t) return 'Уже разобрано';
      t.rows.forEach(function (r) {
        var l = byId(st.lessons, r.l.id);
        l.review = how; l.review_note = comment || null; l.review_at = now();
        if (how === 'paid' && !l.taught) { l.taught = true; l.taught_on = r.date; l.taught_at = now(); }
      });
      note(st, now(), 'admin', t.card.name + ' · ' + C.KIND[t.kind].toLowerCase() + ' → ' +
           (how === 'paid' ? 'к выплате' : 'снято') + (t.rows.length > 1 ? ' (' + t.rows.length + ' ур.)' : ''));
      save();
      return 'ok';
    },
    reopen: function (lessonId) {
      var st = load(), l = byId(st.lessons, lessonId);
      if (!l || !l.review) return 'Нечего возвращать';
      l.review = null; l.review_note = null; l.review_at = null;
      note(st, now(), 'admin', 'Решение по уроку возвращено в очередь: ' + byId(st.cards, l.card_id).name);
      save();
      return 'ok';
    },
    /* Запросы за закрытый период — каждому, у кого есть уроки. */
    sendRequests: function (key) {
      var st = load(), p = C.periodByKey(key), made = 0;
      st.cards.forEach(function (card) {
        if (C.requestOf(st, card.id, key)) return;
        var has = st.lessons.some(function (l) {
          return l.card_id === card.id && l.taught && C.inPeriod(C.dateOf(l), p);
        });
        if (!has) return;
        var r = { id: 'r-' + card.id + '-' + key, token: 'gsc-' + card.id + '-' + key,
                  card_id: card.id, period_key: key, period_from: p.from, period_to: p.to,
                  created_at: now(), sent_at: now(), reminded_at: null, answered_at: null };
        st.requests.push(r);
        msg(st, { at: now(), kind: 'request', to: 'client', card_id: card.id, text: requestText(st, r) });
        made++;
      });
      note(st, now(), 'system', 'Запросы за ' + C.periodLabel(p, 'ru') + ': ' + made + ' шт.');
      save();
      return made;
    },
    remind: function (requestId) {
      var st = load(), r = byId(st.requests, requestId);
      if (!r || r.answered_at) return 'Клиент уже ответил';
      r.reminded_at = now();
      msg(st, { at: now(), kind: 'reminder', to: 'client', card_id: r.card_id,
                text: C.text('reminder', textArgs(st, r), 'ru') });
      note(st, now(), 'admin', 'Напоминание: ' + byId(st.cards, r.card_id).name);
      save();
      return 'ok';
    },
    /* Администратор пишет участнику спора. Текст собирает система. */
    write: function (ticketId, to) {
      var st = load();
      var t = C.analyze(st, TODAY).tickets.filter(function (x) { return x.id === ticketId; })[0];
      if (!t) return 'Уже разобрано';
      var d = C.dateLabel(t.date, 'ru');
      var text = to === 'client'
        ? 'Здравствуйте! Это администратор ' + ((global.BRAND || {}).name || '') + '. Уточните, пожалуйста, по уроку ' +
          t.card.name + ' ' + d + ': как он прошёл? Хотим, чтобы всё было честно и для вас, и для учителя.'
        : 'Добрый день! По уроку ' + t.card.name + ' ' + d + ' есть вопрос от клиента: ' +
          C.KIND[t.kind].toLowerCase() + '. Расскажите, пожалуйста, как прошло занятие.';
      msg(st, { at: now(), kind: 'admin', to: to, card_id: t.card.id, text: text });
      note(st, now(), 'admin', 'Написал ' + (to === 'client' ? 'клиенту' : 'учителю') + ': ' + t.card.name + ', ' + d);
      save();
      return text;
    },
    /* Оплата от клиента получена: продлить «оплачено до» на период плана. */
    paid: function (cardId) {
      var st = load(), c = byId(st.cards, cardId);
      var from = c.paid_until && c.paid_until > TODAY ? c.paid_until : TODAY;
      c.paid_until = c.pay_plan === 'two_weeks' ? C.addDays(from, 14)
                   : c.pay_plan === 'lessons8' ? C.addDays(from, 28)
                   : nextMonth(from);
      note(st, now(), 'admin', 'Оплата: ' + c.name + ', оплачено до ' + C.dateLabel(c.paid_until, 'ru'));
      save();
      return 'ok';
    }
  };
  function nextMonth(iso) {
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7) + 1, d = iso.slice(8, 10);
    if (m > 12) { m = 1; y++; }
    var last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (Math.min(+d, last) < 10 ? '0' : '') + Math.min(+d, last);
  }

  /* Оплата клиента: оплачено до / просрочено. */
  function payState(card) {
    if (!card.paid_until) return { tone: 'mute', text: 'нет данных' };
    var left = C.diffDays(TODAY, card.paid_until);
    if (left < 0) return { tone: 'bad', text: 'просрочено ' + (-left) + ' дн', left: left };
    if (left <= 3) return { tone: 'warn', text: left === 0 ? 'оплата сегодня' : 'оплата через ' + left + ' дн', left: left };
    return { tone: 'ok', text: 'до ' + C.dateLabel(card.paid_until, 'ru'), left: left };
  }

  global.DEMO = {
    TODAY: TODAY, P1: P1, P2: P2, PAY_PLAN: PAY_PLAN, STORE: STORE,
    load: load, save: save, reset: reset, onChange: onChange, seed: seed,
    analyze: function () { return C.analyze(load(), TODAY); },
    byId: byId, teacherOf: teacherOf, lessonsOf: lessonsOf, nextLesson: nextLesson,
    levelOf: levelOf, courseLesson: courseLesson, confirmUrl: confirmUrl,
    requestText: requestText, confirmPayload: confirmPayload, payState: payState,
    act: A
  };
})(window);
