/*!
 * Контроль уроков · один движок для демо-витрины и для живой платформы.
 *
 * Этот файл одинаковый в demo-platform и в 1english-platform: витрина
 * показывает ровно ту логику, которая считает деньги в настоящей школе.
 * Ничего не рисует и ни в какую базу не ходит — только правила.
 *
 * КАК УСТРОЕНО.
 *   Учитель отмечает урок «проведён» (taught). Это заявка, а не деньги.
 *   Два раза в месяц — за 1–15 и за 16–конец — клиенту уходит ссылка:
 *   он отвечает по каждому уроку «был / не было / не уверен» и ставит
 *   оценку. Подтверждённое клиентом уходит в выплату само. Всё остальное
 *   — спор, сомнение, низкая оценка, молчание, подозрительная отметка —
 *   встаёт в очередь администратора и не выплачивается, пока он не решит.
 *
 * ПРАВИЛО ВЫПЛАТЫ (то же самое считает триггер в базе, en_lesson_settle):
 *   review = 'paid'                                  → к выплате
 *   review = 'void'                                  → снят
 *   taught и клиент 'yes' и оценка не ниже 3 (или нет) → к выплате
 *   иначе                                            → не к выплате
 *
 * Строки уроков — в форме таблицы en_teacher_lessons: taught, taught_on,
 * taught_at, plan_date, client_answer, client_quality, client_note,
 * client_at, review. Карточка — en_teacher_students: days, rate.
 */
