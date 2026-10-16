/* GSC Study · демо-экосистема. ОДИН источник выдуманных данных для всех
   служебных страниц: кабинет учителя, админ-кабинет, контроль уроков,
   система оповещений. Страницы не дублируют учеников и уроки — они читают
   отсюда, а значит цифры на четырёх экранах не могут разойтись.

   Это демо: данные выдуманы, ничего не уходит в сеть и не пишется в
   базу. Состояние живёт в памяти вкладки и сбрасывается обновлением
   страницы. Дата демо-мира — 16 октября 2026, второй отчётный период
   идёт. */
(function (global) {
  'use strict';

  /* ── отчётные периоды ───────────────────────────────────────────────
     Каждые две недели по закрытии периода клиенту уходит запрос:
     подтверждает ли он уроки. Второй период ещё идёт. */
  var PERIODS = [
    { id: 'p1', label: '1–14 октября',  from: '2026-10-01', to: '2026-10-14', closed: true  },
    { id: 'p2', label: '15–28 октября', from: '2026-10-15', to: '2026-10-28', closed: false }
  ];

  /* ── учителя ──────────────────────────────────────────────────────── */
  var TEACHERS = [
    { id: 't1', name: 'Айгерім Нұрлан', phone: '77015550000', rate: 1150,
      bio: 'Десять лет в школе, пять — онлайн. Готовит к IELTS и ведёт разговорные клубы для подростков.',
      slots: 'mon@18:00,wed@18:00,fri@18:00,tue@18:30,thu@18:30' },
    { id: 't2', name: 'Гүлнара Сериковна', phone: '77025551111', rate: 1300,
      bio: 'Восемь лет с детьми 7–12: игра, песни, пересказ. Любит, когда к уроку приходит вся семья.',
      slots: 'tue@16:00,thu@16:00,sat@16:00,tue@17:00,thu@17:00,sat@17:00,tue@17:30,thu@17:30' },
    { id: 't3', name: 'Дана Абылкасымова', phone: '77035552222', rate: 1400,
      bio: 'Взрослые и подростки с A2 и выше. Разговорный английский, IELTS, английский для учёбы и переезда.',
      slots: 'tue@19:00,thu@19:00,mon@19:30,wed@19:30,fri@19:30' }
  ];

  /* ── ученики ────────────────────────────────────────────────────────
     Семь индивидуальных учеников. Разные уровни, разные даты старта,
     разные ставки (1150–1500) и разный период оплаты — то, что на
     общем списке теряется, а здесь видно в одну строку. */
  var STUDENTS = [
    { id: 's1', name: 'Аяжан', phone: '77011234567', teacher: 't1', level: 'pre-intermediate',
      started: '2026-08-12', days: 'mon,wed,fri', time: '18:00', rate: 1150,
      pay: 'Помесячно, 1-го числа', goal: 'Сдать IELTS на 6.5 к лету',
      note: 'Стесняется говорить вслух, но письменные задания делает быстро.',
      nextCourse: 6,
      lessons: [
        { id: 's1a', period: 'p1', date: '2026-10-02', courseId: 'p3', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's1b', period: 'p1', date: '2026-10-05', courseId: 'p3', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's1c', period: 'p1', date: '2026-10-07', courseId: 'p4', teacherDone: true,  client: 'yes', quality: 4 },
        { id: 's1d', period: 'p1', date: '2026-10-09', courseId: 'p4', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's1e', period: 'p1', date: '2026-10-12', courseId: 'p5', teacherDone: true,  client: 'no',  quality: null },
        { id: 's1f', period: 'p1', date: '2026-10-14', courseId: 'p5', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's1g', period: 'p2', date: '2026-10-16', courseId: 'p6', teacherDone: true,  client: null,  quality: null }
      ] },
    { id: 's2', name: 'Тимур', phone: '77029876543', teacher: 't3', level: 'intermediate',
      started: '2026-09-02', days: 'tue,thu', time: '19:00', rate: 1400,
      pay: 'Каждые две недели', goal: 'Переезд в Канаду, IELTS 7.0',
      note: 'Занимается с июня, темп быстрый.',
      nextCourse: 9,
      lessons: [
        { id: 's2a', period: 'p1', date: '2026-10-01', courseId: 'i7', teacherDone: true, client: null, quality: null },
        { id: 's2b', period: 'p1', date: '2026-10-06', courseId: 'i7', teacherDone: true, client: null, quality: null },
        { id: 's2c', period: 'p1', date: '2026-10-08', courseId: 'i8', teacherDone: true, client: null, quality: null },
        { id: 's2d', period: 'p1', date: '2026-10-13', courseId: 'i8', teacherDone: true, client: null, quality: null },
        { id: 's2e', period: 'p2', date: '2026-10-15', courseId: 'i9', teacherDone: true, client: null, quality: null }
      ] },
    { id: 's3', name: 'Диана', phone: '77031112233', teacher: 't2', level: 'elementary',
      started: '2026-09-20', days: 'tue,thu,sat', time: '17:00', rate: 1150,
      pay: 'Помесячно, 20-го числа', goal: 'Школьная программа на 5',
      note: 'Приходит с братом, вдвоём работают лучше.',
      nextCourse: 4,
      lessons: [
        { id: 's3a', period: 'p1', date: '2026-10-01', courseId: 'e2', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's3b', period: 'p1', date: '2026-10-06', courseId: 'e2', teacherDone: true,  client: 'yes', quality: 5 },
        { id: 's3c', period: 'p1', date: '2026-10-08', courseId: 'e3', teacherDone: false, client: 'yes', quality: 5 },
        { id: 's3d', period: 'p1', date: '2026-10-13', courseId: 'e3', teacherDone: true,  client: 'yes', quality: 2,
          note: 'Урок был, но половину времени не работал микрофон.' },
        { id: 's3e', period: 'p2', date: '2026-10-15', courseId: 'e4', teacherDone: true,  client: null,  quality: null }
      ] },
    { id: 's4', name: 'Арман', phone: '77045556677', teacher: 't1', level: 'pre-intermediate',
      started: '2026-09-28', days: 'tue,thu', time: '18:30', rate: 1150,
      pay: 'Помесячно, 1-го числа', goal: 'Разговорный для поездок',
      note: 'Спокойный, пунктуальный.',
      nextCourse: 3,
      lessons: [
        { id: 's4a', period: 'p1', date: '2026-10-02', courseId: 'p2', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's4b', period: 'p1', date: '2026-10-07', courseId: 'p2', teacherDone: true, client: 'yes', quality: 4 },
        { id: 's4c', period: 'p1', date: '2026-10-09', courseId: 'p3', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's4d', period: 'p2', date: '2026-10-16', courseId: 'p3', teacherDone: true, client: null, quality: null }
      ] },
    { id: 's5', name: 'Аружан', phone: '77056667788', teacher: 't2', level: 'beginner',
      started: '2026-10-05', days: 'tue,thu,sat', time: '16:00', rate: 1150,
      pay: 'Помесячно, 10-го числа', goal: 'С нуля, хочет понимать мультики',
      note: 'Первый месяц, только знакомство.',
      nextCourse: 1,
      lessons: [
        { id: 's5a', period: 'p1', date: '2026-10-06', courseId: 'b1', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's5b', period: 'p2', date: '2026-10-15', courseId: 'b2', teacherDone: true, client: null, quality: null }
      ] },
    { id: 's6', name: 'Ерасыл', phone: '77067778899', teacher: 't3', level: 'intermediate',
      started: '2026-06-15', days: 'mon,wed,fri', time: '19:30', rate: 1500,
      pay: 'Помесячно, 5-го числа', goal: 'IELTS 8.0 для NYU Shanghai',
      note: 'Занимается с июня, сильный ученик.',
      nextCourse: 12,
      lessons: [
        { id: 's6a', period: 'p1', date: '2026-10-01', courseId: 'i10', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's6b', period: 'p1', date: '2026-10-03', courseId: 'i10', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's6c', period: 'p1', date: '2026-10-06', courseId: 'i11', teacherDone: true, client: 'yes', quality: 4 },
        { id: 's6d', period: 'p1', date: '2026-10-08', courseId: 'i11', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's6e', period: 'p1', date: '2026-10-10', courseId: 'i12', teacherDone: true, client: 'yes', quality: 5 },
        { id: 's6f', period: 'p1', date: '2026-10-13', courseId: 'i12', teacherDone: true, client: 'yes', quality: 4 },
        { id: 's6g', period: 'p2', date: '2026-10-15', courseId: 'i13', teacherDone: true, client: null, quality: null }
      ] },
    { id: 's7', name: 'Мадина', phone: '77078889900', teacher: 't2', level: 'elementary',
      started: '2026-10-06', days: 'tue,thu', time: '17:30', rate: 1200,
      pay: 'Каждые две недели', goal: 'Подтянуть оценки',
      note: 'Только начала, стесняется.',
      nextCourse: 2,
      lessons: [
        { id: 's7a', period: 'p1', date: '2026-10-07', courseId: 'e1', teacherDone: true, client: 'yes', quality: 4 },
        { id: 's7b', period: 'p2', date: '2026-10-15', courseId: 'e2', teacherDone: true, client: null, quality: null }
      ] }
  ];

  var RATE = 1150;

  /* ── мелочи ──────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; }
  function initial(name) { var n = String(name || '').trim(); return n ? n[0].toUpperCase() : '?'; }
  function dateRu(iso) {
    if (!iso) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p[2] + '.' + p[1] + '.' + p[0].slice(2);
  }
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    return n + ' ' + (m10 === 1 && m100 !== 11 ? one
      : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many);
  }
  function period(id) { return PERIODS.filter(function (p) { return p.id === id; })[0]; }
  function byId(id) { return STUDENTS.filter(function (s) { return s.id === id; })[0]; }
  function byTeacher(id) { return TEACHERS.filter(function (t) { return t.id === id; })[0]; }
  function phoneFmt(p) {
    var d = String(p || '').replace(/\D/g, '');
    return d.length === 11
      ? '+' + d[0] + ' (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + ' ' + d.slice(7, 9) + ' ' + d.slice(9)
      : (p || '—');
  }
  function dayNames(csv) {
    var DAYS = [['mon','Пн'],['tue','Вт'],['wed','Ср'],['thu','Чт'],['fri','Пт'],['sat','Сб'],['sun','Вс']];
    var set = String(csv || '').split(',');
    return DAYS.filter(function (d) { return set.indexOf(d[0].trim()) >= 0; })
               .map(function (d) { return d[1]; }).join(', ');
  }
  function monthRu(key) {
    if (!/^\d{4}-\d{2}$/.test(key)) return key;
    var names = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль',
                 'Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    return names[Number(key.slice(5, 7)) - 1] + ' ' + key.slice(0, 4);
  }

  /* ── курс школы: готовые уроки, слова и задания ─────────────────────
     Учитель не составляет урок с нуля: берёт следующий по счёту урок
     уровня из app/course.js — тема, правило, слова и задания уже сняты
     с методички. Темы и домашка в журнале берутся оттуда же, поэтому
     на всех экранах они настоящие. */
  function levelOf(s) {
    return (global.COURSE.levels || []).filter(function (l) { return l.id === s.level; })[0];
  }
  function plan(s, n) {
    var lv = levelOf(s);
    var L = lv && lv.lessons[n - 1];
    if (!L) return null;
    var c = (global.CONTENT || {})[L.id] || {};
    var words = (c.words || []).map(function (w) { return w.en; });
    var tasks = c.tasks || [];
    var choice = tasks.filter(function (t) { return t.t === 'choice'; }).length;
    var order  = tasks.filter(function (t) { return t.t === 'order'; }).length;
    return {
      id: L.id, n: n, title: L.title, subtitle: L.subtitle, rule: c.rule || '',
      words: words,
      topic: L.title + ' · ' + L.subtitle,
      homework: 'Слова: ' + words.join(', ') + '. Задания: ' + tasks.length +
                ' (' + choice + ' выбор, ' + order + ' сборка предложения).'
    };
  }
  function courseBadge(s) {
    var lv = levelOf(s);
    return lv ? lv.code + ' ' + lv.title : s.level;
  }

  /* Темы и домашка журнала — из курса, а не выдуманы. */
  STUDENTS.forEach(function (s) {
    s.lessons.forEach(function (l) {
      var p = plan(s, Number(String(l.courseId).slice(1)) || 1);
      if (p) { l.topic = p.topic; l.homework = p.homework; }
    });
  });

  /* ── деньги и расхождения ──────────────────────────────────────────
     Начислено — по отметкам учителя. Подтверждено — клиент сказал «да»
     и качество выше двух, либо администратор разобрал спор в пользу
     урока. Остальное висит «на проверке» и в выплату не уходит. */
  function stat(s) {
    var out = { accrued: 0, confirmed: 0, hold: 0, lessons: 0, okCount: 0, disputes: 0 };
    s.lessons.forEach(function (l) {
      if (!l.teacherDone || l.resolved === 'void') return;
      out.lessons++; out.accrued += s.rate;
      var low = l.quality != null && l.quality <= 2;
      var ok = l.resolved === 'paid' || (l.client === 'yes' && l.teacherDone && !low);
      if (ok) { out.confirmed += s.rate; out.okCount++; } else out.hold += s.rate;
      if (l.client === 'no' && !l.resolved) out.disputes++;
    });
    return out;
  }
  function totals() {
    var all = { accrued: 0, confirmed: 0, hold: 0, lessons: 0, disputes: 0 };
    STUDENTS.forEach(function (s) {
      var st = stat(s);
      all.accrued += st.accrued; all.confirmed += st.confirmed; all.hold += st.hold;
      all.lessons += st.lessons; all.disputes += st.disputes;
    });
    return all;
  }

  /* Очередь проверок выводится из данных: админ видит каждое расхождение
     сразу, как только клиент ответил. Четыре типа. */
  function tickets() {
    var out = [];
    STUDENTS.forEach(function (s) {
      PERIODS.forEach(function (p) {
        if (!p.closed) return;
        var les = s.lessons.filter(function (l) { return l.period === p.id; });

        var silent = les.filter(function (l) {
          return l.teacherDone && l.client === null && !l.resolved;
        });
        if (silent.length) out.push({ id: 'silent-' + s.id + '-' + p.id, kind: 'silent',
          student: s, period: p, lessons: silent });

        les.forEach(function (l) {
          if (l.resolved) return;
          if (l.teacherDone && l.client === 'no')
            out.push({ id: 'dispute-' + l.id, kind: 'dispute', student: s, period: p, lessons: [l] });
          if (!l.teacherDone && l.client === 'yes')
            out.push({ id: 'ghost-' + l.id, kind: 'ghost', student: s, period: p, lessons: [l] });
          if (l.teacherDone && l.client === 'yes' && l.quality != null && l.quality <= 2)
            out.push({ id: 'quality-' + l.id, kind: 'quality', student: s, period: p, lessons: [l] });
        });
      });
    });
    return out;
  }

  var TICK = {
    silent:  { tag: 'Клиент не ответил', cls: 'hold' },
    dispute: { tag: 'Учитель vs клиент', cls: 'bad' },
    ghost:   { tag: 'Учитель не отметил', cls: 'bad' },
    quality: { tag: 'Низкая оценка', cls: 'bad' }
  };

  function resolve(ticket, how) {
    var paid = how === 'paid';
    ticket.lessons.forEach(function (l) { l.resolved = paid ? 'paid' : 'void'; });
    if (ticket.kind === 'ghost' && paid) ticket.lessons.forEach(function (l) { l.teacherDone = true; });
    if (ticket.kind === 'silent') ticket.lessons.forEach(function (l) { l.resolved = paid ? 'paid' : 'void'; });
    return (ticket.kind === 'ghost' && paid) ? 'урок зачтён' : paid ? 'урок к выплате' : 'начисление снято';
  }

  /* ── запрос клиенту ─────────────────────────────────────────────────
     Период, который закрыт, но не подтверждён, ждёт ответа. Если всё
     подтверждено, клиент видит текущий период заранее. */
  function requestFor(s) {
    var i;
    for (i = 0; i < PERIODS.length; i++) {
      var p = PERIODS[i];
      var les = s.lessons.filter(function (l) { return l.period === p.id; });
      if (p.closed && les.length && les.some(function (l) { return l.client === null; })) return p;
    }
    for (i = PERIODS.length - 1; i >= 0; i--) {
      var q = PERIODS[i];
      if (s.lessons.some(function (l) { return l.period === q.id; })) return q;
    }
    return PERIODS[PERIODS.length - 1];
  }

  /* Ссылка из уведомления ведёт на клиентский экран контроля — в демо
     она рабочая: открывает форму подтверждения этого ученика. */
  var DEMO_URL = 'https://nazaralmaty.github.io/demo-platform/proverka.html?view=client&student=';
  function letter(s, p) {
    var n = s.lessons.filter(function (l) { return l.period === p.id && l.teacherDone; }).length;
    return 'GSC Study · ' + s.name + '. Учитель ' + byTeacher(s.teacher).name +
      ' отметил ' + plural(n, 'урок', 'урока', 'уроков') + ' за ' + p.label +
      '. Подтвердите, что уроки прошли и содержание устраивает: ' + DEMO_URL + s.id +
      ' Ответ — раз в две недели, занимает минуту. Если урок не прошёл или что-то не ' +
      'устроило — так и отметьте, администратор проверит.';
  }

  /* ── стартовый журнал ─────────────────────────────────────────────── */
  var SEED_LOG = [
    { at: '16.10 10:04', text: 'Запросы за 1–14 октября отправлены клиентам: 7 штук, SMS и WhatsApp' },
    { at: '16.10 11:20', text: 'Аяжан ответила: 5 уроков подтверждено, 12.10 отмечено как не прошедшее' },
    { at: '16.10 12:05', text: 'Диана ответила: 3 подтверждено, оценка 2 на уроке 13.10' },
    { at: '16.10 14:40', text: 'Арман, Аружан, Ерасыл, Мадина подтвердили уроки без замечаний' },
    { at: '16.10 15:30', text: 'Расхождения ушли администратору: 4 шт. (спор, молчание, урок без отметки, оценка 2)' }
  ];

  global.GSC = {
    periods: PERIODS, teachers: TEACHERS, students: STUDENTS, rate: RATE,
    esc: esc, money: money, dateRu: dateRu, initial: initial, phoneFmt: phoneFmt,
    plural: plural, period: period, byId: byId, byTeacher: byTeacher,
    dayNames: dayNames, monthRu: monthRu,
    levelOf: levelOf, plan: plan, courseBadge: courseBadge,
    stat: stat, totals: totals, tickets: tickets, TICK: TICK, resolve: resolve,
    requestFor: requestFor, letter: letter, demoUrl: DEMO_URL,
    seedLog: SEED_LOG
  };
})(window);
