/*!
 * 1English · экраны платформы.
 *
 * Одно приложение на один файл: состояние, роутер, экраны. Экранов мало и
 * они простые, поэтому разносить их по модулям и тащить сборку не за что —
 * страница должна открываться по ссылке с телефона без установки.
 *
 * Состояние лежит в localStorage под ключом vitrina.lead. Бэкенда нет:
 * экраны про хранилище ничего не знают, в сеть не уходит ничего.
 */
(function () {
'use strict';

/* ══════════════════════════════════════════════════════════════════════
   СОСТОЯНИЕ
   ══════════════════════════════════════════════════════════════════ */
/* Витрина: бэкенда нет, состояние только в localStorage этого телефона. */
/* Ключ по имени репозитория: на github.io все демо живут на одном origin,
   общий ключ смешал бы прогресс двух школ на одном телефоне. */
var KEY = 'vitrina.' + (location.pathname.split('/')[1] || 'lead');

function blank() {
  return {
    phone: '',
    level: null,          /* id уровня из COURSE */
    sound: true,
    lang: 'ru',           /* витрина для русскоязычного лида */
    theme: 'system',      /* system | light | dark */
    name: '',
    gender: '',           /* m | f */
    consent: '',          /* дата согласия на обработку данных */
    p: {},                /* lessonId: {read:true, prac:true, text:true, task:{right,total}, words:true} */
    g: {}                 /* game: {plays,best,right,wrong,last} — пишет games/bridge.js */
  };
}

var S = (function () {
  try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
  catch (e) { return blank(); }
})();

/* Номер хранится и уезжает в базу только цифрами — 77011234567. Красивый
   вид с плюсом и скобками собирается при показе. Раньше при входе в базу
   ложились цифры, а при первой же правке профиля — строка из поля ввода
   «+7 (701) 123 45 67», и один и тот же человек лежал в en_students в двух
   видах: сверять с en_allowed и с выгрузками по такому полю нельзя. */
function phoneDigits(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.length === 11 && d.charAt(0) === '8') d = '7' + d.slice(1);
  if (d.length === 10) d = '7' + d;
  return (d.length === 11 && d.charAt(0) === '7') ? d : '';
}
function phoneShow(raw) {
  var d = phoneDigits(raw);
  if (!d) return String(raw || '');
  return '+' + d[0] + ' (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + ' ' + d.slice(7, 9) + ' ' + d.slice(9);
}
/* состояние с прошлой версии могло сохранить номер строкой с разделителями */
if (S.phone) S.phone = phoneDigits(S.phone) || S.phone;

function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function prog(id) { return S.p[id] || (S.p[id] = {}); }

vitrinaMode();

/* Витрина: DB — тихая заглушка с тем же набором методов, в сеть не уходит
   ничего. Расписания групп нет, поэтому rpc отдаёт пусто и плашки
   «скоро урок» нет. */
function vitrinaMode() {
  function ok(v) { return Promise.resolve(v); }
  window.DB = {
    ready: true, online: false, userId: 'vitrina',
    init: function () { return true; },
    enter: function () { return ok({ created: false }); },
    signOut: function () {},
    saveProfile: function () { return ok(null); },
    saveStep: function () { return ok(true); },
    saveGame: function () { return ok(true); },
    logError: function () { return ok(true); },
    amIAllowed: function () { return ok(true); },
    deleteMe: function () { return ok(true); },
    pull: function () { return ok({ profile: null, progress: [] }); },
    rpc: function () { return ok([]); }
  };
}



/* ══════════════════════════════════════════════════════════════════════
   СИНХРОНИЗАЦИЯ
   На экране всегда локальное состояние — оно рисуется мгновенно и живёт
   без сети. База — зеркало: при входе оттуда забираем всё, что уже есть,
   дальше отправляем копию каждого изменения.
   ══════════════════════════════════════════════════════════════════ */
function mergeServer(data) {
  if (!data) return;
  var p = data.profile;
  if (p) {
    ['name', 'gender', 'level', 'lang', 'theme'].forEach(function (k) {
      if (p[k]) S[k] = p[k];
    });
    /* номер мог смениться в дашборде — берём серверный */
    if (p.phone) S.phone = p.phone;
    applyTheme();
  }
  (data.progress || []).forEach(function (r) {
    var mine = prog(r.lesson);
    if (r.step === 'task') {
      /* результат не ухудшаем: на другом телефоне могло быть лучше */
      if (!mine.task || mine.task.right < r.right_count)
        mine.task = { right: r.right_count, total: r.total_count };
    } else mine[r.step] = true;
  });
  save();
}

/* Номер уходит, потому что без него строку не создать (phone not null),
   но в базе его всё равно перепишет триггер: номер там всегда тот, каким
   ученик входит. Поэтому устаревшая локальная копия ничего не портит. */
function syncProfile() {
  if (!global_DB()) return;
  DB.saveProfile({
    phone: S.phone, name: S.name, gender: S.gender,
    level: S.level, lang: S.lang, theme: S.theme,
    consent_at: S.consent || null, consent_v: S.consent ? 'v1' : null
  });
}
function syncStep(lesson, step, right, total) {
  if (!global_DB()) return;
  DB.saveStep(lesson, step, right, total);
}
function global_DB() { return window.DB && DB.ready; }

/* ══════════════════════════════════════════════════════════════════════
   ЯЗЫК ИНТЕРФЕЙСА
   Казахский — основной: группа казахоязычная, ролики сняты на казахском.
   Русский переключается в профиле и с главного экрана. Переключатель
   меняет один словарь, экраны не трогаются.

   Содержание урока (правило, примеры, слова, объяснения к заданиям)
   двуязычное тоже: рядом с русским полем лежит поле с хвостом Kk, а
   перевод слова и примера — пара {ru, kk}. Нет казахского — покажется
   русский, урок из-за этого не ломается.
   ══════════════════════════════════════════════════════════════════ */
var LANG = {
  ru: {
    next:'Далее', enter:'Войти', phone:'Номер телефона',
    phoneNote:'Тот, на который вас записали на курс.',
    smsTitle:'Код доступа', smsTo:'Номер ', changePhone:'Изменить номер',
    smsHint:'Первый раз — придумайте код из шести цифр, он станет вашим паролем. Дальше входите с ним же.',
    wait:'Секунду…', offline:'Нет связи с базой. Прогресс сохранится на этом телефоне.',
    yourLevel:'Ваш уровень', levelNote:'Можно поменять в любой момент.',
    choose:'Выбрать', level:'Уровень',
    homeTab:'Главная', myCourse:'Мой курс', otherCourses:'Другие курсы',
    allCourses:'Курсы', pickCourse:'Выберите курс — с него начнётся обучение.',
    brandLine1:'Видеоуроки, задания и словарь.',
    brandLine2:'4 уровня · 56 уроков',
    nLessons:function (n) { return n + ' уроков'; },
    lessonsOf:function (a, b) { return a + ' из ' + b + ' уроков'; },
    soon:'Материалы скоро', videoLesson:'Видеоурок', ruleReview:'Разбор правила',
    lesson:'Урок', task:'Задание', dict:'Словарь',
    videoAndRule:'Видео и разбор', videoOnly:'Видео', noVideo:'Видео пока нет',
    cartoon:'Мультик', videoAndCartoon:'Мультик и видео',
    theory:'Теория', practice:'Практика',
    reading:'Чтение', noText:'Текста пока нет', tapWord:'Нажмите на выделенное слово',
    readCap:function (n) { return 'Текст, ' + n + ' слов урока'; },
    wordsOpen:function (a, b) { return a + ' из ' + b + ' слов'; },
    inText:'в тексте: ', flipHint:'Нажмите, чтобы перевернуть', readDone:'Прочитал',
    noTasks:'Заданий пока нет', noWords:'Слов пока нет',
    nTasks:function (n) { return n + ' заданий'; },
    nWords:function (n) { return n + ' слов'; },
    resultOf:function (a, b) { return 'Результат ' + a + ' из ' + b; },
    got:'Понятно', check:'Проверить', more:'Дальше', total:'Итог',
    right:'Верно.', wrong:'Неверно.', correctIs:'Верно так: ',
    putAll:'Соберите всё предложение', noMistakes:'Без ошибок',
    canRetry:'Ошибки можно переиграть', toLessons:'К урокам', again:'Пройти заново',
    tapTranslate:'Нажмите, чтобы увидеть перевод', translation:'Перевод',
    know:'Знаю', oneMore:'Ещё раз', wordsDone:'слов пройдено',
    lessonsTab:'Уроки', gamesTab:'Игры', profileTab:'Профиль',
    gamesNote:'Слова берутся из вашего уровня.',
    gPlays:function (n) { return 'Сыграно ' + n; },
    gBest:function (n) { return 'лучший счёт ' + n; },
    gWordOrder:'Порядок слов', gWordOrderNote:'Собрать предложение из слов',
    gSort:'Корзины', gSortNote:'Ловить слова в нужную корзину',
    gFlappyNote:'Лететь в тот проём, где верный перевод',
    profile:'Профиль', name:'Имя', notSetM:'Не указан',
    notSetN:'Не указано', gender:'Пол',
    male:'Мужской', female:'Женский',
    langLabel:'Язык интерфейса', langName:'Русский',
    theme:'Тема оформления', themeSystem:'Системная', themeLight:'Светлая', themeDark:'Тёмная',
    save:'Сохранить', logout:'Выйти',
    consentShort:'Согласен на обработку моих данных',
    consentLink:'Что это значит',
    consentTitle:'Обработка персональных данных',
    consentText:'Витрина: это демо, аккаунта нет. Прогресс хранится только в браузере этого телефона и стирается кнопкой «Удалить мои данные» в профиле.',
    consentNeed:'Отметьте согласие, чтобы продолжить',
    tooMany:'Слишком много попыток. Подождите минуту.',
    notAllowed:'Этого номера нет в списке группы. Напишите преподавателю.',
    noAccess:'Неверный код, либо аккаунт ещё не заведён. Напишите преподавателю.',
    wipe:'Удалить мои данные', wipeCap:'Профиль, прогресс и сам аккаунт',
    wipeText:'Из базы пропадут: номер телефона, имя, пол и весь пройденный курс. Вернуть это будет нельзя — вход по этому номеру начнётся с чистого листа.',
    wipeGo:'Удалить', cancel:'Отмена', wiped:'Данные удалены',
    lessonAt:function (when, time) { return 'Скоро урок: ' + when + ', ' + time; },
    leftTime:function (x) { return 'Осталось ' + x; },
    lessonNow:'Урок идёт сейчас', startedAt:function (x) { return 'Начался в ' + x; },
    today:'сегодня', tomorrow:'завтра',
    weekday:['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'],
    uDay:'дн', uHour:'ч', uMin:'мин'
  },
  kk: {
    next:'Әрі қарай', enter:'Кіру', phone:'Телефон нөмірі',
    phoneNote:'Курсқа тіркелген нөмір.',
    smsTitle:'Кіру коды', smsTo:'Нөмір ', changePhone:'Нөмірді өзгерту',
    smsHint:'Алғаш рет — алты саннан код ойлап табыңыз, ол сіздің құпиясөзіңіз болады. Әрі қарай сол кодпен кіресіз.',
    wait:'Бір секунд…', offline:'Базамен байланыс жоқ. Прогресс осы телефонда сақталады.',
    yourLevel:'Сіздің деңгейіңіз', levelNote:'Кез келген уақытта ауыстыруға болады.',
    choose:'Таңдау', level:'Деңгей',
    homeTab:'Басты бет', myCourse:'Менің курсым', otherCourses:'Басқа курстар',
    allCourses:'Курстар', pickCourse:'Курс таңдаңыз — оқу содан басталады.',
    brandLine1:'Бейнесабақ, тапсырма және сөздік.',
    brandLine2:'4 деңгей · 56 сабақ',
    nLessons:function (n) { return n + ' сабақ'; },
    lessonsOf:function (a, b) { return a + ' / ' + b + ' сабақ'; },
    soon:'Материалдар жақында', videoLesson:'Бейнесабақ', ruleReview:'Ереже талдауы',
    lesson:'Сабақ', task:'Тапсырма', dict:'Сөздік',
    videoAndRule:'Бейне және талдау', videoOnly:'Бейне', noVideo:'Бейне әзірге жоқ',
    cartoon:'Мультфильм', videoAndCartoon:'Мультфильм және бейне',
    theory:'Теория', practice:'Жаттығу',
    reading:'Оқылым', noText:'Мәтін әзірге жоқ', tapWord:'Белгіленген сөзді басыңыз',
    readCap:function (n) { return 'Мәтін, сабақтың ' + n + ' сөзі'; },
    wordsOpen:function (a, b) { return a + ' / ' + b + ' сөз'; },
    inText:'мәтінде: ', flipHint:'Аудару үшін басыңыз', readDone:'Оқыдым',
    noTasks:'Тапсырма әзірге жоқ', noWords:'Сөздер әзірге жоқ',
    nTasks:function (n) { return n + ' тапсырма'; },
    nWords:function (n) { return n + ' сөз'; },
    resultOf:function (a, b) { return 'Нәтиже: ' + a + ' / ' + b; },
    got:'Түсінікті', check:'Тексеру', more:'Келесі', total:'Қорытынды',
    right:'Дұрыс.', wrong:'Қате.', correctIs:'Дұрысы: ',
    putAll:'Барлық сөзді қойыңыз', noMistakes:'Қатесіз',
    canRetry:'Қателерді қайта өтуге болады', toLessons:'Сабақтарға', again:'Қайта өту',
    tapTranslate:'Аударманы көру үшін басыңыз', translation:'Аудармасы',
    know:'Білемін', oneMore:'Тағы бір рет', wordsDone:'сөз өтілді',
    lessonsTab:'Сабақтар', gamesTab:'Ойындар', profileTab:'Профиль',
    gamesNote:'Сөздер деңгейіңізден алынады.',
    gPlays:function (n) { return n + ' ойын ойналды'; },
    gBest:function (n) { return 'үздік нәтиже ' + n; },
    gWordOrder:'Сөз реті', gWordOrderNote:'Сөздерден сөйлем құрастыру',
    gSort:'Себеттер', gSortNote:'Сөздерді дұрыс себетке түсіру',
    gFlappyNote:'Дұрыс аудармасы бар саңылауға ұшу',
    profile:'Профиль', name:'Аты', notSetM:'Көрсетілмеген',
    notSetN:'Көрсетілмеген', gender:'Жынысы',
    male:'Ер', female:'Әйел',
    langLabel:'Интерфейс тілі', langName:'Қазақша',
    theme:'Безендіру тақырыбы', themeSystem:'Жүйелік', themeLight:'Ашық', themeDark:'Қараңғы',
    save:'Сақтау', logout:'Шығу',
    consentShort:'Деректерімді өңдеуге келісемін',
    consentLink:'Бұл нені білдіреді',
    consentTitle:'Дербес деректерді өңдеу',
    consentText:'Витрина: бұл демо, аккаунт жоқ. Прогресс тек осы телефонның браузерінде сақталады, профильдегі «Менің деректерімді өшіру» батырмасы бәрін өшіреді.',
    consentNeed:'Жалғастыру үшін келісімді белгілеңіз',
    tooMany:'Тым көп әрекет. Бір минут күтіңіз.',
    notAllowed:'Бұл нөмір топ тізімінде жоқ. Ұстазға жазыңыз.',
    noAccess:'Код қате, немесе аккаунт әлі ашылмаған. Ұстазға жазыңыз.',
    wipe:'Деректерімді өшіру', wipeCap:'Профиль, прогресс және аккаунт',
    wipeText:'Базадан телефон нөмірі, аты, жынысы және өтілген курс жойылады. Қайтару мүмкін болмайды — осы нөмірмен кіру таза беттен басталады.',
    wipeGo:'Өшіру', cancel:'Болдырмау', wiped:'Деректер өшірілді',
    lessonAt:function (when, time) { return 'Жақында сабақ: ' + when + ', сағат ' + time; },
    leftTime:function (x) { return x + ' қалды'; },
    lessonNow:'Сабақ қазір жүріп жатыр', startedAt:function (x) { return 'Басталды: ' + x; },
    today:'бүгін', tomorrow:'ертең',
    weekday:['жексенбі','дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі'],
    uDay:'күн', uHour:'сағ', uMin:'мин'
  }
};
function t(k) {
  var d = LANG[S.lang] || LANG.ru;
  return d[k] != null ? d[k] : (LANG.ru[k] != null ? LANG.ru[k] : k);
}

/* Пара переводов рядом: {ru:'…', kk:'…'} — пример, слово, задание. */
function trn(o) {
  if (!o) return '';
  return (S.lang === 'kk' && o.kk) ? o.kk : (o.ru || o.kk || '');
}
/* Поле с казахским соседом: rule ↔ ruleKk, subtitle ↔ subtitleKk, why ↔ whyKk. */
function tx(o, key) {
  if (!o) return '';
  return (S.lang === 'kk' && o[key + 'Kk']) ? o[key + 'Kk'] : (o[key] || o[key + 'Kk'] || '');
}

/* Тема живёт на <html>: system снимает атрибут и отдаёт выбор системе. */
function applyTheme() {
  var el = document.documentElement;
  if (S.theme === 'light' || S.theme === 'dark') el.setAttribute('data-theme', S.theme);
  else el.removeAttribute('data-theme');
}
applyTheme();

/* ══════════════════════════════════════════════════════════════════════
   КУРС: доступ к данным
   ══════════════════════════════════════════════════════════════════ */
function level(id) {
  return COURSE.levels.filter(function (l) { return l.id === (id || S.level); })[0] || COURSE.levels[0];
}
function lesson(id) {
  var out = null;
  COURSE.levels.forEach(function (l) {
    l.lessons.forEach(function (s) { if (s.id === id) out = s; });
  });
  return out;
}
/* Ролики урока: { theory, practice }. Пара и подмена русского ролика
   казахским живут в course.js — тем же правилом шаги считает дашборд. */
function videos(id) { return window.lessonVideos(id, S.lang); }
function video(id) { var v = videos(id); return v.theory || v.practice; }
function cartoonOf(id) { return (window.CARTOONS || {})[id]; }

/* Урок — две секции и пять шагов, других не будет. Теория: видеоурок
   с правилом. Практика: свой видеоурок, чтение, задание, словарь. Но урок
   бывает пустым: ролик ещё не привязан, заданий пока нет. Шаг без
   материала не существует, а не «не пройден» — иначе прогресс врёт. */
function stepsOf(s) {
  var v = videos(s.id), out = [];
  if (v.theory || s.rule) out.push('read');
  if (v.practice)         out.push('prac');
  if (s.text)             out.push('text');
  if (s.tasks.length)     out.push('task');
  if (s.words.length)     out.push('words');
  return out;
}
function stepsDone(s) {
  var p = S.p[s.id] || {};
  return stepsOf(s).filter(function (k) { return !!p[k]; }).length;
}
function levelStats(lv) {
  var done = 0, ready = 0, all = 0, mine = 0;
  lv.lessons.forEach(function (s) {
    var n = stepsOf(s).length;
    if (!n) return;                       /* пустой урок в счёт не идёт */
    ready++; all += n; mine += stepsDone(s);
    if (stepsDone(s) === n) done++;
  });
  return { done: done, total: ready, pct: all ? Math.round(mine / all * 100) : 0 };
}

/* ══════════════════════════════════════════════════════════════════════
   МЕЛОЧИ
   ══════════════════════════════════════════════════════════════════ */
var openId = null;   /* какой урок раскрыт в списке */
var view = document.getElementById('view');
var tabsEl = document.getElementById('tabs');

function h(html) { return html; }
/* Кавычки тоже: часть значений подставляется в атрибуты (value у поля
   имени, title у плеера), и имя с кавычкой иначе ломает разметку. */
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}
function $(sel, root) { return (root || view).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || view).querySelectorAll(sel)); }
function go(hash) { location.hash = hash; }

