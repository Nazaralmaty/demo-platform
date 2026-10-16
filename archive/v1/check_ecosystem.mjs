/* АРХИВ v1 — проверка прошлой версии демо (запуск из корня репозитория: node archive/v1/check_ecosystem.mjs).
   Проверка демо-экосистемы GSC Study без браузера: подставляем фейковый
   window, грузим курс и данные, смотрим, что деньги и очередь расхождений
   сходятся на всех экранах.

   Проверяется то, что ломается молча: начислено = подтверждено + на
   проверке; четыре типа расхождений на месте; зарплата учителей сходится
   с итогом по школе; темы уроков взяты из курса; ссылка в уведомлении
   ведёт на ученика, которому оно пришло. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const ctx = {
  console, setTimeout, clearTimeout, Date, Math, JSON, String, Number, Object,
  Array, RegExp, Promise, isNaN, encodeURIComponent,
  document: undefined, location: { search: '' },
  window: {}
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('app/course.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('archive/v1/data.js', 'utf8'), ctx);
const G = ctx.window.GSC;

assert.ok(G, 'GSC данные загружены');
assert.equal(G.students.length, 7, 'семь учеников');
assert.equal(G.teachers.length, 3, 'три учителя');

/* ── деньги по школе ─────────────────────────────────────────────────
   Начислено по журналу: 39 450 ₸. Подтверждено клиентами: 22 850 ₸.
   На проверке (спор, молчание, открытый период): 16 600 ₸. */
const all = G.totals();
assert.equal(all.accrued, 39450, 'начислено по журналу');
assert.equal(all.confirmed, 22850, 'подтверждено клиентами');
assert.equal(all.hold, 16600, 'висит на проверке');
assert.equal(all.accrued, all.confirmed + all.hold, 'начислено = подтверждено + на проверке');

/* По ученикам руками: Аяжан 7×1150, из них 5 подтверждено; Тимур 5×1400
   без единого подтверждения; Диана 4×1150, из них 2; Арман 4×1150, из
   них 3; Аружан 2×1150 и 1; Ерасыл 7×1500, из них 6; Мадина 2×1200, из
   них 1. Сходится с итогом — иначе таблица разойдётся с KPI. */
const byId = Object.fromEntries(G.students.map((s) => [s.id, s]));
const want = {
  s1: [8050, 5750, 2300], s2: [7000, 0, 7000], s3: [4600, 2300, 2300],
  s4: [4600, 3450, 1150], s5: [2300, 1150, 1150], s6: [10500, 9000, 1500],
  s7: [2400, 1200, 1200]
};
for (const id of Object.keys(want)) {
  const st = G.stat(byId[id]);
  assert.deepEqual([st.accrued, st.confirmed, st.hold], want[id],
    'деньги ученика ' + id);
}

/* По учителям: итог каждой строки обязан сходиться с суммой его
   учеников, а сумма учителей — с итогом по школе. */
let tAcc = 0, tConf = 0, tHold = 0;
for (const t of G.teachers) {
  let acc = 0, conf = 0, hold = 0;
  G.students.filter((s) => s.teacher === t.id).forEach((s) => {
    const st = G.stat(s); acc += st.accrued; conf += st.confirmed; hold += st.hold;
  });
  tAcc += acc; tConf += conf; tHold += hold;
}
assert.equal(tAcc, all.accrued, 'учителя: начислено сходится');
assert.equal(tConf, all.confirmed, 'учителя: подтверждено сходится');
assert.equal(tHold, all.hold, 'учителя: на проверке сходится');

/* ── очередь расхождений ──────────────────────────────────────────────
   Четыре типа: спор на 12.10 у Аяжана, молчание Тимура, урок Дианы без
   отметки учителя, оценка 2 у Дианы на 13.10. */
const tk = G.tickets();
assert.equal(tk.length, 4, 'четыре расхождения');
assert.equal(tk.map((t) => t.kind).sort().join(','), 'dispute,ghost,quality,silent',
  'каждый тип расхождения представлен');

/* Спор разбираем в пользу урока: 1150 уходят из «на проверке» в
   «подтверждено», очередь пустеет на одну строку. */
const before = G.stat(byId.s1);
G.resolve(tk.find((t) => t.kind === 'dispute'), 'paid');
const after = G.stat(byId.s1);
assert.equal(after.confirmed, before.confirmed + 1150, 'спор разобран в пользу урока');
assert.equal(after.hold, before.hold - 1150, 'деньги ушли из проверки');
assert.equal(G.tickets().length, 3, 'спор исчез из очереди');

/* ── темы из курса и ссылки ────────────────────────────────────────── */
const next = G.plan(byId.s1, byId.s1.nextCourse);
assert.equal(next.title, 'Future: Present Continuous', 'Аяжан на шестом уроке A2');
assert.ok(next.words.length >= 8, 'в уроке восемь слов курса');
assert.ok(/Слова:/.test(next.homework), 'домашка собирается из курса');
assert.ok(byId.s1.lessons.every((l) => l.topic && l.homework),
  'у всех уроков тема и домашка из курса');

assert.equal(G.requestFor(byId.s2).id, 'p1', 'Тимур ждёт подтверждения за 1–14 октября');
assert.equal(G.requestFor(byId.s1).id, 'p2', 'Аяжан ответила — видит текущий период');
const letter = G.letter(byId.s2, G.periods[0]);
assert.ok(letter.includes('student=s2'), 'в уведомлении ссылка на этого ученика');
assert.ok(letter.includes('Тимур'), 'в уведомлении имя клиента');

console.log('ecosystem ok: 39 450 ₸ начислено, 22 850 подтверждено, 4 расхождения, деньги учителей сходятся');
