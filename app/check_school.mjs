/* Проверка app/school.js на демо-мире: методика, гарантия, возврат, акт.

     node app/check_school.mjs

   Возврат Аружан посчитан руками. Пакет 3 месяца, 24 урока за 120 000 ₸,
   то есть 5 000 ₸ за урок, оплачен 4 октября. В платформу мама вошла в
   тот же вечер. С тех пор уроков по графику: 6, 8, 10, 13, 15 и 17
   октября. Клиент сам подтвердил по ссылке 6, 8, 10 и 13-е; по 15-му
   ответил «не уверен», 17-е ещё ждёт ответа. Значит:
     доступ к платформе      40 000
     4 подтверждённых урока  20 000   (4 × 5 000)
     удерживается            60 000
     к возврату              60 000
   Если и два спорных подтвердятся — удержание вырастет до 70 000. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const mem = {};
const ctx = { console, Date, Math, JSON, String, Number, Object, Array, RegExp, isNaN, isFinite, encodeURIComponent,
  location: { pathname: '/demo-platform/x.html', href: 'https://nazaralmaty.github.io/demo-platform/x.html' },
  localStorage: { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } } };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext('window.BRAND = { name: "GSC Study" };', ctx);
for (const f of ['app/course.js', 'app/control.js', 'app/school.js', 'app/data.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
}
const C = ctx.CTRL, S = ctx.SCHOOL, D = ctx.DEMO;
const same = (a, b, m) => assert.equal(JSON.stringify(a), JSON.stringify(b), m);
const st = D.load();
const F = Object.fromEntries(D.allFacts().map((f) => [f.card.name, f]));

/* ── события платформы ─────────────────────────────────────────────── */
assert.ok(st.activity.length > 50, 'у учеников есть действия в платформе');
assert.ok(st.activity.every((e) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:00\+05:00$/.test(e.at)), 'время событий — в одном формате');
assert.ok(st.activity.every((e) => e.at <= D.TODAY + 'T12:00:00+05:00'), 'ничего из будущего');
for (const c of st.cards) {
  const first = st.activity.filter((e) => e.card_id === c.id).sort((a, b) => a.at.localeCompare(b.at))[0];
  assert.equal(first.kind, 'login', c.name + ': первым — вход в платформу');
  assert.ok(Date.parse(first.at) > Date.parse(c.contract.offer_at), c.name + ': вход после принятия оферты');
}

/* ── возврат Аружан ───────────────────────────────────────────────── */
const ar = F['Аружан'];
let r = S.refund(ar, st.policy);
same([r.paid, r.lessonPrice, r.fee, r.deliveredSum, r.retained, r.refund, r.retainedMax],
  [120000, 5000, 40000, 20000, 60000, 60000, 70000], 'возврат Аружан посчитан как руками');
same(r.delivered.map((s) => s.date), ['2026-10-06', '2026-10-08', '2026-10-10', '2026-10-13'], 'оказано — то, что подтвердил клиент');
same(r.pending.map((s) => s.date), ['2026-10-15', '2026-10-17'], 'спорное — отдельно');
assert.ok(ar.videoMin >= 30 && ar.lessonsOpened >= 3, 'платформой пользовались — видео и уроки');

/* Правила школы меняют расчёт. */
r = S.refund(ar, Object.assign({}, st.policy, { platform_fee: 50000 }));
same([r.retained, r.refund], [70000, 50000], 'доступ 50 000 — удержание 70 000');
/* Кто ни разу не входил в платформу — за доступ не платит. */
const never = S.facts(ar.card, C.analyze(st, D.TODAY), [], D.TODAY, st.policy);
r = S.refund(never, st.policy);
same([r.feeApplies, r.retained, r.refund], [false, 20000, 100000], 'без входа — только уроки');
/* Удержание не больше оплаченного. */
r = S.refund(F['Тимур'], st.policy);
assert.equal(r.retained, r.paid, 'удержание не больше оплаты');

/* Акт: всё из журнала. */
const act = S.act(ar, S.refund(ar, st.policy), { school: 'GSC Study', offer: D.OFFER, today: D.TODAY, policy: st.policy });
for (const t of ['АКТ ОБ ОКАЗАННЫХ УСЛУГАХ', 'Оферта принята в платформе: 4 октября 2026, 19:38', 'К возврату: 60 000 ₸',
  'Удерживается: 60 000 ₸', '6 октября (подтверждено 16 октября 2026, 13:10)', 'В расчёт не включены']) {
  assert.ok(act.includes(t), 'в акте: ' + t);
}