function toast(text) {
  var el = document.createElement('div');
  el.className = 'toast'; el.textContent = text;
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 1700);
}

/* Озвучка встроенная в браузер: файлов нет, интернет не нужен.
   Голос английский; если система его не знает, кнопка просто молчит. */
function speak(text) {
  if (!S.sound) return;
  try {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}

function shuffle(a) {
  a = a.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ── иконки: один набор, одна толщина линии, никаких эмодзи в интерфейсе ── */
var IC = {
  book:  '<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="3.4"/><path d="M8.6 3.6v16.8"/><path d="M12.4 8.8h4.6M12.4 12.4h4.6"/>',
  game:  '<rect x="2.2" y="6.4" width="19.6" height="11.2" rx="5.6"/><path d="M7.3 9.8v2.9M5.85 11.25h2.9"/><circle cx="15.9" cy="10.6" r="1.15"/><circle cx="18.3" cy="13.6" r="1.15"/>',
  gear:  '<path d="M3.5 7.5h17M3.5 16.5h17"/><circle cx="9" cy="7.5" r="2.3"/><circle cx="15.5" cy="16.5" r="2.3"/>',
  home:  '<path d="M3.6 10.4 12 3.6l8.4 6.8v9.2a1 1 0 0 1-1 1h-4.6v-6.2H9.2v6.2H4.6a1 1 0 0 1-1-1z"/>',
  left:  '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  right: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  check: '<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
  task:  '<rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4"/><path d="M8.3 12.1l2.6 2.6 4.9-5.3"/>',
  cards: '<rect x="6.4" y="3.4" width="14" height="14" rx="3.4"/><path d="M16.4 20.6H7.2a3.8 3.8 0 0 1-3.8-3.8V7.6"/>',
  play:  '<path d="M8 5.6v12.8L19 12z"/>',
  bell:  '<path d="M6.2 16.6V11a5.8 5.8 0 0 1 11.6 0v5.6l1.6 1.8H4.6z"/><path d="M10 20.6a2.2 2.2 0 0 0 4 0"/>',
  sound: '<path d="M4 9.5h3.4L12 5.6v12.8L7.4 14.5H4z"/><path d="M15.6 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M18.1 6.9a7 7 0 0 1 0 10.2"/>',
  close:   '<path d="M6 6l12 12M18 6 6 18"/>',
  profile: '<circle cx="12" cy="8.2" r="3.9"/><path d="M4.6 20.2a7.4 7.4 0 0 1 14.8 0"/>',
  edit:    '<path d="M4.4 19.6h3.6l9.7-9.7-3.6-3.6-9.7 9.7z"/><path d="M14.1 6.3 16.6 3.8l3.6 3.6-2.5 2.5"/>',
  cam:     '<path d="M3.6 8.6h3.2l1.4-2.2h7.6l1.4 2.2h3.2v9.8H3.6z"/><circle cx="12" cy="13.3" r="3.1"/>',
  globe:   '<circle cx="12" cy="12" r="8.6"/><path d="M3.4 12h17.2M12 3.4c2.3 2.4 3.4 5.3 3.4 8.6s-1.1 6.2-3.4 8.6c-2.3-2.4-3.4-5.3-3.4-8.6S9.7 5.8 12 3.4z"/>',
  moon:    '<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v17.2a8.6 8.6 0 0 0 0-17.2z" fill="currentColor" stroke="none"/>'
};
function icon(name, size) {
  return '<svg width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" ' +
         'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + IC[name] + '</svg>';
}

function head(title, back) {
  return '<div class="head">' +
    (back ? '<button class="iconbtn" data-back="' + back + '">' + icon('left', 22) + '</button>' : '') +
    '<h1>' + esc(title) + '</h1></div>';
}


/* Шторка снизу: выбор уровня, имя, пол, язык, тема — всё спрашивается
   одинаково, поэтому обёртка одна. */
function openSheet(html, wire) {
  var veil = document.createElement('div');
  veil.className = 'veil';
  veil.innerHTML = '<div class="sheet"><div class="grip"></div>' + html + '</div>';
  document.body.appendChild(veil);
  veil.onclick = function (e) { if (e.target === veil) veil.remove(); };
  if (wire) wire(veil, function () { veil.remove(); });
  return veil;
}

/* Список с галочкой: тема, язык, пол устроены одинаково. */
function pickSheet(title, items, current, onPick) {
  openSheet(
    '<h2 style="margin-bottom:16px">' + esc(title) + '</h2>' +
    '<div class="pick">' +
      items.map(function (it) {
        return '<button data-v="' + it.v + '" class="' + (it.v === current ? 'on' : '') + '">' +
          '<span>' + esc(it.name) + '</span>' +
          (it.v === current ? '<span class="tick">' + icon('check', 20) + '</span>' : '') +
        '</button>';
      }).join('') +
    '</div>',
    function (veil, close) {
      Array.prototype.forEach.call(veil.querySelectorAll('[data-v]'), function (b) {
        b.onclick = function () { close(); onPick(b.getAttribute('data-v')); };
      });
    });
}


/* ══════════════════════════════════════════════════════════════════════
   ЭКРАН: СТАРТ (вместо входа)
   Витрина без бэкенда: номера и кода нет. Одна кнопка ведёт внутрь,
   согласие — на локальное хранение прогресса.
   ══════════════════════════════════════════════════════════════════ */
function scrLogin() {
  var B = window.BRAND || {};
  var nl = 0; try { COURSE.levels.forEach(function (l) { nl += l.lessons.length; }); } catch (e) {}
  var nw = (window.WORDS || []).length || (window.WORD_BANK || []).length || 0;
  paint(
    '<div class="start">' +
      '<span class="demo-tag">' + esc(bt('startKicker')) + '</span>' +
      '<div class="start-head"><img class="logo-badge" src="' + av(B.logo) + '" alt="' + esc(B.name || '') + '">' +
        '<h1>' + esc(B.name || '') + '</h1></div>' +
      '<p class="sub" style="margin-bottom:14px">' + esc(bt('startSub')) + '</p>' +
      (B.video
        ? '<div class="frame start-video"><video src="assets/teaser.mp4" poster="assets/teaser-poster.jpg" ' +
          'autoplay muted loop playsinline controls preload="auto"></video></div>' : '') +
      '<div class="chips-row">' +
        (nl ? '<span>' + esc(bt('chipLessons').replace('{n}', nl)) + '</span>' : '') +
        '<span>' + esc(bt('chipGames')) + '</span>' +
        '<span>' + esc(bt('chipCartoons')) + '</span>' +
      '</div>' +
      '<label class="agree"><input type="checkbox" id="ag">' +
        '<span>' + esc(bt('consentShort')) + '. <b id="more">' + t('consentLink') + '</b></span></label>' +
      '<button class="btn" id="go" disabled>' + esc(bt('startCta')) + '</button>' +
    '</div>', true);

  var ag = $('#ag');
  ag.onchange = function () { $('#go').disabled = !ag.checked; };

  $('#more').onclick = function (e) {
    e.preventDefault();
    openSheet('<h2 style="margin-bottom:14px">' + t('consentTitle') + '</h2>' +
      '<p class="sub" style="white-space:pre-line;margin-bottom:22px">' + esc(bt('consentText')) + '</p>' +
      '<button class="btn" id="cl">' + t('got') + '</button>',
      function (veil, close) { veil.querySelector('#cl').onclick = close; });
  };

  $('#go').onclick = function () {
    S.phone = 'vitrina';
    if (!S.consent) S.consent = new Date().toISOString();
    save();
    go('#/home');
  };
}

/* ══════════════════════════════════════════════════════════════════════
   ЭКРАН: ГЛАВНАЯ — школа и курсы
   Первое, что видит ученик после входа. Сверху школа: обложка, логотип,
   переключатель языка. Ниже «мой курс» с прогрессом и остальные курсы
   карточками — уровень выбирается и меняется здесь, отдельного экрана
   выбора уровня больше нет.
   ══════════════════════════════════════════════════════════════════ */
function courseCard(l, mine) {
  var st = levelStats(l);
  return '<button class="ccard' + (mine ? ' mine' : '') + '" data-lv="' + l.id + '">' +
    '<span class="pic">' +
      '<img src="' + av('app/covers/' + l.id + '.jpg') + '" alt="" loading="lazy">' +
      '<span class="code">' + l.code + '</span>' +
      '<b' + (l.title.length > 12 ? ' class="long"' : '') + '>' + l.title + '</b>' +
      '<i>' + esc(tx(l, 'tagline')) + '</i>' +
    '</span>' +
    '<span class="foot">' +
      '<span class="grow"><b>' + l.title + '</b>' +
        '<span class="cap">' + (mine && st.total
            ? t('lessonsOf')(st.done, st.total)
            : t('nLessons')(l.lessons.length)) + '</span></span>' +
      (mine ? '<span class="pct num">' + st.pct + '%</span>'
            : '<span class="chev">' + icon('right', 20) + '</span>') +
    '</span>' +
    (mine ? '<span class="bar"><i style="width:' + st.pct + '%"></i></span>' : '') +
  '</button>';
}

function scrHome() {
  var B = window.BRAND || {};
  var mine = S.level ? level(S.level) : null;
  var rest = COURSE.levels.filter(function (l) { return !mine || l.id !== mine.id; });

  paint(
    '<div class="hero">' +
      /* обложка школы, а не курса: под ней сразу лежит карточка курса
         со своей картинкой, и две одинаковые читались бы как сбой */
      '<img src="' + av('app/covers/school.jpg') + '" alt="">' +
      '<img class="brand" src="' + av(B.logoWhite) + '" alt="' + esc(B.name || '') + '">' +
      '<div class="lang">' +
        '<button data-l="kk"' + (S.lang === 'kk' ? ' class="on"' : '') + '>KZ</button>' +
        '<button data-l="ru"' + (S.lang === 'ru' ? ' class="on"' : '') + '>RU</button>' +
      '</div>' +
    '</div>' +

    '<div class="ava logo"><img src="' + av(B.logo) + '" alt=""></div>' +
    '<div class="who">' +
      '<h2>' + esc(B.name || '') + '</h2>' +
      '<p>' + t('brandLine1') + '<br>' + t('brandLine2') + '</p>' +
    '</div>' +
    '<div id="bn"></div>' +

    (mine
      ? '<h2 class="sect">' + t('myCourse') + '</h2>' + courseCard(mine, true) +
        '<h2 class="sect">' + t('otherCourses') + '</h2>'
      : '<h2 class="sect">' + t('allCourses') + '</h2>' +
        '<p class="sub" style="margin:-6px 0 14px">' + t('pickCourse') + '</p>') +

    rest.map(function (l) { return courseCard(l, false); }).join(''));

  $$('[data-l]').forEach(function (b) {
    b.onclick = function () {
      var v = b.getAttribute('data-l');
      if (v === S.lang) return;
      S.lang = v; save(); syncProfile(); route();
    };
  });

  $$('[data-lv]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-lv');
      if (id === S.level) return go('#/lessons');
      sheet(id);
    };
  });

  function sheet(id) {
    var l = level(id);
    openSheet(
      '<span class="chip accent">' + l.code + '</span>' +
      '<h1 style="margin:14px 0 10px">' + l.title + '</h1>' +
      '<p class="sub" style="margin-bottom:22px">' + esc(tx(l, 'about')) + '</p>' +
      '<button class="btn" id="pick">' + t('choose') + '</button>',
      function (veil, close) {
        veil.querySelector('#pick').onclick = function () {
          S.level = id; save(); syncProfile(); close(); go('#/lessons');
        };
      });
  }
}