(function (global) {
  'use strict';

  var RATE = 1150;        /* ставка урока, если в карточке и у учителя пусто */
  var SILENT_DAYS = 2;    /* столько дней ждём ответа на запрос, потом «молчит» */
  var LATE_DAYS = 3;      /* урок отмечен позже — «задним числом» */
  var LOW_Q = 2;          /* оценка 2 и ниже — на проверку */
  var DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  /* ── даты ─────────────────────────────────────────────────────────────
     Всё строками YYYY-MM-DD и в UTC: дата урока — это день в календаре
     школы, а не момент времени, и часовой пояс браузера её сдвигать не
     должен. */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function day(x) {
    if (!x) return null;
    if (x instanceof Date) {
      return isNaN(x) ? null : x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate());
    }
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(x));
    return m ? m[1] + '-' + m[2] + '-' + m[3] : null;
  }
  function utc(iso) {
    var p = String(iso).split('-');
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function fromUtc(ms) {
    var d = new Date(ms);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function addDays(iso, n) { return fromUtc(utc(iso) + n * 864e5); }
  function diffDays(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
  function weekday(iso) { return DAY_KEYS[new Date(utc(iso)).getUTCDay()]; }
  function lastDay(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

  /* ── отчётные периоды: две половины месяца ───────────────────────────
     1–15 и 16–последнее. Не «каждые 14 дней от старта»: так у всех
     учеников периоды одинаковые, а зарплата выдаётся два раза в месяц
     одной ведомостью. */
  var MONTHS = {
    ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
         'августа', 'сентября', 'октября', 'ноября', 'декабря'],
    kk: ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде',
         'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан']
  };
  function period(iso) {
    iso = day(iso);
    if (!iso) return null;
    var y = +iso.slice(0, 4), m = +iso.slice(5, 7), d = +iso.slice(8, 10);
    var half = d <= 15 ? 1 : 2;
    var ym = y + '-' + pad(m);
    return {
      key: ym + '-' + half, half: half, y: y, m: m,
      from: ym + '-' + (half === 1 ? '01' : '16'),
      to: ym + '-' + (half === 1 ? '15' : pad(lastDay(y, m)))
    };
  }
  function periodByKey(key) {
    var m = /^(\d{4})-(\d{2})-([12])$/.exec(String(key || ''));
    return m ? period(m[1] + '-' + m[2] + '-' + (m[3] === '1' ? '01' : '16')) : null;
  }
  function prevPeriod(p) { return period(addDays(p.from, -1)); }
  function nextPeriod(p) { return period(addDays(p.to, 1)); }
  function isClosed(p, today) { return day(today) > p.to; }
  function lastClosed(today) { return prevPeriod(period(today)); }
  function inPeriod(iso, p) { return !!iso && iso >= p.from && iso <= p.to; }
  function periodLabel(p, lang) {
    var names = MONTHS[lang] || MONTHS.ru;
    var a = +p.from.slice(8, 10), b = +p.to.slice(8, 10);
    return a + '–' + b + ' ' + names[p.m - 1];
  }
  function dateLabel(iso, lang) {
    if (!iso) return '—';
    var names = MONTHS[lang] || MONTHS.ru;
    return +iso.slice(8, 10) + ' ' + names[+iso.slice(5, 7) - 1];
  }

  /* Даты уроков ученика по графику внутри периода: 'mon,wed,fri' → даты.
     С даты начала занятий, если она внутри периода. */
  function plannedDates(card, p) {
    var set = String((card && card.days) || '').split(',').map(function (s) { return s.trim(); })
      .filter(Boolean);
    if (!set.length) return [];
    var out = [], d = p.from;
    var start = day(card.started_on);
    while (d <= p.to) {
      if (set.indexOf(weekday(d)) >= 0 && (!start || d >= start)) out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }

  /* ── урок ─────────────────────────────────────────────────────────── */
  function dateOf(l) { return day(l.taught_on) || day(l.plan_date) || null; }
  function rateOf(card, teacher) {
    if (card && card.rate != null && card.rate !== '') return Number(card.rate);
    if (teacher && teacher.rate) return Number(teacher.rate);
    return RATE;
  }
  /* Ровно то же правило, что в базе. Отсюда его берут экраны, а тест
     сверяет его с триггером на одних и тех же случаях. */
  function payable(l) {
    if (l.review === 'paid') return true;
    if (l.review === 'void') return false;
    return !!l.taught && l.client_answer === 'yes' &&
           (l.client_quality == null || l.client_quality > LOW_Q);
  }

  /* Урок из базы до патча контроля знает только done — галочку админа.
     Читаем его как «проведён и засчитан админом»: так же его переносит и
     сам патч, и экран не врёт, пока патч не применён. */
  function legacy(l) {
    if (l.taught === undefined) {
      l.taught = !!l.done;
      if (l.done && !l.review) l.review = 'paid';
    }
    return l;
  }

  /* Статус урока. info — то, что видно только на фоне остальных уроков:
     молчит ли клиент по запросу и какие подозрения у отметки. */
  function status(l, info) {
    info = info || {};
    if (l.review === 'void') return 'void';
    if (l.review === 'paid') return 'paid';
    var a = l.client_answer;
    if (l.taught) {
      if (a === 'yes') return (l.client_quality != null && l.client_quality <= LOW_Q) ? 'lowq' : 'confirmed';
      if (a === 'no') return 'dispute';
      if (a === 'unsure') return 'unsure';
      if (info.flags && info.flags.length) return 'suspect';
      if (info.silent) return 'silent';
      return 'awaiting';
    }
    if (a === 'yes') return 'ghost';
    if (a === 'unsure') return 'unsure';
    if (a === 'no') return 'cancelled';
    return 'planned';
  }
  var BUCKET = {
    confirmed: 'payable', paid: 'payable', awaiting: 'awaiting',
    dispute: 'review', unsure: 'review', lowq: 'review', ghost: 'review',
    silent: 'review', suspect: 'review', void: 'voided',
    planned: 'none', cancelled: 'none'
  };

  var STATUS = {
    confirmed: { ru: 'Подтверждён',        tone: 'ok' },
    paid:      { ru: 'Зачтён админом',     tone: 'ok' },
    awaiting:  { ru: 'Ждёт клиента',       tone: 'wait' },
    silent:    { ru: 'Клиент молчит',      tone: 'warn' },
    suspect:   { ru: 'Подозрительно',      tone: 'bad' },
    dispute:   { ru: 'Клиент: не было',    tone: 'bad' },
    unsure:    { ru: 'Клиент не уверен',   tone: 'warn' },
    lowq:      { ru: 'Низкая оценка',      tone: 'warn' },
    ghost:     { ru: 'Учитель не отметил', tone: 'warn' },
    void:      { ru: 'Снят',               tone: 'mute' },
    planned:   { ru: 'По плану',           tone: 'mute' },
    cancelled: { ru: 'Не состоялся',       tone: 'mute' }
  };
  var FLAG = {
    offday:  'не по графику',
    overrun: 'сверх графика',
    late:    'отмечен задним числом',
    future:  'дата ещё не наступила',
    after:   'добавлен после ответа клиента'
  };
  /* Порядок очереди: сначала то, где кто-то, возможно, говорит неправду. */
  var KINDS = ['dispute', 'suspect', 'ghost', 'unsure', 'lowq', 'silent'];
  var KIND = {
    dispute: 'Учитель и клиент расходятся',
    suspect: 'Подозрительная отметка',
    ghost:   'Урок был, отметки нет',
    unsure:  'Клиент не уверен',
    lowq:    'Низкая оценка',
    silent:  'Клиент не ответил'
  };

  /* ── разбор всей школы ────────────────────────────────────────────────
     model = { teachers, cards, lessons, requests }. today — день школы.
     Возвращает каждую строку урока со статусом, очередь администратора
     и деньги. Всё, что рисуют экраны, берётся отсюда. */
  function index(list) {
    var m = {};
    (list || []).forEach(function (x) { m[x.id] = x; });
    return m;
  }
  function requestOf(model, cardId, key) {
    return (model.requests || []).filter(function (r) {
      return r.card_id === cardId && (r.period_key || (period(r.period_from) || {}).key) === key;
    })[0] || null;
  }
  function isSilent(req, today) {
    if (!req || req.answered_at) return false;
    var sent = day(req.sent_at || req.created_at);
    return !!sent && diffDays(sent, day(today)) >= SILENT_DAYS;
  }

  function analyze(model, today) {
    today = day(today);
    var cards = index(model.cards), teachers = index(model.teachers);
    var groups = {};   /* card|period → уроки, чтобы найти «сверх графика» */

    var rows = (model.lessons || []).map(function (l) {
      var card = cards[l.card_id] || {};
      var date = dateOf(l);
      var p = date ? period(date) : null;
      var row = { l: l, card: card, teacher: teachers[card.teacher_id] || null,
                  date: date, period: p, rate: rateOf(card, teachers[card.teacher_id]),
                  flags: [], status: null };
      if (p) {
        var g = card.id + '|' + p.key;
        (groups[g] = groups[g] || []).push(row);
      }
      return row;
    });

    /* Подозрения. Считаем только для отметок, которые ещё никто не
       подтвердил: клиент сказал «был» — значит был, хоть и в субботу. */
    Object.keys(groups).forEach(function (g) {
      var list = groups[g], card = list[0].card, p = list[0].period;
      var days = String(card.days || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      var req = requestOf(model, card.id, p.key);
      var expected = plannedDates(card, p).length;
      var taught = list.filter(function (r) { return r.l.taught; });
      /* В «сверх графика» попадают сначала уроки не в свой день: если
         учитель добавил субботу к пн-ср-пт, лишняя — суббота, а не
         последняя пятница. */
      taught.sort(function (a, b) {
        var ao = days.length && days.indexOf(weekday(a.date)) < 0 ? 1 : 0;
        var bo = days.length && days.indexOf(weekday(b.date)) < 0 ? 1 : 0;
        return (ao - bo) || a.date.localeCompare(b.date) || String(a.l.id).localeCompare(String(b.l.id));
      });
      taught.forEach(function (r, i) {
        var l = r.l, f = [];
        if (days.length && days.indexOf(weekday(r.date)) < 0) f.push('offday');
        if (days.length && expected && i >= expected) f.push('overrun');
        if (l.taught_at && diffDays(r.date, day(l.taught_at)) > LATE_DAYS) f.push('late');
        if (today && r.date > today) f.push('future');
        /* Сравниваем моменты, а не строки: база отдаёт +00:00, демо пишет +05:00. */
        if (req && req.answered_at && l.taught_at && Date.parse(l.taught_at) > Date.parse(req.answered_at)) f.push('after');
        r.flags = f;
        r.silent = isSilent(req, today);
      });
      list.forEach(function (r) { r.request = req; });
    });

    rows.forEach(function (r) {
      var unanswered = r.l.taught && !r.l.client_answer && !r.l.review;
      r.status = status(r.l, { flags: unanswered ? r.flags : [], silent: r.silent });
      r.bucket = BUCKET[r.status];
    });

    return { today: today, rows: rows, tickets: ticketsOf(rows) };
  }

  function ticketsOf(rows) {
    var out = [], silent = {};
    rows.forEach(function (r) {
      var s = r.status;
      if (s === 'silent') {
        var k = r.card.id + '|' + r.period.key;
        var t = silent[k];
        if (!t) {
          t = silent[k] = { id: 'silent-' + r.card.id + '-' + r.period.key, kind: 'silent',
                            card: r.card, teacher: r.teacher, period: r.period,
                            request: r.request, rows: [], sum: 0 };
          out.push(t);
        }
        t.rows.push(r); t.sum += r.rate;
      } else if (KINDS.indexOf(s) >= 0) {
        out.push({ id: s + '-' + r.l.id, kind: s, card: r.card, teacher: r.teacher,
                   period: r.period, request: r.request, rows: [r], sum: r.rate });
      }
    });
    out.forEach(function (t) {
      t.rows.sort(function (a, b) { return a.date.localeCompare(b.date); });
      t.date = t.rows[0].date;
    });
    out.sort(function (a, b) {
      return (KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind)) || a.date.localeCompare(b.date) ||
             String(a.card.name).localeCompare(String(b.card.name));
    });
    return out;
  }

  /* Деньги по любому набору строк. claimed — что учитель заявил своими
     отметками; дальше каждая строка лежит ровно в одной корзине. */
  function money(rows) {
    var m = { claimed: 0, payable: 0, awaiting: 0, review: 0, voided: 0,
              n: { claimed: 0, payable: 0, awaiting: 0, review: 0, voided: 0 } };
    rows.forEach(function (r) {
      if (r.l.taught) { m.claimed += r.rate; m.n.claimed++; }
      if (r.bucket && r.bucket !== 'none') { m[r.bucket] += r.rate; m.n[r.bucket]++; }
    });
    return m;
  }
  function pick(an, fn) { return an.rows.filter(fn); }
  function forPeriod(an, p) { return pick(an, function (r) { return r.period && r.period.key === p.key; }); }
  function forCard(an, id) { return pick(an, function (r) { return r.card.id === id; }); }
  function forTeacher(an, id) { return pick(an, function (r) { return r.card.teacher_id === id; }); }

  /* Ведомость за период: каждому учителю — подтверждённые уроки этого
     периода по ставкам своих учеников. */
  function payroll(an, p, teachers) {
    return (teachers || []).map(function (t) {
      var rows = forPeriod(an, p).filter(function (r) { return r.card.teacher_id === t.id; });
      var mm = money(rows);
      return { teacher: t, money: mm,
               students: Object.keys(index(rows.map(function (r) { return r.card; }))).length };
    });
  }

  /* ── тексты сообщений ─────────────────────────────────────────────────
     Имена, числа и ссылку подставляет система — администратор руками не
     пишет ничего. ru и kk: клиенты 1English — казахоязычные родители. */
  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    return n + ' ' + (m10 === 1 && m100 !== 11 ? one
      : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many);
  }
  /* Имена в текстах не склоняются и род не угадывается: «ученик: Аяжан,
     учитель: Айгерім» читается правильно при любом имени. */
  var TEXT = {
    request: {
      ru: function (o) {
        return 'Здравствуйте! Это ' + o.school + '. Ученик: ' + o.student + ', учитель: ' + o.teacher +
          '. За ' + periodLabel(o.period, 'ru') + ' в журнале ' + plural(o.count, 'урок', 'урока', 'уроков') +
          '. Подтвердите, пожалуйста, что они прошли, — это минута: ' + o.url;
      },
      kk: function (o) {
        return 'Сәлеметсіз бе! Бұл — ' + o.school + '. Оқушы: ' + o.student + ', мұғалім: ' + o.teacher +
          '. ' + periodLabel(o.period, 'kk') + ' аралығында журналда ' + o.count +
          ' сабақ белгіленді. Сабақтардың өткенін растаңызшы — бір минут қана: ' + o.url;
      }
    },
    reminder: {
      ru: function (o) {
        return o.school + ': напоминаем — уроки за ' + periodLabel(o.period, 'ru') + ' (ученик: ' + o.student +
          ') ещё не подтверждены. Это минута: ' + o.url + ' Ваш ответ помогает нам следить за качеством занятий.';
      },
      kk: function (o) {
        return o.school + ': еске саламыз — ' + periodLabel(o.period, 'kk') + ' сабақтары (оқушы: ' + o.student +
          ') әлі расталмаған. Бір минут қана: ' + o.url + ' Жауабыңыз сабақ сапасын бақылауға көмектеседі.';
      }
    }
  };
  function text(kind, o, lang) { return (TEXT[kind][lang] || TEXT[kind].ru)(o); }

  /* Сообщение администратору по строке очереди: одна фраза, сумма и
     что сделать. */
  function alertText(t) {
    var r = t.rows[0], who = t.card.name, d = dateLabel(r.date, 'ru');
    var money = String(t.sum).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    switch (t.kind) {
      case 'dispute': return who + ', ' + d + ': учитель отметил урок, клиент ответил «не было». ' + money + ' на проверке.';
      case 'suspect': return who + ', ' + d + ': ' + r.flags.map(function (f) { return FLAG[f]; }).join(', ') +
                             '. Клиент этот урок не подтверждал. ' + money + ' на проверке.';
      case 'ghost':   return who + ', ' + d + ': клиент подтвердил урок, которого нет в журнале учителя.';
      case 'unsure':  return who + ', ' + d + ': клиент не уверен, был ли урок' +
                             (r.l.client_note ? ' — «' + r.l.client_note + '»' : '') + '.';
      case 'lowq':    return who + ', ' + d + ': урок подтверждён, оценка ' + r.l.client_quality + ' из 5' +
                             (r.l.client_note ? ' — «' + r.l.client_note + '»' : '') + '.';
      default:        return who + ': не ответил на запрос за ' + periodLabel(t.period, 'ru') + ' (' +
                             plural(t.rows.length, 'урок', 'урока', 'уроков') + ', ' + money + ').';
    }
  }
  function waLink(phone, msg) {
    var d = String(phone || '').replace(/\D/g, '');
    if (d.length === 11 && d[0] === '8') d = '7' + d.slice(1);
    return 'https://wa.me/' + d + '?text=' + encodeURIComponent(msg);
  }

  global.CTRL = {
    RATE: RATE, SILENT_DAYS: SILENT_DAYS, LATE_DAYS: LATE_DAYS, LOW_Q: LOW_Q,
    day: day, addDays: addDays, diffDays: diffDays, weekday: weekday,
    period: period, periodByKey: periodByKey, prevPeriod: prevPeriod, nextPeriod: nextPeriod,
    isClosed: isClosed, lastClosed: lastClosed, inPeriod: inPeriod,
    periodLabel: periodLabel, dateLabel: dateLabel, plannedDates: plannedDates,
    dateOf: dateOf, rateOf: rateOf, payable: payable, status: status, legacy: legacy,
    STATUS: STATUS, FLAG: FLAG, KIND: KIND, KINDS: KINDS, BUCKET: BUCKET,
    analyze: analyze, money: money, forPeriod: forPeriod, forCard: forCard,
    forTeacher: forTeacher, payroll: payroll, requestOf: requestOf, isSilent: isSilent,
    text: text, alertText: alertText, waLink: waLink, plural: plural
  };
})(typeof window !== 'undefined' ? window : globalThis);
