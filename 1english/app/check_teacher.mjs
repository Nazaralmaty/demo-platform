/* Проверка кабинета учителя без браузера: подставляем фальшивый DOM и
   фальшивую базу, смотрим, что доска собирается и цифры сходятся.

   Проверяется ровно то, что ломается молча: процент и деньги (их считают
   в трёх местах и легко разойтись), право на галочку (учитель не должен
   уметь её ставить) и экранирование — имя ученика пишет человек руками. */
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('teacher.html', 'utf8');
const code = html.match(/<script>\n([\s\S]*?)<\/script>/)[1];

let rendered = '';
const stub = () => ({ onclick: null, onchange: null, textContent: '', className: '', value: '',
                      checked: false, disabled: false, style: {}, focus() {},
                      getAttribute: () => '', querySelector: () => stub(), querySelectorAll: () => [] });
const root = {
  set innerHTML(v) { rendered = v; }, get innerHTML() { return rendered; },
  querySelector: () => stub(), querySelectorAll: () => [], contains: () => false, style: {}
};
const dlgBody = { set innerHTML(v) {}, get innerHTML() { return ''; },
                  querySelector: () => stub(), querySelectorAll: () => [] };

const ctx = {
  console,
  document: {
    getElementById: (id) => (id === 'root' ? root
                           : id === 'dlgBody' ? dlgBody
                           : { showModal() {}, close() {} }),
    addEventListener() {}, hidden: false, activeElement: null
  },
  alert() {}, setTimeout, clearTimeout, location: { search: '' },
  Date, Math, JSON, String, Number, Object, Array, RegExp, Promise, isNaN, encodeURIComponent,
  window: {}
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('app/course.js', 'utf8'), ctx);
ctx.COURSE = ctx.window.COURSE; ctx.VIDEOS = ctx.window.VIDEOS;
ctx.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
ctx.fetch = () => Promise.reject(new Error('нет сети'));
vm.runInContext(fs.readFileSync('app/db.js', 'utf8'), ctx);
ctx.DB = ctx.window.DB;

/* Недельная сетка живёт отдельным файлом: её рисуют и дашборд, и кабинет.
   Свои стили она вставляет в <head> — заглушке хватает пустышек. */
ctx.document.createElement = () => ({ style: {} });
ctx.document.head = { appendChild() {} };
vm.runInContext(fs.readFileSync('app/schedule.js', 'utf8'), ctx);
ctx.SCHED = ctx.window.SCHED;
/* Правила контроля уроков: статус урока и что идёт в выплату. */
vm.runInContext(fs.readFileSync('app/control.js', 'utf8'), ctx);
ctx.CTRL = ctx.window.CTRL;

/* ── фальшивая база ──────────────────────────────────────────────────
   Аяжан: 4 месяца по 12 уроков, проведено 18 — это 38% и 90 000 ₸ по
   ставке 5000. Девять галочек стоят в августе, девять в сентябре: по
   ним проверяется разбивка зарплаты по календарным месяцам.
   Второй ученик пишет своё имя кавычкой — так выглядит попытка вылезти
   из атрибута data-card в разметку. */
const lessons = [];
let k = 0;
for (let m = 1; m <= 4; m++)
  for (let i = 1; i <= 12; i++, k++)
    lessons.push({
      id: 'l' + k, month: m, idx: i,
      topic: i === 1 ? 'Present Simple' : null, homework: null,
      done: k < 18,
      done_at: k < 18 ? (k < 9 ? '2026-08-1' + (k + 1) + 'T10:00:00Z'
                               : '2026-09-0' + (k - 8) + 'T10:00:00Z') : null
    });

const cards = [
  { id: 'c1', teacher_id: 't1', name: 'Аяжан', age: 14, city: 'Алматы',
    goal: 'Сдать IELTS', level: 'Beginner', format: 'individual',
    days: 'mon,wed,fri', time_at: '18:00', phone: '77011234567',
    note: 'Стесняется говорить', months: 4, per_month: 12, rate: 5000,
    started_on: '2026-05-01', archived: false, lessons },
  { id: 'c2', teacher_id: 't1', name: 'Кавычка" onmouseover="beda()', age: 9,
    city: 'Астана', format: 'group', days: 'sat', time_at: '11:00',
    phone: '77029876543', months: 1, per_month: 8, rate: null,
    started_on: '2026-09-01', archived: false,
    /* один проведённый урок в июле: по нему видно, что пустая ставка
       превращается в 1150, и что месяц зарплаты берётся из done_at */
    lessons: [{ id: 'z1', month: 1, idx: 1, done: true, done_at: '2026-07-10T10:00:00Z' }] }
];

const teachers = [{ id: 't1', name: 'Айгерім', phone: '77015550000',
                    /* ставки у учителя нет — значит 1150, константа платформы */
                    bio: 'Десять лет в школе', rate: 0,
                    slots: 'mon@18:00,wed@18:00,fri@18:00,mon@19:00,sat@11:00' }];

let asAdmin = false;
ctx.DB.init = () => true;
ctx.DB.userId = 't1';
ctx.DB.rest = (path) => {
  if (path.startsWith('en_teachers')) return Promise.resolve(teachers);
  if (path.startsWith('en_admins')) return Promise.resolve(asAdmin ? [{ id: 't1' }] : []);
  if (path.startsWith('en_teacher_students')) return Promise.resolve(cards);
  return Promise.resolve([]);
};
ctx.DB.rpc = () => Promise.resolve('Готово');