/* ══════════════════════════════════════════════════════════════════════
   ЭКРАН: УРОКИ (главная вкладка)
   ══════════════════════════════════════════════════════════════════ */
function scrLessons() {
  var lv = level(), st = levelStats(lv);

  paint(
    '<div id="bn"></div>' +
    '<button class="cover" data-lv="' + lv.id + '" data-nav="#/home">' +
      '<img src="' + av('app/covers/' + lv.id + '.jpg') + '" alt="" loading="lazy">' +
      '<img class="brand" src="' + av((window.BRAND || {}).logoWhite) + '" alt="">' +
      '<span class="code">' + lv.code + '</span>' +
      /* длинное название уровня не должно наезжать на предмет справа */
      '<h2' + (lv.title.length > 12 ? ' class="long"' : '') + '>' + lv.title + '</h2>' +
      '<p>' + esc(tx(lv, 'tagline')) + '</p>' +
      '<span class="swap">' + icon('right', 18) + '</span>' +
    '</button>' +

    '<div class="summary">' +
      '<div class="row2">' +
        '<span class="big num">' + st.pct + '%</span>' +
        '<span class="eyebrow num">' + (st.total ? t('lessonsOf')(st.done, st.total) : t('soon')) + '</span>' +
      '</div>' +
      '<div class="bar"><i style="width:' + st.pct + '%"></i></div>' +
    '</div>' +

    lv.lessons.map(function (s) {
      var av = stepsOf(s), n = stepsDone(s), full = av.length && n === av.length;
      var cap = tx(s, 'subtitle') || (av.length ? (video(s.id) ? t('videoLesson') : t('ruleReview')) : t('soon'));
      return '<div class="item' + (s.id === openId ? ' on' : '') + (av.length ? '' : ' empty') +
             '" data-item="' + s.id + '">' +
        '<button class="itop" data-open="' + s.id + '">' +
          '<span class="mark' + (full ? ' done' : '') + '">' +
            (full ? icon('check', 22) : s.n) + '</span>' +
          '<span class="grow"><b>' + esc(s.title || (t('lesson') + ' ' + s.n)) + '</b>' +
            '<span class="cap">' + esc(cap) + '</span>' +
            (av.length ? '<span class="steps">' + av.map(function (_, k) {
                return '<i class="' + (k < n ? 'on' : '') + '"></i>'; }).join('') + '</span>' : '') +
          '</span>' +
          '<span class="chev">' + icon('right', 20) + '</span>' +
        '</button>' +
        '<div class="panel"><div class="pin">' + steps(s) + '</div></div>' +
      '</div>';
    }).join(''));

  $$('[data-open]').forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute('data-open');
      openId = (openId === id) ? null : id;      /* открыт всегда один урок */
      $$('.item').forEach(function (it) {
        it.classList.toggle('on', it.getAttribute('data-item') === openId);
      });
    };
  });
}

