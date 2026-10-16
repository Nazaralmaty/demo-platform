/* Проверка движка контроля уроков (app/control.js) и демо-мира (app/data.js)
   без браузера: подставляем window, localStorage и location, грузим курс,
   движок и мир, сверяем деньги и очередь с тем, что посчитано руками.

   Ловится то, что ломается молча: урок в двух корзинах сразу, деньги
   учителей не сходятся с итогом школы, «подозрительно» на уроке, который
   клиент подтвердил, отметка, которую можно снять после ответа клиента. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

function world() {
  const mem = {};
  const ctx = {
    console, Date, Math, JSON, String, Number, Object, Array, RegExp, Promise, isNaN,
    encodeURIComponent, decodeURIComponent,
    location: { pathname: '/demo-platform/proverka.html', href: 'https://nazaralmaty.github.io/demo-platform/proverka.html', search: '' },
    localStorage: {
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => { mem[k] = String(v); },
      removeItem: (k) => { delete mem[k]; }
    }
  };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext('window.BRAND = { name: "GSC Study" };', ctx);
  for (const f of ['app/course.js', 'app/control.js', 'app/data.js']) {
    vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

/* Массивы из vm-контекста — другого «мира»: deepStrictEqual их не равняет. */
const same = (a, b, msg) => assert.equal(JSON.stringify(a), JSON.stringify(b), msg);

const W = world();
const C = W.CTRL, D = W.DEMO;

/* ── периоды ─────────────────────────────────────────────────────────── */
same([C.period('2026-10-15').from, C.period('2026-10-15').to], ['2026-10-01', '2026-10-15']);
same([C.period('2026-10-16').from, C.period('2026-10-16').to], ['2026-10-16', '2026-10-31']);
assert.equal(C.period('2028-02-20').to, '2028-02-29', 'февраль високосного года');
assert.equal(C.period('2026-02-20').to, '2026-02-28', 'февраль обычного года');
assert.equal(C.prevPeriod(C.period('2027-01-03')).key, '2026-12-2', 'через Новый год назад');
assert.equal(C.nextPeriod(C.period('2026-12-20')).key, '2027-01-1', 'через Новый год вперёд');
assert.equal(C.lastClosed('2026-10-19').key, '2026-10-1');
assert.equal(C.periodLabel(C.period('2026-10-02'), 'ru'), '1–15 октября');
assert.equal(C.periodLabel(C.period('2026-10-20'), 'kk'), '16–31 қазан');
assert.equal(C.weekday('2026-10-19'), 'mon');
assert.equal(C.diffDays('2026-10-16', '2026-10-19'), 3);
same(C.plannedDates({ days: 'tue,thu', started_on: '2026-10-06' }, C.period('2026-10-01')),
  ['2026-10-06', '2026-10-08', '2026-10-13', '2026-10-15'], 'график с даты начала');

/* ── правило выплаты: каждый случай ───────────────────────────────────
   Та же таблица проверяется на триггере базы в 1english-platform. */
const cases = [
  [{ taught: true,  client_answer: 'yes', client_quality: 5 },    true,  'confirmed'],
  [{ taught: true,  client_answer: 'yes', client_quality: null }, true,  'confirmed'],
  [{ taught: true,  client_answer: 'yes', client_quality: 3 },    true,  'confirmed'],
  [{ taught: true,  client_answer: 'yes', client_quality: 2 },    false, 'lowq'],
  [{ taught: true,  client_answer: 'no' },                        false, 'dispute'],
  [{ taught: true,  client_answer: 'unsure' },                    false, 'unsure'],
  [{ taught: true,  client_answer: null },                        false, 'awaiting'],
  [{ taught: false, client_answer: 'yes', client_quality: 5 },    false, 'ghost'],
  [{ taught: false, client_answer: 'no' },                        false, 'cancelled'],
  [{ taught: false, client_answer: null },                        false, 'planned'],
  [{ taught: true,  client_answer: 'no', review: 'paid' },        true,  'paid'],
  [{ taught: false, client_answer: 'yes', review: 'paid' },       true,  'paid'],
  [{ taught: true,  client_answer: 'yes', client_quality: 5, review: 'void' }, false, 'void']
];
for (const [l, pay, st] of cases) {
  assert.equal(C.payable(l), pay, 'выплата: ' + JSON.stringify(l));
  assert.equal(C.status(l), st, 'статус: ' + JSON.stringify(l));
  assert.equal(C.BUCKET[st] === 'payable', pay, 'корзина и выплата согласны: ' + st);
}
assert.equal(C.status({ taught: true }, { flags: ['offday'] }), 'suspect');
assert.equal(C.status({ taught: true }, { silent: true }), 'silent');
assert.equal(C.status({ taught: true, client_answer: 'yes' }, { flags: ['offday'] }), 'confirmed',
  'подтверждённое клиентом не подозрительно');

