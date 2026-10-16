/*!
 * Экран клиента: подтверждение уроков за две недели.
 *
 * Открывается по ссылке из WhatsApp на телефоне родителя или взрослого
 * ученика. Без входа и без пароля: ссылка сама и есть ключ — длинный
 * случайный токен на одного ученика и один период.
 *
 * Файл одинаковый в demo-platform и в 1english-platform. Откуда берутся
 * уроки и куда уходит ответ, решает адаптер:
 *   adapter.load(token)                → Promise<payload | null>
 *   adapter.submit(token, answers, note) → Promise<'ok' | текст ошибки>
 * payload = { school, student, teacher, period: {from, to}, answered_at,
 *             lessons: [{ id, date, topic, taught, answer, quality, locked }] }
 */
(function (global) {
  'use strict';
  var C = global.CTRL;

  var T = {
    ru: {
      title: '{student}: уроки за {period}',
      sub: 'Учитель: {teacher}. Отметьте по каждому уроку, как было, — это минута. Ответ видит только администратор школы.',
      yes: 'Был', no: 'Не было', unsure: 'Не уверен',
      unmarked: 'По графику — учитель не отметил. Урок был?',
      quality: 'Как прошёл урок?',
      locked: 'Решено администратором',
      note: 'Что-то не так? Напишите — администратор разберётся. Необязательно.',
      send: 'Отправить ответ', left: 'Ответьте по всем урокам — осталось {n}',
      sending: 'Отправляю…',
      again: 'Вы уже ответили {date}. Ответ можно изменить.',
      done: 'Спасибо! Ответ отправлен',
      doneSub: 'Администратор {school} видит ваш ответ. Если вы отметили «не было» или «не уверен», с вами свяжутся.',
      change: 'Изменить ответ',
      bad: 'Ссылка устарела или с ошибкой. Напишите в школу — пришлют новую.',
      empty: 'За этот период уроков нет.',
      fail: 'Не отправилось: {e}. Проверьте интернет и нажмите ещё раз.',
      wd: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
    },
    kk: {
      title: '{student}: {period} сабақтары',
      sub: 'Мұғалім: {teacher}. Әр сабақ бойынша қалай болғанын белгілеңіз — бір минут қана. Жауапты тек мектеп әкімшісі көреді.',
      yes: 'Болды', no: 'Болмады', unsure: 'Білмеймін',
      unmarked: 'Кесте бойынша — мұғалім белгілемеген. Сабақ болды ма?',
      quality: 'Сабақ қалай өтті?',
      locked: 'Әкімші шешті',
      note: 'Бірдеңе дұрыс емес пе? Жазыңыз — әкімші анықтайды. Міндетті емес.',
      send: 'Жауапты жіберу', left: 'Барлық сабаққа жауап беріңіз — {n} қалды',
      sending: 'Жіберілуде…',
      again: 'Сіз {date} жауап бердіңіз. Жауапты өзгертуге болады.',
      done: 'Рақмет! Жауабыңыз жіберілді',
      doneSub: '{school} әкімшісі жауабыңызды көреді. «Болмады» немесе «Білмеймін» деп белгілесеңіз, сізбен хабарласады.',
      change: 'Жауапты өзгерту',
      bad: 'Сілтеме ескірген немесе қате. Мектепке жазыңыз — жаңасын жібереді.',
      empty: 'Бұл кезеңде сабақ жоқ.',
      fail: 'Жіберілмеді: {e}. Интернетті тексеріп, қайта басыңыз.',
      wd: ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі']
    }
  };
  var STAR = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>';
  var OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fill(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] == null ? '' : o[k]; }); }

  function mount(root, adapter, opts) {
    opts = opts || {};
    var langKey = 'confirm.lang';
    var lang = (function () { try { return localStorage.getItem(langKey) || opts.lang || 'ru'; } catch (e) { return opts.lang || 'ru'; } })();
    var S = { data: null, answers: {}, note: '', state: 'load', error: '' };

    function t(k) { return (T[lang] || T.ru)[k]; }
    function whenLabel(iso) {
      var wd = t('wd')[new Date(iso + 'T12:00:00Z').getUTCDay()];
      return lang === 'kk' ? C.dateLabel(iso, 'kk') + ', ' + wd : wd + ', ' + C.dateLabel(iso, 'ru');
    }
    function top() {
      return '<div class="c-top">' + (opts.logo ? '<img src="' + esc(opts.logo) + '" alt="">' : '') +
        '<b>' + esc((S.data && S.data.school) || opts.school || '') + '</b>' +
        '<div class="c-lang" role="group" aria-label="Тіл / Язык">' + ['kk', 'ru'].map(function (l) {
          return '<button type="button" data-lang="' + l + '"' + (l === lang ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' +
            (l === 'kk' ? 'ҚАЗ' : 'РУС') + '</button>';
        }).join('') + '</div></div>';
    }

    function lessonCard(l) {
      var a = S.answers[l.id] || {};
      var cls = a.answer === 'yes' ? ' done' : a.answer === 'no' ? ' no' : '';
      if (l.locked) {
        return '<div class="c-les"><div class="when">' + esc(whenLabel(l.date)) + '</div>' +
          '<div class="topic">' + esc(l.topic || '') + '</div><span class="unmarked">' + t('locked') + '</span></div>';
      }
      return '<div class="c-les' + cls + '" data-les="' + esc(l.id) + '">' +
        '<div class="when">' + esc(whenLabel(l.date)) + '</div>' +
        '<div class="topic">' + esc(l.topic || '') + '</div>' +
        (l.taught ? '' : '<span class="unmarked">' + t('unmarked') + '</span>') +
        '<div class="c-ans" role="group">' + ['yes', 'no', 'unsure'].map(function (k) {
          return '<button type="button" class="' + k + (a.answer === k ? ' on' : '') + '" data-ans="' + k + '" aria-pressed="' +
            (a.answer === k) + '">' + t(k) + '</button>';
        }).join('') + '</div>' +
        (a.answer === 'yes'
          ? '<div class="c-q"><span>' + t('quality') + '</span><div class="c-stars" role="radiogroup" aria-label="' + t('quality') + '">' +
              [1, 2, 3, 4, 5].map(function (n) {
                return '<button type="button" role="radio" aria-checked="' + (a.quality === n) + '" aria-label="' + n + '" data-q="' + n + '"' +
                  ((a.quality || 0) >= n ? ' class="on"' : '') + '>' + STAR + '</button>';
              }).join('') + '</div></div>'
          : '') +
      '</div>';
    }

    function draw() {
      var d = S.data, html = top();
      if (S.state === 'load') html += '<p class="c-sub">…</p>';
      else if (S.state === 'bad' || !d) html += '<h1 class="c-h">:(</h1><p class="c-sub">' + t('bad') + '</p>';
      else if (S.state === 'done') {
        html += '<div class="c-done"><div class="ic">' + OK + '</div><h1 class="c-h">' + t('done') + '</h1>' +
          '<p class="c-sub">' + esc(fill(t('doneSub'), { school: d.school })) + '</p>' +
          '<button type="button" class="e-btn sec" id="cAgain">' + t('change') + '</button></div>';
      } else {
        var open = d.lessons.filter(function (l) { return !l.locked; });
        var left = open.filter(function (l) { return !(S.answers[l.id] || {}).answer; }).length;
        html += (opts.note ? '<div class="c-note">' + opts.note + '</div>' : '') +
          '<h1 class="c-h">' + esc(fill(t('title'), { student: d.student, period: C.periodLabel(d.period, lang) })) + '</h1>' +
          '<p class="c-sub">' + esc(fill(t('sub'), { teacher: d.teacher })) + '</p>' +
          (d.answered_at ? '<div class="c-note">' + esc(fill(t('again'), { date: C.dateLabel(C.day(d.answered_at), lang) })) + '</div>' : '') +
          (d.lessons.length ? d.lessons.map(lessonCard).join('') : '<p class="c-sub">' + t('empty') + '</p>') +
          (open.length ? '<textarea class="e-field" id="cNote" rows="3" placeholder="' + esc(t('note')) + '">' + esc(S.note) + '</textarea>' +
            (S.error ? '<p class="c-sub" style="color:var(--accent);margin:10px 0 0">' + esc(S.error) + '</p>' : '') +
            '<div class="c-send"><button type="button" class="e-btn" id="cSend"' + (left || S.state === 'send' ? ' disabled' : '') + '>' +
              (S.state === 'send' ? t('sending') : left ? fill(t('left'), { n: left }) : t('send')) + '</button></div>' : '');
      }
      root.innerHTML = html;
      wire();
    }

    function wire() {
      Array.prototype.forEach.call(root.querySelectorAll('[data-lang]'), function (b) {
        b.onclick = function () {
          lang = b.getAttribute('data-lang');
          try { localStorage.setItem(langKey, lang); } catch (e) {}
          draw();
        };
      });
      Array.prototype.forEach.call(root.querySelectorAll('[data-les]'), function (card) {
        var id = card.getAttribute('data-les');
        Array.prototype.forEach.call(card.querySelectorAll('[data-ans]'), function (b) {
          b.onclick = function () {
            var a = S.answers[id] = S.answers[id] || {};
            a.answer = b.getAttribute('data-ans');
            if (a.answer === 'yes' && !a.quality) a.quality = 5;
            keepNote(); draw();
          };
        });
        Array.prototype.forEach.call(card.querySelectorAll('[data-q]'), function (b) {
          b.onclick = function () { S.answers[id].quality = +b.getAttribute('data-q'); keepNote(); draw(); };
        });
      });
      var send = root.querySelector('#cSend');
      if (send) send.onclick = submit;
      var again = root.querySelector('#cAgain');
      if (again) again.onclick = function () { S.state = 'form'; draw(); };
    }
    function keepNote() { var n = root.querySelector('#cNote'); if (n) S.note = n.value; }

    function submit() {
      keepNote();
      S.state = 'send'; S.error = ''; draw();
      var out = {};
      S.data.lessons.forEach(function (l) {
        if (!l.locked && S.answers[l.id]) out[l.id] = S.answers[l.id];
      });
      Promise.resolve(adapter.submit(opts.token, out, S.note.trim())).then(function (res) {
        if (res === 'ok') {
          S.state = 'done';
          S.data.answered_at = new Date().toISOString();
          if (opts.onDone) opts.onDone();
        } else { S.state = 'form'; S.error = fill(t('fail'), { e: res }); }
        draw();
      }).catch(function (e) { S.state = 'form'; S.error = fill(t('fail'), { e: e.message || e }); draw(); });
    }

    draw();
    Promise.resolve(adapter.load(opts.token)).then(function (d) {
      if (!d) { S.state = 'bad'; draw(); return; }
      S.data = d;
      S.note = d.note || '';
      d.lessons.forEach(function (l) {
        if (l.answer) S.answers[l.id] = { answer: l.answer, quality: l.quality };
        if (l.note && !S.note) S.note = l.note;
      });
      S.state = 'form';
      draw();
    }).catch(function () { S.state = 'bad'; draw(); });
  }

  global.CONFIRM = { mount: mount, T: T };
})(window);