/* Раскрытая карточка урока: две секции, теория и практика. В теории —
   видеоурок с правилом. В практике — свой видеоурок, чтение, задание и
   словарь: правило отрабатывается там, где его применяют. */
var STEP_IC = { read: 'play', prac: 'play', text: 'book', task: 'task', words: 'cards' };

function steps(s) {
  var p = S.p[s.id] || {}, av = stepsOf(s), v = videos(s.id);
  function sect(name) { return '<div class="sgrp">' + name + '</div>'; }
  function row(to, name, note, done) {
    var open = av.indexOf(to) >= 0;
    return '<button class="step' + (open ? '' : ' off') + '"' +
      (open ? ' data-nav="#/lesson/' + s.id + '/' + to + '"' : ' disabled') + '>' +
      '<span class="smark' + (done ? ' done' : '') + '">' + icon(done ? 'check' : STEP_IC[to], 20) + '</span>' +
      '<span class="grow"><b>' + name + '</b><span class="cap">' + note + '</span></span>' +
      (open ? '<span class="chev">' + icon('right', 18) + '</span>' : '') + '</button>';
  }
  return sect(t('theory')) +
         row('read', t('videoLesson'),
             v.theory ? (s.rule ? t('videoAndRule') : t('videoOnly')) : (s.rule ? t('ruleReview') : t('noVideo')), !!p.read) +
         sect(t('practice')) +
         row('prac', t('videoLesson'), v.practice ? (cartoonOf(s.id) ? t('videoAndCartoon') : t('videoOnly')) : t('noVideo'), !!p.prac) +
         (s.text ? row('text', t('reading'), t('readCap')(s.words.length), !!p.text) : '') +
          row('task', t('task'), bt('taskCap'), !!p.task) +
         row('words', t('dict'),
             s.words.length ? t('nWords')(s.words.length) : t('noWords'), !!p.words);
}