/* ── демо-мир ─────────────────────────────────────────────────────────── */
const st = D.load();
assert.equal(st.cards.length, 7, 'семь учеников');
assert.equal(st.teachers.length, 3, 'три учителя');

/* Каждый урок — в свой день недели по графику, кроме двух подставных. */
const off = st.lessons.filter((l) => {
  const card = st.cards.find((c) => c.id === l.card_id);
  return !card.days.split(',').includes(C.weekday(C.dateOf(l)));
});
same(off.map((l) => l.id).sort(), ['s6-2026-10-10', 's6-2026-10-11'], 'не по графику только две отметки');
assert.ok(st.lessons.filter((l) => l.course_id).every((l) => /^Урок \d+ · /.test(l.topic)), 'темы — уроки курса');

let an = D.analyze();
const kinds = (a) => a.tickets.map((t) => t.kind).sort().join(',');
assert.equal(kinds(an), 'dispute,ghost,lowq,silent,suspect,suspect,unsure', 'все типы расхождений');
assert.equal(an.tickets[0].kind, 'dispute', 'спор первым в очереди');

const susp = an.tickets.filter((t) => t.kind === 'suspect');
for (const t of susp) {
  for (const f of ['offday', 'overrun', 'late', 'after']) {
    assert.ok(t.rows[0].flags.includes(f), 'подозрение ' + f + ' у ' + t.rows[0].l.id);
  }
}
const silent = an.tickets.find((t) => t.kind === 'silent');
assert.equal(silent.card.name, 'Тимур');
assert.equal(silent.rows.length, 5, 'молчание — все пять уроков Тимура');
assert.equal(silent.sum, 7000);

/* Ровно одна корзина у каждой строки, и заявленное сходится. */
function invariants(a) {
  for (const r of a.rows) {
    assert.ok(C.BUCKET[r.status], 'у статуса есть корзина: ' + r.status);
    if (r.bucket === 'payable') assert.ok(C.payable(r.l), 'к выплате только то, что платит база: ' + r.l.id);
    if (C.payable(r.l)) assert.equal(r.bucket, 'payable', 'база платит — экран тоже: ' + r.l.id);
  }
  const m = C.money(a.rows);
  const taught = a.rows.filter((r) => r.l.taught);
  const mt = C.money(taught);
  assert.equal(m.claimed, mt.payable + mt.awaiting + mt.review + mt.voided, 'заявлено = сумма корзин отмеченных');
  return m;
}

/* Деньги первой половины октября, посчитанные руками:
   к выплате 5750 + 0 + 5750 + 5750 + 4600 + 9000 + 4800 = 35 650;
   на проверке 1150 + 7000 + 2300 + 0 + 1150 + 3000 + 0 = 14 600;
   заявлено учителями 49 100 (призрак Дианы не заявлен — его не отметили). */
let m1 = invariants({ rows: C.forPeriod(an, D.P1) });
same([m1.payable, m1.review, m1.claimed, m1.awaiting], [35650, 14600, 49100, 0], 'деньги 1–15 октября');
const m2 = C.money(C.forPeriod(an, D.P2));
same([m2.awaiting, m2.payable], [4950, 0], 'вторая половина: всё ждёт клиента');

const pr = C.payroll(an, D.P1, st.teachers);
same(pr.map((x) => x.money.payable), [11500, 15150, 9000], 'ведомость по учителям');
assert.equal(pr.reduce((a, x) => a + x.money.payable, 0), m1.payable, 'ведомость сходится со школой');

/* ── действия ─────────────────────────────────────────────────────────── */
/* Учитель не может снять отметку, которую клиент уже подтвердил. */
assert.match(D.act.teach('s1-2026-10-02', false), /закрыта/);
/* И не может отметить урок, который ещё не наступил. */
const future = st.lessons.find((l) => l.card_id === 's1' && C.dateOf(l) > D.TODAY);
assert.match(D.act.teach(future.id, true), /не наступил/);
/* Сегодняшний урок отметить можно — он ждёт клиента. */
assert.equal(D.act.teach('s1-2026-10-19', true), 'ok');
an = D.analyze();
assert.equal(an.rows.find((r) => r.l.id === 's1-2026-10-19').status, 'awaiting');

