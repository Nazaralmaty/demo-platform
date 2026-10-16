/*!
 * 1English · общий слой экранов: состояние, язык, повторение, таб-бар.
 *
 * Одно состояние на всё приложение лежит в localStorage под ключом '1eng'.
 * Пока это прототип — сервера нет; когда появится Supabase (Ф3), меняется
 * только тело App.save/App.load, экраны не трогаются.
 */
(function (global) {
  'use strict';

  var KEY = '1eng';
  var LANG_KEY = '1eng.lang';

  /* ── язык ──────────────────────────────────────────────────────────
     Казахский — основной. Русский заведён здесь же: переключатель
     включается правкой одного словаря, а не переразметкой экранов. */
  var DICT = {
    kk: {
      today:'Бүгін', map:'Жол', words:'Сөздік', games:'Ойын', me:'Профиль',
      streak:'күн қатарынан', continue:'Жалғастыру', start:'Бастау',
      done:'Дайын', locked:'Жабық', lesson:'Сабақ', week:'Апта',
      newWords:'Жаңа сөздер', repeat:'Қайталау', homework:'Үй тапсырмасы',
      zoom:'Zoom сабағы', check:'Тексеру', next:'Келесі', finish:'Аяқтау',
      right:'Дұрыс!', wrong:'Қате', yourLevel:'Сіздің деңгейіңіз',
      toRepeat:'Бүгін қайталау', learned:'Меңгерілген', minutes:'мин',
      voiceTask:'Дауыстық тапсырма', record:'Жазу', stop:'Тоқтату',
      sent:'Ұстазға жіберілді', noRepeat:'Бүгінге бәрі қайталанды 🎉',
      level:'Деңгей', module:'Модуль', changeLevel:'Деңгейді ауыстыру',
      exit:'Шығу', back:'Артқа'
    },
    ru: {
      today:'Сегодня', map:'Путь', words:'Словарь', games:'Игры', me:'Профиль',
      streak:'дней подряд', continue:'Продолжить', start:'Начать',
      done:'Готово', locked:'Закрыто', lesson:'Урок', week:'Неделя',
      newWords:'Новые слова', repeat:'Повторение', homework:'Домашнее задание',
      zoom:'Zoom-урок', check:'Проверить', next:'Дальше', finish:'Завершить',
      right:'Верно!', wrong:'Ошибка', yourLevel:'Ваш уровень',
      toRepeat:'Повторить сегодня', learned:'Выучено', minutes:'мин',
      voiceTask:'Голосовое задание', record:'Записать', stop:'Стоп',
      sent:'Отправлено преподавателю', noRepeat:'На сегодня всё повторено 🎉',
      level:'Уровень', module:'Модуль', changeLevel:'Сменить уровень',
      exit:'Выход', back:'Назад'
    }
  };

  function lang() { try { return localStorage.getItem(LANG_KEY) || 'kk'; } catch (e) { return 'kk'; } }
  function t(k) { var d = DICT[lang()] || DICT.kk; return d[k] || DICT.kk[k] || k; }

  /* ── состояние ─────────────────────────────────────────────────── */
  function blank() {
    return {
      user:   { name: '', phone: '', group: '' },
      level:  null,                 /* 'beginner' | 'elementary' — выбирает сам ученик */
      diag:   null,                 /* {level, score, at} — совет, а не приговор */
      monthly: [],                  /* результаты ежемесячного теста */
      units:  {},                   /* u1: {video, wordsDone, ex:{}, game, voice, test} */
      words:  {},                   /* en: {box, due, wrong} — очередь повторения */
      streak: { days: 0, last: '' },
      voice:  []                    /* [{unit, at, sec, status}] */
    };
  }

  var S = null;

  function load() {
    if (S) return S;
    try { S = JSON.parse(localStorage.getItem(KEY)) || blank(); }
    catch (e) { S = blank(); }
    /* состояние из старой версии прототипа не должно ронять экран */
    var b = blank();
    for (var k in b) if (!(k in S)) S[k] = b[k];
    return S;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function reset() { S = blank(); save(); }

  function unit(id) {
    var s = load();
    if (!s.units[id]) s.units[id] = { video: 0, wordsDone: false, ex: {}, game: false, voice: false, test: null };
    return s.units[id];
  }

  /* Шагов у урока четыре, а с видеосабаком — пять. Видео есть не у всех
     уроков, и «прогресс 4/5 навсегда» у урока без видео был бы враньём. */
  function steps(id) {
    var L = (window.LESSONS || {})[id];
    return (L && L.video) ? 5 : 4;
  }
  function stepsDone(id) {
    var u = load().units[id]; if (!u) return 0;
    var L = (window.LESSONS || {})[id], n = 0;
    if (L && L.video && u.video >= 1) n++;
    if (u.wordsDone) n++;
    if (Object.keys(u.ex).length >= 4) n++;
    if (u.game) n++;
    if (u.test != null) n++;
    return n;
  }
  function unitDone(id) { return stepsDone(id) >= steps(id); }
  function unitProgress(id) { return stepsDone(id) / steps(id); }

  /* Первый незакрытый готовый урок выбранного уровня. Если всё закрыто —
     последний, чтобы экран не оказался пустым. */
  function curUnit(course, level) {
    var ready = course.units.filter(function (u) { return u.level === level && u.ready; });
    if (!ready.length) return null;
    return ready.filter(function (u) { return !unitDone(u.id); })[0] || ready[ready.length - 1];
  }

  /* ── повторение ────────────────────────────────────────────────────
     Лейтнер на пять коробок. ponytail: это не FSRS — интервалы
     фиксированные, без модели забывания. Меняется на FSRS тогда, когда
     наберётся история ответов на сервере (Ф3), раньше её просто нет. */
  var STEPS = [0, 1, 3, 7, 16, 35];

  function today() { return new Date().toISOString().slice(0, 10); }
  function plusDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

  function seeWord(en, ok) {
    var s = load(), w = s.words[en] || (s.words[en] = { box: 0, due: today(), wrong: 0 });
    if (ok) w.box = Math.min(w.box + 1, STEPS.length - 1);
    else { w.box = Math.max(w.box - 1, 0); w.wrong++; }
    w.due = plusDays(STEPS[w.box]);
    save();
    return w;
  }
  function dueWords(all) {
    var s = load(), d = today();
    return all.filter(function (w) {
      var st = s.words[w.en];
      return !st || st.due <= d;
    });
  }
  function knownCount() {
    var s = load(), n = 0;
    for (var k in s.words) if (s.words[k].box >= 3) n++;
    return n;
  }

  /* ── стрик ─────────────────────────────────────────────────────── */
  function touchStreak() {
    var s = load(), d = today();
    if (s.streak.last === d) return s.streak;
    s.streak.days = (s.streak.last === plusDays(-1)) ? s.streak.days + 1 : 1;
    s.streak.last = d;
    save();
    return s.streak;
  }

  /* ── мелкая обвязка экранов ────────────────────────────────────── */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function toast(msg) {
    var n = $('.toast') || document.body.appendChild(el('div', 'toast'));
    n.textContent = msg; n.classList.add('show');
    clearTimeout(n._t); n._t = setTimeout(function () { n.classList.remove('show'); }, 1900);
  }
  function qs(name) { return new URLSearchParams(location.search).get(name); }

  /* В прогоне ?test=1 паузы «чтобы ребёнок увидел ответ» не нужны и делают
     проверку в двадцать раз длиннее. Экранная логика от этого не меняется:
     один и тот же код, только задержки короче. */
  function d(ms) { return qs('test') === '1' ? Math.min(20, ms) : ms; }

  var TABS = [
    { href: 'index.html',  ic: '🏠', key: 'today' },
    { href: 'jol.html',    ic: '🗺️', key: 'map'   },
    { href: 'sozdik.html', ic: '📇', key: 'words' },
    { href: 'oiyn.html',   ic: '🎮', key: 'games' },
    { href: 'profil.html', ic: '👤', key: 'me'    }
  ];
  function tabs(current, base) {
    base = base || '';
    var n = el('nav', 'tabs');
    TABS.forEach(function (tb) {
      var a = el('a', tb.href === current ? 'on' : '',
        '<span class="ic">' + tb.ic + '</span>' + t(tb.key));
      a.href = base + tb.href;
      n.appendChild(a);
    });
    document.body.appendChild(n);
  }

  global.App = {
    t: t, lang: lang,
    setLang: function (l) { try { localStorage.setItem(LANG_KEY, l); } catch (e) {} location.reload(); },
    load: load, save: save, reset: reset, state: load,
    unit: unit, unitDone: unitDone, unitProgress: unitProgress, curUnit: curUnit,
    seeWord: seeWord, dueWords: dueWords, knownCount: knownCount,
    touchStreak: touchStreak, today: today,
    $: $, $$: $$, el: el, toast: toast, qs: qs, d: d, tabs: tabs
  };
})(window);