/* Плеер одного ролика. Подпись над ним говорит, какая это секция:
   заголовок экрана у теории и практики один — название урока.
   Витрина: тизера ещё нет (BRAND.teaser пуст) — вместо плеера карточка,
   которая продаёт видеоуроки. Тизер залили — iframe встанет сам. */
function teaserCard() {
  var B = window.BRAND || {};
  var wa = waHref();
  return '<div class="teaser-card">' +
    '<div class="playring"><svg viewBox="0 0 24 24"><path d="M8 5.6v12.8L19 12z"/></svg></div>' +
    '<h3>' + esc(bt('videoTitle')) + '</h3>' +
    '<p>' + esc(bt('videoSub')) + '</p>' +
    '<a class="btn" style="display:block;text-align:center;text-decoration:none" href="' + wa + '" target="_blank" rel="noopener">' +
      esc(bt('wantSame')) + '</a>' +
  '</div>';
}
function player(s, yt, cap) {
  return '<div class="vcap">' + cap + '</div>' +
    (yt === 'local'
      ? '<div class="frame"><video src="assets/teaser.mp4" poster="assets/teaser-poster.jpg" controls playsinline preload="metadata"></video></div>'
      : yt
      ? '<div class="frame"><iframe src="https://www.youtube-nocookie.com/embed/' + yt +
        '?rel=0&modestbranding=1&playsinline=1" title="' + esc((s.title || (t('lesson') + ' ' + s.n)) + ' · ' + cap) + '" allowfullscreen ' +
        'allow="accelerometer; encrypted-media; picture-in-picture"></iframe></div>'
      : teaserCard());
}

/* Мультик урока: свой файл, а не YouTube — ролик детский и короткий. */
function cartoonPlayer(c) {
  return c ? '<div class="vcap">' + t('cartoon') + '</div>' +
    '<div class="frame"><video src="' + c.src + '" poster="' + c.poster + '" controls playsinline preload="none"></video></div>' : '';
}

/* ── теория: видеоурок и правило ────────────────────────────────────── */
function scrRead(id) {
  var s = lesson(id); if (!s) return go('#/lessons');

  paint(
    head(s.title || (t('lesson') + ' ' + s.n), '#/lessons') +
    player(s, videos(id).theory, t('theory')) +
    (tx(s, 'rule') ? '<div class="rule">' + esc(tx(s, 'rule')) + '</div>' : '') +
    (s.examples.length
      ? '<div class="card" style="padding:4px 16px;margin-bottom:8px">' +
          s.examples.map(function (e, i) {
            return '<button class="ex" data-say="' + i + '">' +
              '<span class="grow"><b>' + esc(e.en) + '</b><span class="cap">' + esc(trn(e)) + '</span></span>' +
              '<span class="snd">' + icon('sound', 20) + '</span></button>';
          }).join('') +
        '</div>'
      : '') +
    '<div class="dock"><button class="btn" id="ok">' + t('got') + '</button></div>', true);

  $$('[data-say]').forEach(function (b) {
    b.onclick = function () { speak(s.examples[+b.getAttribute('data-say')].en); };
  });
  $('#ok').onclick = function () {
    prog(id).read = true; save(); syncStep(id, 'read'); go('#/lessons');
  };
}

/* ── практика: видеоурок ────────────────────────────────────────────── */
function scrPrac(id) {
  var s = lesson(id); if (!s) return go('#/lessons');
  var yt = videos(id).practice;

  paint(
    head(s.title || (t('lesson') + ' ' + s.n), '#/lessons') +
    cartoonPlayer(cartoonOf(id)) +
    player(s, yt, t('practice')) +
    '<div class="dock"><button class="btn" id="ok">' + t('got') + '</button></div>', true);

  $('#ok').onclick = function () {
    prog(id).prac = true; save(); syncStep(id, 'prac'); go('#/lessons');
  };
}