/* Тимур отвечает по ссылке: всё было. Молчание уходит, 7000 — в выплату. */
const tk = 'gsc-s2-2026-10-1';
const pay = D.confirmPayload(st, tk);
assert.equal(pay.lessons.length, 5, 'клиент видит пять уроков');
assert.equal(D.act.answer(tk, Object.fromEntries(pay.lessons.map((l) => [l.id, { answer: 'yes', quality: 5 }])), ''), 'ok');
an = D.analyze();
assert.ok(!an.tickets.some((t) => t.kind === 'silent'), 'молчание ушло');
m1 = invariants({ rows: C.forPeriod(an, D.P1) });
assert.equal(m1.payable, 35650 + 7000, 'ответ Тимура ушёл в выплату');

/* Спор разбираем в пользу урока, «призрака» засчитываем. */
const dispute = an.tickets.find((t) => t.kind === 'dispute');
assert.equal(D.act.resolve(dispute.id, 'paid', 'перенос подтвердил учитель'), 'ok');
const ghost = D.analyze().tickets.find((t) => t.kind === 'ghost');
assert.equal(D.act.resolve(ghost.id, 'paid'), 'ok');
const gl = D.load().lessons.find((l) => l.id === ghost.rows[0].l.id);
assert.ok(gl.taught && gl.review === 'paid', 'засчитанный призрак стал проведённым');
/* Подозрительные отметки снимаем. */
for (const t of D.analyze().tickets.filter((x) => x.kind === 'suspect')) D.act.resolve(t.id, 'void');
an = D.analyze();
m1 = invariants({ rows: C.forPeriod(an, D.P1) });
assert.equal(m1.payable, 35650 + 7000 + 1150 + 1150, 'спор и призрак — к выплате');
assert.equal(m1.voided, 3000, 'две подставные отметки сняты');
assert.equal(kinds(an), 'lowq,unsure', 'в очереди осталось два вопроса');

/* Новое расхождение — сразу алерт, и только один. */
const alertsNow = () => D.load().messages.filter((x) => x.kind === 'alert').length;
const alerts0 = alertsNow();
assert.equal(D.act.sendRequests(D.P2.key), 4, 'запросы за 16–31 октября — тем, у кого уже есть уроки');
assert.equal(D.act.sendRequests(D.P2.key), 0, 'второй раз запрос не дублируется');
const tk2 = 'gsc-s1-' + D.P2.key;
const p2 = D.confirmPayload(D.load(), tk2);
assert.equal(D.act.answer(tk2, Object.fromEntries(p2.lessons.map((l) => [l.id, { answer: 'no' }])), 'не было'), 'ok');
assert.equal(alertsNow(), alerts0 + p2.lessons.length, 'по алерту на каждый новый спор');
D.act.teach('s3-2026-10-20', false);   /* любое действие пересчитывает очередь */
assert.equal(alertsNow(), alerts0 + p2.lessons.length, 'повторно алерт не уходит');
assert.equal(D.act.teach('s4-2026-10-17', true), 'Урока нет', 'урока не по графику в журнале нет');

/* ── тексты ───────────────────────────────────────────────────────────── */
const reqText = D.requestText(D.load(), D.load().requests.find((r) => r.card_id === 's1'));
assert.ok(reqText.includes('confirm.html?t=gsc-s1-2026-10-1'), 'в запросе ссылка на этого ученика');
assert.ok(reqText.includes('Айгерім Нұрлан') && reqText.includes('6 уроков'), 'в запросе учитель и число уроков');
const kk = C.text('request', { school: 'GSC Study', student: 'Аяжан', teacher: 'Айгерім', count: 6,
  period: D.P1, url: 'u' }, 'kk');
assert.ok(kk.includes('1–15 қазан') && kk.includes('6 сабақ'), 'казахский текст');
assert.equal(C.waLink('8 701 123 45 67', 'a b'), 'https://wa.me/77011234567?text=a%20b');

/* Сброс возвращает мир как был. */
D.reset();
assert.equal(kinds(D.analyze()), 'dispute,ghost,lowq,silent,suspect,suspect,unsure', 'сброс демо');

console.log('control ok: 7 типов очереди, 1–15 окт: 35 650 ₸ к выплате, 14 600 на проверке, ведомость сходится, действия и сброс работают');
