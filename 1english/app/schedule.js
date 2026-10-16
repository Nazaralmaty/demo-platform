/*!
 * 1English · недельная сетка графика.
 *
 * Один и тот же рисунок нужен в двух местах: админу в дашборде (вкладка
 * «Графики», где он ищет свободное окно и кликом его открывает) и учителю
 * в кабинете (тот же лист, только смотреть). Поэтому сетка живёт здесь, а
 * не двумя копиями, которые разойдутся на третьей правке.
 *
 * ЧТО ТАКОЕ СЛОТ. «День@время», например mon@18:00. Рабочий график учителя
 * — список таких слотов через запятую в en_teachers.slots. Занятость берётся
 * из карточек учеников: ученик с днями mon,wed,fri и временем 18:00 занимает
 * три слота. Урок считается часовым, поэтому слот — это время начала.
 */
(function (global) {
  'use strict';

  var DAYS = [['mon','Пн'],['tue','Вт'],['wed','Ср'],['thu','Чт'],
              ['fri','Пт'],['sat','Сб'],['sun','Вс']];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function slots(teacher) {
    return String((teacher && teacher.slots) || '').split(',')
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return /^[a-z]{3}@\d{1,2}:\d{2}$/.test(s); });
  }

  /* Кто когда занят. Архивные карточки место не держат. */
  function taken(cards) {
    var map = {};
    (cards || []).forEach(function (c) {
      if (c.archived || !c.time_at) return;
      String(c.days || '').split(',').forEach(function (d) {
        d = d.trim();
        if (!d) return;
        var key = d + '@' + c.time_at;
        (map[key] = map[key] || []).push(c);
      });
    });
    return map;
  }

  /* Какие строки показывать. Берём всё, что уже есть: рабочие слоты
     учителя и время его учеников. Ученик, попавший в час вне графика,
     обязан быть виден — иначе накладка не найдётся никогда. */
  function times(teacher, cards, extra) {
    var set = {};
    slots(teacher).forEach(function (s) { set[s.split('@')[1]] = 1; });
    (cards || []).forEach(function (c) { if (!c.archived && c.time_at) set[c.time_at] = 1; });
    (extra || []).forEach(function (t) { if (t) set[t] = 1; });
    return Object.keys(set).sort(function (a, b) {
      return (a.length - b.length) || a.localeCompare(b);
    });
  }

  function has(list, key) { return list.indexOf(key) >= 0; }

  /* Переключить слот. Возвращает новую строку для en_teachers.slots. */
  function toggle(teacher, day, time) {
    var list = slots(teacher), key = day + '@' + time;
    var i = list.indexOf(key);
    if (i >= 0) list.splice(i, 1); else list.push(key);
    return list.sort().join(',');
  }

  /* Сетка целиком. editable — админ: пустая ячейка кликается и становится
     рабочим окном, рабочая пустая — гасится обратно. Занятую не трогаем:
     время ученика меняется в его карточке, а не отсюда. */
  function grid(teacher, cards, editable, extra) {
    var work = slots(teacher), busy = taken(cards), rows = times(teacher, cards, extra);
    if (!rows.length) {
      return '<div class="sc-none">График не задан.' +
        (editable ? ' Добавьте время ниже — и отметьте, когда учитель ведёт.'
                  : ' Его заполняет администратор в дашборде.') + '</div>';
    }

    var free = 0, load = 0, out = '';
    out += '<div class="sc-wrap"><table class="sc"><thead><tr><th class="sc-t"></th>' +
      DAYS.map(function (d) { return '<th>' + d[1] + '</th>'; }).join('') + '</tr></thead><tbody>';

    rows.forEach(function (time) {
      out += '<tr><th class="sc-t">' + esc(time) + '</th>';
      DAYS.forEach(function (d) {
        var key = d[0] + '@' + time;
        var who = busy[key] || [];
        var on = has(work, key);
        if (who.length) {
          load += who.length;
          out += '<td class="sc-c busy"' + (editable ? ' data-slot="' + esc(key) + '"' : '') + '>' +
            who.map(function (c) {
              return '<span class="sc-who' + (c.format === 'group' ? ' g' : '') + '">' +
                     esc(c.name) + '</span>';
            }).join('') +
            (on ? '' : '<span class="sc-warn" title="Вне рабочего графика учителя">вне графика</span>') +
            '</td>';
        } else if (on) {
          free++;
          out += '<td class="sc-c free"' + (editable ? ' data-slot="' + esc(key) + '"' : '') +
                 '>свободно</td>';
        } else {
          out += '<td class="sc-c off"' + (editable ? ' data-slot="' + esc(key) + '"' : '') +
                 '>' + (editable ? '+' : '') + '</td>';
        }
      });
      out += '</tr>';
    });

    out += '</tbody></table></div>' +
      '<div class="sc-legend">' +
        '<span><i class="free"></i>свободно ' + free + '</span>' +
        '<span><i class="busy"></i>занято ' + load + '</span>' +
        '<span><i class="off"></i>не работает</span>' +
        (editable ? '<span class="sc-hint">Клик по клетке открывает и закрывает окно</span>' : '') +
      '</div>';
    return out;
  }

  /* Ближайший урок ученика — для плашки «скоро урок» в платформе.
     cards — ответ en_my_schedule(): [{days:'mon,wed', time:'18:00',
     planned:[{date:'2026-10-01'}]}]. Урок бывает по дням недели из
     графика и в дни, на которые учитель поставил дату в сетке. Смотрим
     неделю вперёд; урок, который идёт (len минут от начала), ещё ближайший.
     Возвращает { start: Date, left: мс до начала (меньше нуля — идёт) }
     или null, если графика нет. */
  var WEEK = ['sun','mon','tue','wed','thu','fri','sat'];   /* Date#getDay() → ключ */
  function next(cards, now, len) {
    len = (len || 60) * 60000;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var best = null;
    (cards || []).forEach(function (c) {
      var m = /^(\d{1,2}):(\d{2})/.exec(c.time || '');
      if (!m) return;
      var days = String(c.days || '').split(',').map(function (x) { return x.trim(); });
      var dates = (c.planned || []).map(function (p) { return p.date; });
      for (var d = 0; d <= 7; d++) {
        var st = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, +m[1], +m[2]);
        var date = st.getFullYear() + '-' + pad(st.getMonth() + 1) + '-' + pad(st.getDate());
        if (days.indexOf(WEEK[st.getDay()]) < 0 && dates.indexOf(date) < 0) continue;
        if (st.getTime() + len <= now.getTime()) continue;       /* уже закончился */
        if (!best || st < best.start) best = { start: st };
        break;
      }
    });
    if (best) best.left = best.start.getTime() - now.getTime();
    return best;
  }

  /* Стили сетки — рядом с разметкой, чтобы оба экрана рисовали одинаково.
     Вставляются один раз при загрузке файла. */
  var CSS =
    '.sc-wrap{overflow-x:auto}' +
    '.sc{width:100%;border-collapse:separate;border-spacing:5px;min-width:660px}' +
    '.sc th{font-size:11.5px;font-weight:700;color:var(--muted);letter-spacing:.06em;' +
      'text-transform:uppercase;padding:0 0 4px;text-align:center;border:0;background:none}' +
    '.sc th.sc-t{width:62px;text-align:right;padding-right:8px;font-variant-numeric:tabular-nums;' +
      'text-transform:none;font-size:13px;letter-spacing:0;vertical-align:middle}' +
    '.sc td{border:0}' +
    '.sc-c{height:46px;border-radius:12px;text-align:center;font-size:12.5px;padding:5px 6px;' +
      'vertical-align:middle;transition:transform .12s var(--ease),background .15s var(--ease)}' +
    '.sc-c.off{background:transparent;border:1px dashed var(--line);color:var(--faint);font-size:15px}' +
    '.sc-c.free{background:var(--ok-soft);color:var(--ok);font-weight:700}' +
    '.sc-c.busy{background:var(--navy);color:var(--on-navy);font-weight:700;line-height:1.25}' +
    '.sc-c[data-slot]{cursor:pointer}' +
    '.sc-c[data-slot]:hover{transform:scale(1.04)}' +
    '.sc-c.busy[data-slot]{cursor:default}.sc-c.busy[data-slot]:hover{transform:none}' +
    '.sc-who{display:block;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.sc-who.g::after{content:" · группа";font-weight:400;opacity:.7;font-size:11px}' +
    '.sc-warn{display:block;font-size:10px;font-weight:700;color:var(--accent);' +
      'background:var(--card);border-radius:6px;margin-top:3px}' +
    '.sc-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font-size:13px;color:var(--muted)}' +
    '.sc-legend span{display:inline-flex;align-items:center;gap:7px}' +
    '.sc-legend i{width:13px;height:13px;border-radius:5px;display:inline-block}' +
    '.sc-legend i.free{background:var(--ok-soft);border:1px solid var(--ok)}' +
    '.sc-legend i.busy{background:var(--navy)}' +
    '.sc-legend i.off{border:1px dashed var(--line)}' +
    '.sc-legend .sc-hint{margin-left:auto;color:var(--faint)}' +
    '.sc-none{padding:30px 18px;text-align:center;color:var(--muted);line-height:1.5}';

  if (global.document && !global.document.getElementById('sc-css')) {
    var st = global.document.createElement('style');
    st.id = 'sc-css'; st.textContent = CSS;
    global.document.head.appendChild(st);
  }

  global.SCHED = { DAYS: DAYS, slots: slots, taken: taken, times: times,
                   toggle: toggle, grid: grid, esc: esc, next: next, WEEK: WEEK };
})(window);