/* ── практика: чтение ───────────────────────────────────────────────
   Текст урока, в котором слова этого урока — кнопки. Нажал — флип-карта:
   лицо — слово (и форма, в которой оно стоит в тексте), оборот — перевод
   и пример из словаря урока. Новые слова учатся там, где их читают. */
function textWord(s, key) {
  return s.words.filter(function (w) { return w.en === key || w.en === key.toLowerCase(); })[0];
}
function scrText(id) {
  var s = lesson(id); if (!s || !s.text) return go('#/lessons');
  var seen = {};

  /* [слово] и [форма|слово] → кнопка. Остальной текст экранируется. */
  function markup() {
    return s.text.split('\n').map(function (para) {
      var out = '', last = 0, re = /\[([^\]|]+)(?:\|([^\]]+))?\]/g, m;
      while ((m = re.exec(para))) {
        out += esc(para.slice(last, m.index));
        var w = textWord(s, m[2] || m[1]);
        out += w ? '<button class="rw' + (seen[w.en] ? ' seen' : '') + '" data-w="' + esc(w.en) +
                   '" data-form="' + esc(m[1]) + '">' + esc(m[1]) + '</button>'
                 : esc(m[1]);
        last = re.lastIndex;
      }
      return '<p>' + out + esc(para.slice(last)) + '</p>';
    }).join('');
  }
  function count() {
    var n = s.words.filter(function (w) { return seen[w.en]; }).length;
    return '<div class="rcount"><span class="track"><i style="transform:scaleX(' +
      (s.words.length ? n / s.words.length : 0) + ')"></i></span><span class="num">' +
      t('wordsOpen')(n, s.words.length) + '</span></div>';
  }
  function draw() {
    var y = window.scrollY;
    paint(
      head(s.title || (t('lesson') + ' ' + s.n), '#/lessons') +
      '<div class="vcap">' + t('reading') + ' · ' + t('tapWord') + '</div>' +
      '<div class="rtext">' + markup() + count() + '</div>' +
      '<div class="dock"><button class="btn" id="ok">' + t('readDone') + '</button></div>', true);
    window.scrollTo(0, y);
    $$('[data-w]').forEach(function (b) {
      b.onclick = function () {
        var w = textWord(s, b.getAttribute('data-w'));
        flipCard(w, b.getAttribute('data-form'), function () {
          if (!seen[w.en]) { seen[w.en] = true; draw(); }
        });
      };
    });
    $('#ok').onclick = function () {
      prog(id).text = true; save(); syncStep(id, 'text'); go('#/lessons');
    };
  }
  draw();
}

/* Флип-карта поверх экрана. Первое нажатие переворачивает, второе
   закрывает; мимо карты — закрыть. onFlip — «слово открыто». */
function flipCard(w, form, onFlip) {
  var other = form && form.toLowerCase() !== w.en.toLowerCase();
  var say = '<button class="say" data-say="1" aria-label="Listen">' + icon('sound', 20) + '</button>';
  var veil = document.createElement('div');
  veil.className = 'veil fveil';
  veil.innerHTML = '<div class="flip" role="button" tabindex="0"><div class="flip-in">' +
      '<div class="face">' + say + '<div class="en">' + esc(w.en) + '</div>' +
        (other ? '<div class="form">' + t('inText') + esc(form) + '</div>' : '') +
        '<div class="hint">' + t('flipHint') + '</div></div>' +
      '<div class="face b">' + say + '<div class="tr">' + esc(trn(w)) + '</div>' +
        '<div class="en sm">' + esc(w.en) + '</div>' +
        (w.ex ? '<div class="wex">' + esc(w.ex) + '</div>' : '') + '</div>' +
    '</div></div>';
  document.body.appendChild(veil);
  var flip = veil.querySelector('.flip');
  speak(w.en);
  function close() { veil.remove(); document.removeEventListener('keydown', key); }
  function key(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', key);
  veil.onclick = function (e) {
    if (e.target === veil) return close();
    if (e.target.closest('[data-say]')) return speak(flip.classList.contains('back') && w.ex ? w.ex : w.en);
    if (flip.classList.contains('back')) return close();
    flip.classList.add('back');
    if (onFlip) onFlip();
  };
}

/* ── практика: задание ────────────────────────────────────────────────
   Витрина: заданий нет, вместо них карточка, которая продаёт методологию
   как отдельную услугу. Шаг в списке остаётся — лид должен его увидеть. */
function scrTask(id) {
  var s = lesson(id); if (!s) return go('#/lessons');
  var B = window.BRAND || {};
  var wa = waHref();
  if (!prog(id).task) { prog(id).task = { right: 0, total: 0 }; save(); }
  paint(
    head(s.title || (t('lesson') + ' ' + s.n), '#/lessons') +
    '<div class="upsell-card">' +
      '<div class="kick">' + t('task') + '</div>' +
      '<h3>' + esc(bt('taskTitle')) + '</h3>' +
      '<p>' + esc(bt('taskSub')) + '</p>' +
      '<a class="btn" style="display:block;text-align:center;text-decoration:none" href="' + wa + '" target="_blank" rel="noopener">' +
        esc(bt('wantSame')) + '</a>' +
    '</div>' +
    '<div class="dock"><button class="btn ghost" data-nav="#/lessons">' + t('toLessons') + '</button></div>', true);
}

/* ── практика: словарь ──────────────────────────────────────────────── */
function scrWords(id) {
  var s = lesson(id); if (!s) return go('#/lessons');
  var queue = s.words.slice(), known = 0;

  /* Флип-карта, как в чтении: лицо — слово, оборот — перевод и пример.
     Переворот идёт классом на месте, без перерисовки экрана, иначе
     анимации не видно. */
  function draw() {
    if (!queue.length) return end();
    var w = queue[0], say = '<button class="say" data-say="1" aria-label="Listen">' + icon('sound', 20) + '</button>';
    paint(
      head(t('dict'), '#/lessons') +
      '<div class="steps" style="margin:0 0 18px">' +
        s.words.map(function (_, k) { return '<i class="' + (k < known ? 'on' : '') + '"></i>'; }).join('') +
      '</div>' +
      '<div class="flip wflip" id="card" role="button" tabindex="0"><div class="flip-in">' +
        '<div class="face">' + say + '<div class="en">' + esc(w.en) + '</div>' +
          '<div class="hint">' + t('tapTranslate') + '</div></div>' +
        '<div class="face b">' + say + '<div class="tr">' + esc(trn(w)) + '</div>' +
          '<div class="en sm">' + esc(w.en) + '</div>' +
          (w.ex ? '<div class="wex">' + esc(w.ex) + '</div>' : '') + '</div>' +
      '</div></div>' +
      '<div class="dock" id="dock"></div>', true);

    var card = $('#card');
    function isOpen() { return card.classList.contains('back'); }
    function dock() {
      $('#dock').innerHTML = isOpen()
        ? '<div class="pair"><button class="btn quiet" id="no">' + t('oneMore') + '</button>' +
          '<button class="btn" id="yes">' + t('know') + '</button></div>'
        : '<button class="btn" id="flip">' + t('translation') + '</button>';
      if ($('#flip')) $('#flip').onclick = turn;
      if ($('#yes')) $('#yes').onclick = function () { known++; queue.shift(); draw(); };
      if ($('#no')) $('#no').onclick = function () { queue.push(queue.shift()); draw(); };
    }
    function turn() { if (!isOpen()) { card.classList.add('back'); speak(w.en); dock(); } }
    card.onclick = function (e) {
      if (e.target.closest('[data-say]')) return speak(isOpen() && w.ex ? w.ex : w.en);
      if (isOpen()) return speak(w.ex || w.en);
      turn();
    };
    card.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } };
    dock();
  }

  function end() {
    prog(id).words = true; save(); syncStep(id, 'words');
    paint(
      head(t('dict'), '#/lessons') +
      '<div class="fin">' +
        '<div class="score num">' + s.words.length + '</div>' +
        '<div class="cap">' + t('wordsDone') + '</div>' +
      '</div>' +
      '<div class="dock"><button class="btn" data-nav="#/lessons">' + t('toLessons') + '</button></div>', true);
  }

  draw();
}

