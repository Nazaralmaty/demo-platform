/*!
 * 1English · мост «арена → платформа».
 *
 * Арены перенесены из StudyLine и разговаривают контрактом SL.* (init/ready/
 * progress/finish/close). Раньше этот файл складывал результат в window.App —
 * состояние прошлой, казахоязычной версии под ключом '1eng'. Платформа живёт
 * в '1eng.v2' и в Supabase, поэтому ребёнок играл, а прогресс уходил в никуда:
 * ни на экране, ни в дашборде партия не появлялась.
 *
 * Теперь результат ложится в оба места:
 *   • '1eng.v2' — что сыграно, сколько верных, лучший счёт. Работает без сети;
 *   • en_games в Supabase — копия партии, чтобы её видел преподаватель.
 *
 * Повторение слов (Лейтнер) остаётся в App.seeWord: коробки и сроки уже
 * написаны и работают, второй такой механизм не нужен.
 */
(function (global) {
  'use strict';

  var KEY = 'vitrina.' + (location.pathname.split('/')[1] || 'lead');
  var qs = new URLSearchParams(location.search);
  var unit = qs.get('u') || '';
  var back = qs.get('back') || '../index.html#/games';
  var listeners = {};
  var sent = false;            /* партия засчитывается один раз */
  var name = qs.get('g') || '';/* имя игры: из SL.init, из finish или из ссылки */

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function store(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  /* Итог партии в состояние платформы: сыграно партий, лучший счёт, когда
     играли в последний раз. Экран игр читает это же. */
  function keep(game, right, wrong) {
    var s = load();
    var g = s.g || (s.g = {});
    var it = g[game] || (g[game] = { plays: 0, best: 0, right: 0, wrong: 0, last: null });
    it.plays++;
    it.right += right || 0;
    it.wrong += wrong || 0;
    if ((right || 0) > it.best) it.best = right || 0;
    it.last = new Date().toISOString();
    store(s);
  }

  /* Сессия лежит в localStorage того же адреса, что и платформа: игра
     открыта в той же вкладке браузера, значит ученик уже вошёл. */
  if (global.DB && DB.init) { try { DB.init(); } catch (e) {} }

  function app() { return global.App || null; }

  /* Слово, на которое ответили, идёт в повторение — это единственное, зачем
     мосту нужен App. Нет App (игру открыли отдельным файлом) — пропускаем. */
  function word(en, ok) {
    var A = app();
    if (A && en) { try { A.seeWord(en, !!ok); } catch (e) {} }
  }

  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }

  var SL = {
    isInApp: false,                       /* WebView нет — мы в обычном браузере */
    init: function (cfg) { if (cfg && cfg.game) name = String(cfg.game); },
    ready: function () {},
    on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    emit: function (ev, d) { (listeners[ev] || []).forEach(function (f) { try { f(d); } catch (e) {} }); },

    /* Сырой прогресс по ходу партии: слово знаем — отправляем в повторение. */
    progress: function (p) {
      if (!p) return;
      if (p.word) word(p.word, !!p.correct);
      if (p.errors) p.errors.forEach(function (e) { word(e.word, false); });
      if (p.words) p.words.forEach(function (w) { word(w, true); });
    },

    /* Партия закончена. Ждать выхода из игры нельзя: ребёнок может закрыть
       вкладку, поэтому итог пишется здесь и сразу. */
    finish: function (res) {
      res = res || {};
      SL.progress(res);
      if (sent) return;
      sent = true;

      /* Flappy кладёт имя игры в details, остальные — в res.game. */
      var game = String(res.game || (res.details && res.details.game) || name || 'game');
      var right = num(res.correct != null ? res.correct : res.right);
      var wrong = num(res.mistakes != null ? res.mistakes : res.wrong);

      keep(game, right, wrong);
      var A = app();
      if (A && A.touchStreak) { try { A.touchStreak(); } catch (e) {} }
      if (global.DB && DB.ready) DB.saveGame(game, right, wrong);
    },

    close: function () { location.href = back; }
  };

  global.SL = SL;
  global.SL_BACK = back;
  global.SL_UNIT = unit;
})(window);
