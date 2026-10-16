/*!
 * Школа · что ученик получил и что делал сам.
 *
 * Поверх журнала уроков (app/control.js) — действия ученика в платформе:
 * видео, слова, задания, чтение, игры, входы. Из них три ответа, которые
 * нужны владельцу школы:
 *
 *   1. Методика. Урок — урок курса. До урока ученик смотрит видео, после —
 *      делает домашку в платформе. Видно, кто это соблюдает: и ученики, и
 *      учителя.
 *   2. Гарантия. Школа гарантирует результат тому, кто учится. Здесь —
 *      выполняет ли ученик условия: посещаемость, домашка, результат.
 *   3. Возврат. Клиент просит вернуть всё через неделю. Здесь — что он уже
 *      получил: принятая оферта, доступ к платформе, проведённые и
 *      подтверждённые им самим уроки, — и сколько школа удерживает по своим
 *      правилам.
 *
 * Ничего не рисует и не хранит. Событие платформы:
 *   { card_id, at, kind: login|video|words|tasks|text|game, lesson, part,
 *     minutes, right, total }
 * Договор ученика (card.contract):
 *   { title, price, lessons, paid_at, offer_at, offer_version, guarantee }
 */
(function (global) {
  'use strict';
  var C = global.CTRL;

  /* Правила школы по умолчанию. Каждая школа ставит свои — в демо они
     правятся на экране «Гарантии и возвраты». */
  var POLICY = {
    platform_fee: 40000,   /* доступ к платформе: не возвращается после первого входа */
    attendance: 90,        /* гарантия: посещаемость не ниже, % */
    homework: 80,          /* гарантия: домашка в платформе не ниже, % */
    score: 70,             /* гарантия: средний результат заданий не ниже, % */
    hw_days: 2             /* домашка засчитывается, если сделана за столько дней после урока */
  };

  var KIND = { login: 'Вход в платформу', video: 'Видеоурок', words: 'Слова урока', tasks: 'Задания',
               text: 'Чтение', game: 'Игра' };

  function pct(a, b) { return b ? Math.round(a / b * 100) : null; }
  function startOf(l, card) { return C.dateOf(l) + 'T' + (card.time_at || '00:00') + ':00+05:00'; }

  /* ── факты по ученику ─────────────────────────────────────────────────
     an — разбор CTRL.analyze по всей школе, events — все события платформы.
     Только прошедшие занятия: сегодняшнее ещё не прошло. */
  function facts(card, an, events, today, policy) {
    policy = policy || POLICY;
    today = C.day(today);
    var mine = (events || []).filter(function (e) { return e.card_id === card.id; })
      .sort(function (a, b) { return String(a.at).localeCompare(String(b.at)); });
    var rows = C.forCard(an, card.id).filter(function (r) { return r.date && r.date < today; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });

    var sessions = rows.map(function (r) {
      var l = r.l, program = !!l.course_id, start = startOf(l, card);
      var held = (l.taught || l.client_answer === 'yes') && l.client_answer !== 'no' && l.review !== 'void';
      var disputed = l.taught && l.client_answer === 'no' && !l.review;
      var s = { r: r, l: l, date: r.date, program: program, scheduled: !!l.plan_date,
                held: held, disputed: disputed, missed: !held && !disputed,
                prep: null, hw: null, hwDue: null, hwScore: null };
      if (program) {
        /* подготовка: видео этой части урока — до начала занятия */
        s.prep = mine.some(function (e) {
          return e.kind === 'video' && e.lesson === l.course_id && e.part === l.part &&
                 Date.parse(e.at) < Date.parse(start);
        });
        /* домашка: слова после «правила», задания после «практики» — за
           hw_days дней после урока. Срок ещё не вышел — не считаем. */
        if (held) {
          s.hwDue = C.addDays(r.date, policy.hw_days);
          var kind = l.part ? 'tasks' : 'words';
          var hit = mine.filter(function (e) {
            return e.kind === kind && e.lesson === l.course_id && Date.parse(e.at) >= Date.parse(start) &&
                   C.day(e.at) <= s.hwDue;
          })[0];
          if (hit) { s.hw = true; if (hit.total && hit.right != null) s.hwScore = pct(hit.right, hit.total); }
          else s.hw = s.hwDue < today ? false : null;
        }
      }
      return s;
    });

    var sched = sessions.filter(function (s) { return s.scheduled; });
    var att = { held: sched.filter(function (s) { return s.held; }).length,
                missed: sched.filter(function (s) { return s.missed; }).length,
                disputed: sched.filter(function (s) { return s.disputed; }).length };
    att.pct = pct(att.held, att.held + att.missed);

    var prepList = sessions.filter(function (s) { return s.prep !== null && s.held; });
    var hwList = sessions.filter(function (s) { return s.hw !== null; });
    var tasks = mine.filter(function (e) { return e.kind === 'tasks' && e.total; });
    var right = tasks.reduce(function (a, e) { return a + e.right; }, 0);
    var total = tasks.reduce(function (a, e) { return a + e.total; }, 0);
    var from14 = C.addDays(today, -13), days = {}, lessonsOpened = {};
    mine.forEach(function (e) {
      if (C.day(e.at) >= from14 && C.day(e.at) <= today) days[C.day(e.at)] = 1;
      if (e.lesson) lessonsOpened[e.lesson] = 1;
    });
    var first = mine.filter(function (e) { return e.kind === 'login'; })[0] || mine[0] || null;

    return {
      card: card, sessions: sessions, events: mine, attendance: att,
      prep: { done: prepList.filter(function (s) { return s.prep; }).length, total: prepList.length },
      homework: { done: hwList.filter(function (s) { return s.hw; }).length, total: hwList.length },
      score: pct(right, total),
      program: { on: sessions.filter(function (s) { return s.program && s.held; }).length,
                 total: sessions.filter(function (s) { return s.held; }).length },
      activeDays14: Object.keys(days).length,
      firstLogin: first ? first.at : null,
      lastActive: mine.length ? mine[mine.length - 1].at : null,
      videoMin: mine.filter(function (e) { return e.kind === 'video'; }).reduce(function (a, e) { return a + (e.minutes || 0); }, 0),
      tasksDone: tasks.length, wordsDone: mine.filter(function (e) { return e.kind === 'words'; }).length,
      games: mine.filter(function (e) { return e.kind === 'game'; }).length,
      lessonsOpened: Object.keys(lessonsOpened).length
    };
  }
  function rate(x) { return x.total ? Math.round(x.done / x.total * 100) : null; }

  /* ── гарантия ────────────────────────────────────────────────────────
     ok — все условия выполнены; risk — не хватает до 10 пунктов;
     fail — дальше. Нет данных по условию — не нарушение. */
  function guarantee(f, policy) {
    policy = policy || POLICY;
    var g = (f.card.contract || {}).guarantee;
    if (!g) return { applies: false };
    var checks = [
      { key: 'attendance', label: 'Посещаемость', value: f.attendance.pct, need: policy.attendance,
        note: f.attendance.held + ' из ' + (f.attendance.held + f.attendance.missed) + ' занятий' },
      { key: 'homework', label: 'Домашка в платформе', value: rate(f.homework), need: policy.homework,
        note: f.homework.done + ' из ' + f.homework.total },
      { key: 'score', label: 'Результат заданий', value: f.score, need: policy.score,
        note: C.plural(f.tasksDone, 'набор', 'набора', 'наборов') + ' заданий' }
    ];
    var worst = 0;
    checks.forEach(function (c) {
      /* Нет данных — не нарушение, пока не было ни одной домашки по сроку.
         Задания ни разу не открывал, а домашка была — нарушение. */
      c.ok = c.value == null ? !(c.key === 'score' && f.homework.total) : c.value >= c.need;
      if (!c.ok) worst = Math.max(worst, c.need - (c.value || 0));
    });
    return { applies: true, goal: g, checks: checks,
             status: worst === 0 ? 'ok' : worst <= 10 ? 'risk' : 'fail' };
  }
  var GSTATUS = { ok: ['Условия выполняются', 'ok'], risk: ['Под угрозой', 'warn'], fail: ['Условия нарушены', 'bad'] };

  /* ── возврат ─────────────────────────────────────────────────────────
     Оказано — уроки, которые подтвердил клиент (или засчитал админ), по
     цене урока из договора, плюс доступ к платформе, если клиент в неё
     входил. Остальное — к возврату. Неподтверждённые уроки показываются
     отдельно: их судьбу решает контроль уроков. */
  function refund(f, policy) {
    policy = policy || POLICY;
    var c = f.card.contract || {};
    var paid = c.price || 0, lp = c.lessons ? Math.round(paid / c.lessons) : 0;
    var since = C.day(c.paid_at) || '0000-00-00';
    var inside = f.sessions.filter(function (s) { return s.date >= since; });
    var delivered = inside.filter(function (s) { return C.BUCKET[s.r.status] === 'payable'; });
    var pending = inside.filter(function (s) {
      return ['awaiting', 'silent', 'unsure', 'lowq', 'suspect', 'dispute', 'ghost'].indexOf(s.r.status) >= 0;
    });
    var feeApplies = !!f.firstLogin;
    var fee = feeApplies ? policy.platform_fee : 0;
    var retained = Math.min(paid, fee + delivered.length * lp);
    return { paid: paid, lessonPrice: lp, fee: fee, feeApplies: feeApplies,
             delivered: delivered, deliveredSum: delivered.length * lp,
             pending: pending, pendingSum: pending.length * lp,
             retained: retained, refund: paid - retained,
             /* если и спорные подтвердятся — сколько удержится */
             retainedMax: Math.min(paid, fee + (delivered.length + pending.length) * lp) };
  }

  /* ── методика по школе ──────────────────────────────────────────────── */
  function methodology(list) {
    var dev = [];
    list.forEach(function (f) {
      f.sessions.forEach(function (s) {
        if (s.held && !s.program && s.l.taught) {
          dev.push({ kind: 'offprog', f: f, date: s.date, text: s.l.topic || 'тема не указана' });
        }
      });
      /* подряд без домашки */
      var run = 0, best = 0;
      f.sessions.forEach(function (s) {
        if (s.hw === false) { run++; best = Math.max(best, run); }
        else if (s.hw === true) run = 0;
      });
      if (best >= 2) dev.push({ kind: 'nohw', f: f, count: best });
      var pr = rate(f.prep);
      if (pr != null && f.prep.total >= 3 && pr < 50) dev.push({ kind: 'noprep', f: f, value: pr });
    });
    return dev;
  }
  function verdict(f) {
    var p = rate(f.prep), h = rate(f.homework);
    if (p == null && h == null) return ['мало данных', 'mute'];
    if ((p == null || p >= 70) && (h == null || h >= 70)) return ['по методике', 'ok'];
    if ((p != null && p < 40) || (h != null && h < 40)) return ['не учится в платформе', 'bad'];
    return ['отстаёт', 'warn'];
  }

  /* Подготовился ли ученик к конкретному уроку: видео этой части урока
     до начала занятия. Нужно учителю до урока, а не после. */
  function prepared(l, card, events) {
    if (!l.course_id) return null;
    var start = startOf(l, card);
    return (events || []).some(function (e) {
      return e.card_id === card.id && e.kind === 'video' && e.lesson === l.course_id && e.part === l.part &&
             Date.parse(e.at) < Date.parse(start);
    });
  }

  /* ── акт об оказанных услугах ────────────────────────────────────────
     Текстом: его отдают клиенту и прикладывают к ответу на претензию.
     Всё в нём — из журнала, ничего не вписывается руками. */
  function money(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; }
  function stamp(ts) {
    if (!ts) return '—';
    var d = C.day(ts), t = /T(\d\d:\d\d)/.exec(ts);
    return C.dateLabel(d, 'ru') + ' ' + d.slice(0, 4) + (t ? ', ' + t[1] : '');
  }
  function act(f, r, o) {
    o = o || {};
    var c = f.card.contract || {}, P = o.policy || POLICY, L = [];
    L.push('АКТ ОБ ОКАЗАННЫХ УСЛУГАХ');
    L.push((o.school || 'Школа') + ' · ' + (o.offer || 'договор-оферта') + ' · составлен ' + C.dateLabel(C.day(o.today), 'ru') + ' ' + String(o.today).slice(0, 4));
    L.push('');
    L.push('Ученик: ' + f.card.name + (o.phone ? ', телефон ' + o.phone : '') + '. Программа: ' + (c.title || '—') + '.');
    L.push('Оплачено: ' + money(c.price) + ' (' + C.dateLabel(C.day(c.paid_at), 'ru') + ').');
    L.push('');
    L.push('1. Оферта принята в платформе: ' + stamp(c.offer_at) + '.');
    L.push('2. Доступ к образовательной платформе открыт: ' + stamp(f.firstLogin) + '. С тех пор: ' +
      'открыто уроков курса — ' + f.lessonsOpened + ', видеоуроков просмотрено на ' + f.videoMin + ' мин, ' +
      'наборов заданий выполнено — ' + f.tasksDone + (f.score != null ? ' (результат ' + f.score + '%)' : '') +
      ', повторений слов — ' + f.wordsDone + ', игр — ' + f.games + '. Последняя активность: ' + stamp(f.lastActive) + '.');
    L.push('3. Занятия с преподавателем, подтверждённые клиентом' + (r.delivered.some(function (s) { return s.l.review === 'paid'; }) ? ' или администратором' : '') + ': ' +
      (r.delivered.length ? r.delivered.map(function (s) {
        return C.dateLabel(s.date, 'ru') + (s.l.client_at ? ' (подтверждено ' + stamp(s.l.client_at) + ')' : '');
      }).join('; ') : 'нет') + '.');
    if (r.pending.length) {
      L.push('4. Занятия, по которым ответа клиента ещё нет или есть вопрос: ' +
        r.pending.map(function (s) { return C.dateLabel(s.date, 'ru'); }).join(', ') + '. В расчёт не включены.');
    }
    L.push('');
    L.push('РАСЧЁТ');
    L.push('Доступ к платформе (результат интеллектуальной деятельности школы, не возвращается после первого входа): ' +
      (r.feeApplies ? money(r.fee) : '0 ₸ — в платформу не входил'));
    L.push('Проведённые занятия: ' + r.delivered.length + ' × ' + money(r.lessonPrice) + ' = ' + money(r.deliveredSum));
    L.push('Удерживается: ' + money(r.retained) + (r.retained === r.paid && r.fee + r.deliveredSum > r.paid ? ' (не больше оплаченного)' : ''));
    L.push('К возврату: ' + money(r.refund));
    return L.join('\n');
  }

  /* ── справка о выполнении условий гарантии ────────────────────────────
     Ответ клиенту, который требует гарантию, а сам не учился: условия из
     оферты рядом с фактом из журнала, пропущенные домашки — по датам. */
  function proof(f, g, o) {
    o = o || {};
    var c = f.card.contract || {}, P = o.policy || POLICY, L = [];
    L.push('СПРАВКА О ВЫПОЛНЕНИИ УСЛОВИЙ ГАРАНТИИ');
    L.push((o.school || 'Школа') + ' · ' + (o.offer || 'договор-оферта') + ' · на ' + C.dateLabel(C.day(o.today), 'ru') + ' ' + String(o.today).slice(0, 4));
    L.push('');
    L.push('Ученик: ' + f.card.name + '. Программа: ' + (c.title || '—') + '. Гарантия: ' + g.goal + '.');
    L.push('Оферта принята: ' + stamp(c.offer_at) + '. Гарантия действует при выполнении условий:');
    g.checks.forEach(function (x) {
      L.push('— ' + x.label + ': нужно не ниже ' + x.need + '%, по журналу ' +
        (x.value == null ? 'нет данных' : x.value + '% (' + x.note + ')') + ' — ' + (x.ok ? 'выполнено' : 'НЕ выполнено') + '.');
    });
    var missed = f.sessions.filter(function (s) { return s.hw === false; });
    if (missed.length) {
      L.push('');
      L.push('Домашние задания в платформе не выполнены (срок — ' + C.plural(P.hw_days, 'день', 'дня', 'дней') + ' после урока): ' +
        missed.map(function (s) { return C.dateLabel(s.date, 'ru') + ' — ' + (s.l.topic || 'урок'); }).join('; ') + '.');
    }
    var noprep = f.sessions.filter(function (s) { return s.held && s.prep === false; });
    if (noprep.length) {
      L.push('Видеоурок перед занятием не открывался: ' + noprep.map(function (s) { return C.dateLabel(s.date, 'ru'); }).join(', ') + '.');
    }
    L.push('Активность в платформе: первый вход ' + stamp(f.firstLogin) + ', последний ' + stamp(f.lastActive) +
      '; активных дней за последние 2 недели — ' + f.activeDays14 + '; видеоуроков просмотрено на ' + f.videoMin + ' мин.');
    L.push('');
    L.push('Итог: ' + (g.status === 'ok' ? 'условия гарантии выполняются.' : 'условия гарантии не выполнены по причинам, зависящим от ученика.'));
    L.push('Данные — из журнала платформы: каждое действие ученика и каждый урок записаны с датой и временем.');
    return L.join('\n');
  }

  /* ── пункты оферты под правила школы ────────────────────────────────── */
  function clause(P, o) {
    P = P || POLICY; o = o || {};
    var school = o.school || 'Школа';
    return [
      'ВОЗВРАТ ПРИ ОТКАЗЕ ОТ ОБУЧЕНИЯ',
      '1. Доступ к образовательной платформе ' + school + ' (видеоуроки, задания, словари, тексты, личный кабинет) открывается при первом входе ' +
        'и с этого момента считается оказанной услугой. Стоимость доступа — ' + money(P.platform_fee) + '.',
      '2. При отказе Заказчика от обучения ему возвращается оплата за вычетом стоимости доступа к платформе (если Заказчик в неё входил) ' +
        'и стоимости проведённых занятий по цене одного занятия по выбранному тарифу. Удержание не превышает оплаченной суммы.',
      '3. Проведённым считается занятие, отмеченное преподавателем и подтверждённое Заказчиком в платформе или засчитанное администрацией по итогам проверки.',
      '4. Расчёт оформляется актом об оказанных услугах по данным платформы.',
      '',
      'ГАРАНТИЯ РЕЗУЛЬТАТА',
      '5. Гарантия действует, если за весь срок обучения Ученик выполнил условия: посещаемость занятий по графику — не ниже ' + P.attendance + '%; ' +
        'домашние задания в платформе, выполненные в течение ' + C.plural(P.hw_days, 'дня', 'дней', 'дней') + ' после урока, — не ниже ' + P.homework + '%; ' +
        'средний результат заданий в платформе — не ниже ' + P.score + '%.',
      '6. Выполнение условий учитывается платформой автоматически. Справка по журналу платформы предоставляется Заказчику по запросу.'
    ].join('\n');
  }

  global.SCHOOL = {
    POLICY: POLICY, KIND: KIND, GSTATUS: GSTATUS,
    facts: facts, rate: rate, guarantee: guarantee, refund: refund,
    methodology: methodology, verdict: verdict, prepared: prepared, act: act, proof: proof, clause: clause
  };
})(typeof window !== 'undefined' ? window : globalThis);