/* ══════════════════════════════════════════════════════════════════════
   ЭКРАН: ИГРЫ
   ══════════════════════════════════════════════════════════════════ */
function games() {
  return [
    { file: 'surypta.html', id: 'surypta',        name: t('gSort'),       note: t('gSortNote') },
    { file: 'soilem.html',  id: 'soilem',         name: t('gWordOrder'),  note: t('gWordOrderNote') }
  ];
}

/* Что ребёнок уже сыграл. Итог кладёт games/bridge.js после партии, здесь
   он только показывается: игра без следа читается как игрушка в стороне
   от курса, а она часть курса. */
function gameLine(id, dflt) {
  var it = (S.g || {})[id];
  if (!it || !it.plays) return dflt;
  return t('gPlays')(it.plays) + (it.best ? ' · ' + t('gBest')(it.best) : '');
}

function scrGames() {
  paint(
    '<div class="head"><h1>' + t('gamesTab') + '</h1></div>' +
    '<p class="sub" style="margin:-8px 0 20px">' + t('gamesNote') + '</p>' +
    '<div class="rows">' +
      games().map(function (g) {
        return '<a class="row" href="games/' + g.file + '?g=' + g.id +
          '&back=' + encodeURIComponent('../index.html#/games') + '">' +
          '<span class="mark">' + icon('game', 24) + '</span>' +
          '<span class="grow"><b>' + g.name + '</b><span class="cap">' +
            esc(gameLine(g.id, g.note)) + '</span></span>' +
          '<span class="chev">' + icon('right', 20) + '</span></a>';
      }).join('') +
    '</div>' +
    /* витрина: две игры показываем, остальное — продажа игры под школу */
    '<div class="upsell-card" style="margin-top:14px">' +
      '<div class="kick">' + t('gamesTab') + '</div>' +
      '<h3>' + esc(bt('gamesUpTitle')) + '</h3>' +
      '<p>' + esc(bt('gamesUpSub')) + '</p>' +
      '<a class="btn" style="display:block;text-align:center;text-decoration:none" href="' + waHref() + '" target="_blank" rel="noopener">' +
        esc(bt('wantSame')) + '</a>' +
    '</div>');
}



/* Аватар вместо фото. Фото никто не ставит, а пустой кружок с иконкой
   выглядит как недоделка, поэтому рисуем силуэт по полу. Волосы — цветом
   текста, лицо и плечи — тоном светлее (--skin), иначе на тёмной теме
   картинка сливается в пятно. */
function avatar(g, size) {
  var hair = '', front = '';
  if (g === 'm') {
    hair = '<ellipse cx="32" cy="25" rx="14.5" ry="14" fill="currentColor"/>';
  } else if (g === 'f') {
    hair  = '<ellipse cx="32" cy="28" rx="17.5" ry="18" fill="currentColor"/>';
    front = '<rect x="14.5" y="28" width="7" height="24" rx="3.5" fill="currentColor"/>' +
            '<rect x="42.5" y="28" width="7" height="24" rx="3.5" fill="currentColor"/>';
  }
  var cy = g === 'f' ? 31 : (g === 'm' ? 29 : 27);
  return '<svg viewBox="0 0 64 64" width="' + (size || 96) + '" height="' + (size || 96) + '" aria-hidden="true">' +
    hair +
    '<circle cx="32" cy="' + cy + '" r="12.5" fill="var(--skin)"/>' +
    '<path d="M10 60c0-11 10-17 22-17s22 6 22 17z" fill="var(--skin)"/>' +
    front +
  '</svg>';
}

/* ══════════════════════════════════════════════════════════════════════
   ЭКРАН: ПРОФИЛЬ
   Уровень отсюда убран: он меняется нажатием на обложку курса, там же,
   где ученик его и видит. Здесь только то, что относится к человеку и к
   виду приложения.
   ══════════════════════════════════════════════════════════════════ */
function scrProfile() {
  var THEMES = [
    { v:'system', name:t('themeSystem') },
    { v:'light',  name:t('themeLight') },
    { v:'dark',   name:t('themeDark') }
  ];
  var LANGS = [ { v:'ru', name:'Русский' }, { v:'kk', name:'Қазақша' } ];
  var GENDERS = [ { v:'m', name:t('male') }, { v:'f', name:t('female') } ];

  function nameOf(list, v, dflt) {
    var hit = list.filter(function (x) { return x.v === v; })[0];
    return hit ? hit.name : dflt;
  }
  function row(ic, label, value, id) {
    return '<button class="gr" id="' + id + '">' +
      '<span class="ic">' + icon(ic, 22) + '</span>' +
      '<span class="grow"><span class="lbl">' + esc(label) + '</span>' +
        '<span class="val">' + esc(value) + '</span></span>' +
      '<span class="chev">' + icon('right', 18) + '</span></button>';
  }

  paint(
    '<div class="head" style="justify-content:center"><h1 style="flex:0;font-size:22px">' + t('profile') + '</h1></div>' +

    '<div class="ava' + (S.gender ? ' set' : '') + '">' + avatar(S.gender, 96) + '</div>' +

    '<div class="who">' +
      '<h2 id="nm">' + esc(S.name || t('notSetN')) + '</h2>' +
      (S.phone && S.phone !== 'vitrina' ? '<p>' + esc(phoneShow(S.phone)) + '</p>' : '') +
    '</div>' +

    '<div class="group">' +
      row('edit', t('name'), S.name || t('notSetN'), 'rName') +
      row('profile', t('gender'), nameOf(GENDERS, S.gender, t('notSetM')), 'rGender') +
    '</div>' +

    '<div class="group">' + row('globe', t('langLabel'), nameOf(LANGS, S.lang, 'Русский'), 'rLang') + '</div>' +
    '<div class="group">' + row('moon', t('theme'), nameOf(THEMES, S.theme, t('themeSystem')), 'rTheme') + '</div>' +

    '<div class="group">' +
      '<button class="gr" id="rWipe">' +
        '<span class="ic" style="color:var(--danger,var(--accent))">' + icon('close', 22) + '</span>' +
        '<span class="grow"><span class="lbl">' + t('wipeCap') + '</span>' +
          '<span class="val" style="color:var(--danger,var(--accent))">' + t('wipe') + '</span></span>' +
      '</button>' +
    '</div>' +

    '<div class="gap-sm"></div>' +
    '<button class="btn danger" id="out">' + t('logout') + '</button>');

  $('#rWipe').onclick = function () {
    openSheet(
      '<h2 style="margin-bottom:12px">' + t('wipe') + '</h2>' +
      '<p class="sub" style="margin-bottom:22px">' + esc(t('wipeText')) + '</p>' +
      '<button class="btn danger" id="yes">' + t('wipeGo') + '</button>' +
      '<div class="gap-sm"></div>' +
      '<button class="btn quiet" id="no">' + t('cancel') + '</button>',
      function (veil, close) {
        veil.querySelector('#no').onclick = close;
        veil.querySelector('#yes').onclick = function () {
          var b = this; b.disabled = true; b.textContent = t('wait');
          DB.deleteMe().then(function () {
            close(); S = blank(); save(); applyTheme(); toast(t('wiped')); go('#/login');
          }).catch(function (e) {
            b.disabled = false; b.textContent = t('wipeGo'); toast(e.message);
          });
        };
      });
  };

  $('#rName').onclick = function () {
    openSheet(
      '<h2 style="margin-bottom:16px">' + t('name') + '</h2>' +
      '<input class="field" id="v" type="text" value="' + esc(S.name) + '" placeholder="' + esc(t('notSetN')) + '">' +
      '<div class="gap-lg"></div><button class="btn" id="ok">' + t('save') + '</button>',
      function (veil, close) {
        var inp = veil.querySelector('#v');
        setTimeout(function () { inp.focus(); }, 250);
        veil.querySelector('#ok').onclick = function () {
          S.name = inp.value.trim().slice(0, 40); save(); syncProfile(); close(); route();
        };
      });
  };

  $('#rGender').onclick = function () {
    pickSheet(t('gender'), GENDERS, S.gender, function (v) { S.gender = v; save(); syncProfile(); route(); });
  };
  $('#rLang').onclick = function () {
    pickSheet(t('langLabel'), LANGS, S.lang, function (v) { S.lang = v; save(); syncProfile(); route(); });
  };
  $('#rTheme').onclick = function () {
    pickSheet(t('theme'), THEMES, S.theme, function (v) {
      S.theme = v; save(); applyTheme(); syncProfile(); route();
    });
  };

  $('#out').onclick = function () { DB.signOut(); S = blank(); save(); applyTheme(); go('#/login'); };
}