vm.runInContext(code, ctx);
await new Promise(r => setTimeout(r, 50));

const fails = [];
const has = (t, why) => { if (!rendered.includes(t)) fails.push(why + ' — нет «' + t + '»'); };

if (!rendered) {
  console.log('✗ кабинет ничего не нарисовал — смотрите заглушку DOM выше');
  process.exit(1);
}

/* ── колонки 1 и 2: учитель и ученик ── */
has('Айгерім', 'имя учителя в левой колонке');
has('Десять лет в школе', 'резюме учителя');
has('Аяжан', 'имя ученика');
has('14 лет', 'возраст');
has('Алматы', 'город');
has('Сдать IELTS', 'цель обучения');
has('Пн, Ср, Пт', 'график по дням недели');
has('18:00', 'время занятия');
has('+7 (701) 123 45 67', 'номер ученика');
has('Индивид', 'формат');
has('Группа', 'формат группы у второго ученика');

/* ── колонка 3: месяцы, галочки, тема и домашка ── */
has('Месяц 1', 'месяц обучения');
has('Месяц 4', 'четвёртый месяц');
has('<em>12/12</em>', 'первый месяц закрыт целиком');
has('<em>6/12</em>', 'второй месяц пройден наполовину');
has('Present Simple', 'тема урока');
has('data-focus="homework"', 'кнопка домашнего задания');
if ((rendered.match(/data-check=/g) || []).length !== 49)
  fails.push('уроков в сетке не 49: ' + (rendered.match(/data-check=/g) || []).length);

/* ── колонка 4: результат ── */
has('<i>38%</i>', 'процент проведённых уроков');
has('18 из 48 уроков', 'сколько уроков из скольких');
has('90 000 ₸', 'начислено по карточке');

/* Второй ученик без своей ставки берёт ставку учителя, и ноль уроков —
   это ноль процентов, а не деление на ноль. */
/* Ставки у учителя нет, у карточки тоже — значит 1150 */
has('1 150 ₸', 'ставка по умолчанию 1150 ₸');

/* ── право на галочку ──
   Учитель отмечает «урок проведён» сам — это заявка, а не деньги. Но
   урок, по которому уже есть решение (старые галочки админа — это
   решения «засчитать»), под замком: переписать его задним числом нельзя. */
if (!/data-check="l0"[^>]*disabled/.test(rendered))
  fails.push('засчитанный урок учитель может перещёлкнуть — он должен быть под замком');
if (/data-check="l20"[^>]*disabled/.test(rendered))
  fails.push('непроведённый урок учитель отметить не может — а это теперь его галочка');
if (rendered.includes('data-mon=')) fails.push('учителю нарисовали «+ месяц»');
if (rendered.includes('data-card=')) fails.push('учителю нарисовали правку карточки');
has('Учеников и их карточки заводит администратор', 'объяснение учителю, кто заводит ученика');
if (rendered.includes('+ Ученик')) fails.push('в кабинете осталась кнопка добавления ученика');

/* ── экранирование ── */
if (/data-prog="[^"]*"\s+on/i.test(rendered)) fails.push('значение вылезло из атрибута data-prog');
/* Кавычка из имени должна остаться &quot;: с живой кавычкой обработчик
   вырвался бы из атрибута и исполнился под токеном учителя. */
if (/onmouseover="/i.test(rendered)) fails.push('в разметку попал чужой обработчик');
if (!rendered.includes('&quot; onmouseover=')) fails.push('кавычка в имени не экранирована');

/* ── тот же кабинет глазами админа ── */
asAdmin = true;
rendered = '';
vm.runInContext(code, ctx);
await new Promise(r => setTimeout(r, 50));
if (/data-check="l0"[^>]*disabled/.test(rendered))
  fails.push('у админа галочка заблокирована — а ставит её он');
if (!rendered.includes('data-mon=')) fails.push('у админа нет кнопки «+ месяц»');
if (!rendered.includes('data-card=')) fails.push('у админа нет правки карточки');

/* ── вкладка «График» ── */
rendered = '';
vm.runInContext(code.replace("view: 'board'", "view: 'week'"), ctx);
await new Promise(r => setTimeout(r, 50));
has('Аяжан', 'ученик в недельной сетке');
has('свободно 1', 'свободное окно: пн 19:00 (сб 11:00 занята)');
if (rendered.includes('data-slot=')) fails.push('учителю дали править график — его ведёт админ');

/* ── отчёты: зарплата по календарным месяцам ── */
ctx.window.__view = 'report';
rendered = '';
vm.runInContext(code.replace("view: 'board'", "view: 'report'"), ctx);
await new Promise(r => setTimeout(r, 50));
has('Сентябрь 2026', 'месяц зарплаты словами');
has('Август 2026', 'прошлый месяц зарплаты');
has('Июль 2026', 'месяц с единственным уроком по ставке 1150');
has('Зарплата по месяцам', 'таблица зарплаты');
/* девять уроков августа по 5000 — 45 000, столько же в сентябре */
if ((rendered.match(/45 000 ₸/g) || []).length < 2)
  fails.push('зарплата не разложилась по месяцам поровну: ожидали два раза по 45 000 ₸');
has('<td class="num">38%</td>', 'процент в отчёте по ученикам');
has('<td class="num">18</td>', 'проведённые уроки в отчёте');

console.log(fails.length ? '✗ ' + fails.join('\n✗ ') : 'OK: кабинет собирается, проценты и зарплата сходятся');
process.exit(fails.length ? 1 : 0);
