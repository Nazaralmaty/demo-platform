/* Экосистема школы · общее для служебных экранов: шапка с навигацией,
   мелочи форматирования, окно, тост и перерисовка при смене данных.
   Данные и действия — в app/data.js, правила — в app/control.js. */
(function (global) {
  'use strict';
  var C = global.CTRL, D = global.DEMO;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸'; }
  function initial(name) { var n = String(name || '').trim(); return n ? n[0].toUpperCase() : '?'; }
  function phoneFmt(p) {
    var d = String(p || '').replace(/\D/g, '');
    return d.length === 11 ? '+' + d[0] + ' ' + d.slice(1, 4) + ' ' + d.slice(4, 7) + ' ' + d.slice(7, 9) + ' ' + d.slice(9) : (p || '—');
  }
  var WD = { mon: 'пн', tue: 'вт', wed: 'ср', thu: 'чт', fri: 'пт', sat: 'сб', sun: 'вс' };
  function dayShort(iso) { return WD[C.weekday(iso)]; }
  var MS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  /* «12 окт» — для узких колонок журнала. */
  function short(iso) { return iso ? +iso.slice(8, 10) + ' ' + MS[+iso.slice(5, 7) - 1] : '—'; }
  function dayNames(csv) {
    var order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], set = String(csv || '').split(',');
    return order.filter(function (d) { return set.indexOf(d) >= 0; }).map(function (d) { return WD[d]; }).join('-');
  }
  function time(ts) { var m = /T(\d{2}:\d{2})/.exec(String(ts || '')); return m ? m[1] : ''; }
  function when(ts) {
    var d = C.day(ts);
    if (!d) return '—';
    var t = time(ts);
    if (d === D.TODAY) return 'сегодня' + (t ? ', ' + t : '');
    if (d === C.addDays(D.TODAY, -1)) return 'вчера' + (t ? ', ' + t : '');
    return C.dateLabel(d, 'ru') + (t ? ', ' + t : '');
  }
  function plural(n, a, b, c) { return C.plural(n, a, b, c); }

  function chip(status) {
    var s = C.STATUS[status] || { ru: status, tone: 'mute' };
    return '<span class="e-chip ' + s.tone + '">' + esc(s.ru) + '</span>';
  }
  function flags(list) {
    return (list || []).map(function (f) { return '<span class="e-flag">' + esc(C.FLAG[f] || f) + '</span>'; }).join('');
  }
  function who(name, sub, cls) {
    return '<span class="e-who"><span class="e-ava' + (cls ? ' ' + cls : '') + '">' + esc(initial(name)) + '</span>' +
      '<span style="min-width:0"><b>' + esc(name) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></span>';
  }
  /* Полоска: подтверждено / ждёт / на проверке от заявленного. */
  function bar(m) {
    var total = m.payable + m.awaiting + m.review + m.voided;
    if (!total) return '<div class="e-bar"></div>';
    function seg(v, cls) { return v ? '<i class="' + cls + '" style="width:' + (v / total * 100).toFixed(2) + '%"></i>' : ''; }
    return '<div class="e-bar" role="img" aria-label="подтверждено ' + m.n.payable + ', ждёт ' + m.n.awaiting +
      ', на проверке ' + m.n.review + '">' + seg(m.payable, 'ok') + seg(m.awaiting, 'wait') + seg(m.review, 'bad') +
      seg(m.voided, 'mute') + '</div>';
  }

  var ICON = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.6-6.1c-.3-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.1-.7l.5-.6c.1-.2.1-.4 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.3-.9.9-1.1 2.2-.2 3.9a12 12 0 0 0 4.5 4.2c1.7.8 2.4.9 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2 0-.1-.2-.1-.5-.3z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ── шапка ──────────────────────────────────────────────────────────── */
  var NAV = [
    ['dashboard', 'dashboard.html', 'Обзор'],
    ['method', 'metodika.html', 'Методика'],
    ['control', 'proverka.html', 'Контроль'],
    ['guarantee', 'guarantee.html', 'Гарантии'],
    ['teacher', 'teacher.html', 'Учитель'],
    ['client', 'confirm.html', 'Клиент'],
    ['alerts', 'notifications.html', 'Оповещения'],
    ['student', 'index.html', 'Платформа']
  ];
  function shell(active) {
    var B = global.BRAND || {};
    var n = D.analyze().tickets.length;
    var top = document.createElement('header');
    top.className = 'e-top';
    top.innerHTML = '<div class="e-top-in">' +
      '<a class="e-brand" href="demo.html" title="К обложке демо"><img src="' + esc(B.logo || 'assets/brand-logo.png') +
        '" alt=""><b>' + esc(B.name || 'Школа') + '</b></a>' +
      '<nav class="e-nav" aria-label="Экраны">' + NAV.map(function (x) {
        return '<a href="' + x[1] + '"' + (x[0] === active ? ' class="on" aria-current="page"' : '') + '>' + x[2] +
          (x[0] === 'control' && n ? ' <span class="n" id="eNavN">' + n + '</span>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="e-demo" title="Демо-мир: выдуманная школа, всё живёт в этом браузере">' +
        '<i>Демо · пн, 19 октября</i><button type="button" id="eReset">Сбросить</button></div>' +
    '</div>';
    document.body.insertBefore(top, document.body.firstChild);
    top.querySelector('#eReset').onclick = function () {
      if (!confirm('Вернуть демо в исходное состояние? Все отметки и ответы, сделанные во время показа, пропадут.')) return;
      D.reset();
      toast('Демо сброшено');
    };
    D.onChange(function () {
      var k = D.analyze().tickets.length, el = document.getElementById('eNavN');
      var a = top.querySelector('a[href="proverka.html"]');
      if (el && !k) el.remove();
      else if (el) el.textContent = k;
      else if (k && a) a.insertAdjacentHTML('beforeend', ' <span class="n" id="eNavN">' + k + '</span>');
    });
    var on = active && document.querySelector('.e-nav a.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  /* ── окно, тост ─────────────────────────────────────────────────────── */
  var dlg = null;
  function open(html) {
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'e-dlg';
      document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    }
    dlg.innerHTML = '<div class="in">' + html + '</div>';
    if (!dlg.open) dlg.showModal();
    Array.prototype.forEach.call(dlg.querySelectorAll('[data-close]'), function (b) { b.onclick = close; });
    return dlg;
  }
  function close() { if (dlg && dlg.open) dlg.close(); }
  var tt = null;
  function toast(text) {
    var el = document.getElementById('eToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'eToast'; el.className = 'e-toast'; el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(function () { el.classList.remove('on'); }, 2800);
  }

  /* Экран рисуется функцией и перерисовывается при любой смене мира —
     своей или из соседней вкладки. Прокрутка остаётся на месте. */
  function mount(root, draw) {
    function go() {
      var y = window.scrollY;
      root.innerHTML = draw();
      if (draw.wire) draw.wire(root);
      window.scrollTo(0, y);
    }
    D.onChange(go);
    go();
    return go;
  }
  function on(root, sel, fn) {
    Array.prototype.forEach.call(root.querySelectorAll(sel), function (el) {
      el.addEventListener('click', function (e) { fn(el, e); });
    });
  }

  global.E = {
    esc: esc, money: money, initial: initial, phoneFmt: phoneFmt, dayShort: dayShort, dayNames: dayNames,
    short: short, when: when, time: time, plural: plural, chip: chip, flags: flags, who: who, bar: bar, ICON: ICON,
    shell: shell, open: open, close: close, toast: toast, mount: mount, on: on
  };
})(window);