/* ══════════════════════════════════════════════════════════════════════
   ПЛАШКА «СКОРО УРОК»
   Висит всегда, пока у ученика есть график: когда ближайший урок и
   сколько до него осталось — дни, часы, минуты. За час до начала и пока
   урок идёт — красная. Учителя и темы урока в ней нет: учителей
   подключаем позже.

   График лежит в карточке ученика, которую заполняет админ в дашборде.
   Ученику карточку читать нельзя (там ставка и заметки про него), поэтому
   база отдаёт выжимку функцией en_my_schedule(): дни, время и даты
   уроков на неделю вперёд. Ближайший урок считает SCHED.next
   (app/schedule.js), проверка — node app/check_reminder.mjs.
   ══════════════════════════════════════════════════════════════════ */
var MY_SCHED = null;          /* ответ en_my_schedule; null — ещё не спрашивали */

function loadSchedule() {
  if (!global_DB() || !DB.rpc) return;
  DB.rpc('en_my_schedule', {}).then(function (c) {
    MY_SCHED = Array.isArray(c) ? c : [];
    fillBanner();
  }).catch(function () { MY_SCHED = []; });
}

/* «2 дн 5 ч 12 мин»: нулевые старшие единицы не пишем */
function countdown(ms) {
  var m = Math.max(1, Math.ceil(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60);
  var out = [];
  if (d) out.push(d + ' ' + t('uDay'));
  if (d || h) out.push(h + ' ' + t('uHour'));
  out.push(m % 60 + ' ' + t('uMin'));
  return out.join(' ');
}

function reminder(cards, now) {
  var n = window.SCHED && SCHED.next(cards, now, 60);
  if (!n) return null;
  function pad(x) { return (x < 10 ? '0' : '') + x; }
  var time = pad(n.start.getHours()) + ':' + pad(n.start.getMinutes());
  if (n.left <= 0) return { soon: true, head: t('lessonNow'), sub: t('startedAt')(time) };
  var days = Math.round((new Date(n.start).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
  var when = days === 0 ? t('today') : days === 1 ? t('tomorrow') : t('weekday')[n.start.getDay()];
  return { soon: n.left <= 3600000, head: t('lessonAt')(when, time), sub: t('leftTime')(countdown(n.left)) };
}

/* Плашка над главной и уроками. */
function fillBanner() {
  var box = document.getElementById('bn');
  if (!box) return;
  var r = reminder(MY_SCHED, new Date());
  box.innerHTML = r ? '<div class="bn' + (r.soon ? ' soon' : '') + '">' + icon('bell', 22) +
                      '<span><b>' + esc(r.head) + '</b><span>' + esc(r.sub) + '</span></span></div>' : '';
}
/* Отсчёт живёт по часам: пересчёт раз в полминуты и сразу, как только
   ученик вернулся в свёрнутую платформу. */
setInterval(fillBanner, 30000);
document.addEventListener('visibilitychange', function () { if (!document.hidden) fillBanner(); });

/* ══════════════════════════════════════════════════════════════════════
   РОУТЕР
   ══════════════════════════════════════════════════════════════════ */
function tabs() {
  return [
    { to: '#/home',     ic: 'home',    name: t('homeTab') },
    { to: '#/lessons',  ic: 'book',    name: t('lessonsTab') },
    { to: '#/games',    ic: 'game',    name: t('gamesTab') },
    { to: '#/settings', ic: 'profile', name: t('profileTab') }
  ];
}

function paint(html, plain) {
  view.className = 'view enter' + (plain ? ' plain' : '');
  view.innerHTML = html;
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  $$('[data-nav]').forEach(function (b) {
    b.onclick = function () { go(b.getAttribute('data-nav')); };
  });
  $$('[data-back]').forEach(function (b) {
    b.onclick = function () { go(b.getAttribute('data-back')); };
  });
}

function drawTabs(active) {
  tabsEl.className = 'tabs' + (active ? '' : ' off');
  if (!active) return;
  tabsEl.innerHTML = tabs().map(function (x) {
    return '<button class="tab' + (x.to === active ? ' on' : '') + '" data-to="' + x.to + '">' +
      icon(x.ic, 23) + '<span>' + x.name + '</span></button>';
  }).join('');
  Array.prototype.forEach.call(tabsEl.children, function (b) {
    b.onclick = function () { go(b.getAttribute('data-to')); };
  });
}

function route() {
  if (window.syncCta) window.syncCta();   /* подпись и ссылка кнопки связи следуют за языком */
  var parts = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  var r = parts[0] || '';

  /* Два входных условия, и оба обязательные: сначала номер, потом курс.
     Курс выбирается на главной — туда и упирается вход без уровня. */
  if (!S.phone) { if (r !== 'login') return go('#/login'); }
  else if (!S.level && r !== 'home' && r !== 'level') return go('#/home');

  if (r === 'login')  { drawTabs(null); return scrLogin(); }
  if (r === 'home' || r === 'level') {
    drawTabs(S.level ? '#/home' : null);   /* без курса вкладки некуда вести */
    scrHome(); return fillBanner();
  }
  if (r === 'games')  { drawTabs('#/games'); return scrGames(); }
  if (r === 'settings') { drawTabs('#/settings'); return scrProfile(); }

  if (r === 'lesson' && parts[1]) {
    var id = parts[1], step = parts[2];
    openId = id;
    if (step === 'read')  { drawTabs(null); return scrRead(id); }
    if (step === 'prac')  { drawTabs(null); return scrPrac(id); }
    if (step === 'text')  { drawTabs(null); return scrText(id); }
    if (step === 'task')  { drawTabs(null); return scrTask(id); }
    if (step === 'words') { drawTabs(null); return scrWords(id); }
    return go('#/lessons');   /* отдельного экрана урока нет: шаги живут в списке */
  }

  drawTabs('#/lessons');
  scrLessons(); return fillBanner();
}

/* Падение у ученика иначе никто не увидит: он просто закроет вкладку. */
window.addEventListener('error', function (e) {
  if (window.DB && DB.ready) DB.logError(e.message, (e.filename || '') + ':' + (e.lineno || 0));
});
window.addEventListener('unhandledrejection', function (e) {
  var r = e.reason;
  if (window.DB && DB.ready) DB.logError((r && r.message) || String(r), 'promise');
});

window.addEventListener('hashchange', route);

/* Сессия могла остаться с прошлого раза: поднимаем её до первой отрисовки,
   а свежие данные подтягиваем следом и перерисовываем экран. */
if (window.DB && DB.init() && S.phone) {
  DB.pull().then(function (d) { if (d) { mergeServer(d); route(); } });
  loadSchedule();
}
route();

/* автопроверка экрана: открыть index.html?test=1 и посмотреть консоль.
   Данные курса проверяет node app/check.mjs — здесь только вёрстка. */
if (location.search.indexOf('test=1') >= 0) {
  console.assert(document.body.scrollWidth <= window.innerWidth + 1, 'экран едет вбок');
  console.assert($$('.item').length > 0 || location.hash.indexOf('lessons') < 0, 'список уроков пуст');
  console.log('OK: ' + COURSE.levels.reduce(function (n, l) { return n + l.lessons.length; }, 0) +
              ' уроков, экран ' + window.innerWidth + 'px');
}

})();