/* ── гарантия ──────────────────────────────────────────────────────── */
const g = (n) => S.guarantee(F[n], st.policy);
assert.equal(g('Аяжан').status, 'ok', 'Аяжан выполняет условия');
assert.equal(g('Ерасыл').status, 'ok', 'Ерасыл выполняет условия');
assert.equal(g('Тимур').status, 'fail', 'Тимур — нет');
assert.equal(g('Тимур').checks.find((c) => c.key === 'homework').value, 0, 'у Тимура ни одной домашки');
assert.equal(g('Мадина').status, 'fail', 'Мадина — нет');
same(g('Мадина').checks.filter((c) => !c.ok).map((c) => c.key), ['attendance', 'homework', 'score'], 'у Мадины три нарушения');
assert.equal(g('Арман').applies, false, 'у Армана гарантии нет');
/* Спорный урок не считается пропуском ученика — у Аяжан 12-го его отменил учитель. */
same([F['Аяжан'].attendance.held, F['Аяжан'].attendance.missed, F['Аяжан'].attendance.disputed], [6, 0, 1], 'спор не пропуск');
/* Мягче правила — Мадина переходит в «под угрозой» или выполняет. */
const soft = Object.assign({}, st.policy, { attendance: 70, homework: 60, score: 60 });
assert.equal(S.guarantee(F['Мадина'], soft).status, 'ok', 'правила школы решают');

/* Нет ни одного набора заданий при сделанных по сроку уроках — тоже нарушение. */
assert.equal(g('Тимур').checks.find((c) => c.key === 'score').ok, false, 'Тимур не открывал задания — условие не выполнено');

/* Справка для клиента, который требует гарантию, а сам не учился. */
const pr = S.proof(F['Тимур'], g('Тимур'), { school: 'GSC Study', offer: D.OFFER, today: D.TODAY, policy: st.policy });
for (const t of ['СПРАВКА О ВЫПОЛНЕНИИ УСЛОВИЙ ГАРАНТИИ', 'Гарантия: IELTS 7.0', 'Домашка в платформе: нужно не ниже 80%, по журналу 0% (0 из 5) — НЕ выполнено',
  'Посещаемость: нужно не ниже 90%, по журналу 100%', 'Домашние задания в платформе не выполнены (срок — 2 дня после урока): 1 октября',
  'условия гарантии не выполнены']) {
  assert.ok(pr.includes(t), 'в справке: ' + t);
}
assert.ok(S.proof(F['Аяжан'], g('Аяжан'), { today: D.TODAY }).includes('условия гарантии выполняются'), 'у Аяжан — выполняются');
/* Пункты оферты следуют правилам школы. */
const cl = S.clause(Object.assign({}, st.policy, { platform_fee: 50000, hw_days: 1 }), { school: 'GSC Study' });
assert.ok(cl.includes('Стоимость доступа — 50 000 ₸') && cl.includes('в течение 1 дня после урока') && cl.includes('не ниже 90%'), 'оферта из правил');

/* ── методика ──────────────────────────────────────────────────────── */
const dev = S.methodology(D.allFacts());
same(dev.filter((d) => d.kind === 'offprog').map((d) => d.f.card.name + ' ' + d.date).sort(),
  ['Диана 2026-10-10', 'Ерасыл 2026-10-10', 'Ерасыл 2026-10-11'], 'уроки вне программы');
assert.ok(dev.some((d) => d.kind === 'nohw' && d.f.card.name === 'Тимур' && d.count >= 4), 'Тимур подряд без домашки');
assert.equal(S.verdict(F['Аяжан'])[0], 'по методике');
assert.equal(S.verdict(F['Тимур'])[0], 'не учится в платформе');

/* Подготовка к сегодняшнему уроку видна учителю заранее. */
const todayAy = st.lessons.find((l) => l.id === 's1-2026-10-19');
assert.equal(S.prepared(todayAy, F['Аяжан'].card, st.activity), true, 'Аяжан посмотрела видео к сегодняшнему уроку');

/* ── действия ──────────────────────────────────────────────────────── */
assert.equal(D.act.policy({ platform_fee: 45000 }), 'ok');
assert.equal(D.load().policy.platform_fee, 45000, 'правило сохранилось');
assert.equal(S.refund(D.facts('s5'), D.load().policy).refund, 55000, 'и расчёт пересчитался');
assert.equal(D.act.refund('rf-s5', 55000), 'ok');
assert.equal(D.act.refund('rf-s5', 55000), 'Уже решено', 'дважды не решается');
D.reset();
assert.equal(D.load().policy.platform_fee, 40000, 'сброс возвращает правила');
assert.equal(D.load().refunds[0].status, 'open', 'и запрос на возврат');

console.log('school ok: возврат Аружан 60 000 из 120 000 (40 000 доступ + 4 × 5 000), гарантия 2 из 4 выполняют, 3 урока вне программы, акт из журнала');
