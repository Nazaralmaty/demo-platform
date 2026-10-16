#!/usr/bin/env node
/* Контроль уроков в настоящем браузере, на тестовых данных (?demo=1):
   ни базы, ни входа. Это копия ветки 1english-platform внутри
   demo-platform/1english — запускать из папки 1english:

     cd 1english && node app/check_control_e2e.mjs

   Дашборд: вкладка «Контроль» — очередь, решение спора, ведомость,
   поля оплаты в карточке. Кабинет учителя: отметка урока, замок на
   подтверждённом, «Взять из курса». Экран клиента: ответ по ссылке и
   казахский. И каждый экран на 390 и 1280: без ошибок в консоли и без
   горизонтальной прокрутки.

   Нужен Playwright: npm i -g playwright && npx playwright install chromium. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) {}
  try { return await import(path.join(execSync('npm root -g').toString().trim(), 'playwright', 'index.mjs')); } catch (e) {}
  console.error('Нет Playwright. Один раз: npm i -g playwright && npx playwright install chromium');
  process.exit(2);
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, p === '/' ? 'index.html' : p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/';
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) fails++; console.log('  ' + (c ? '✓ ' : '✗ ') + m); };
const flat = (s) => String(s).replace(/[\s  ]+/g, '');
/* Сеть наружу (YouTube, шрифты Google) в тесте может быть закрыта —
   это не ошибка экрана. Считаем только ошибки скриптов. */
const real = (t) => !/Failed to load resource|ERR_|net::/i.test(t);

const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && real(m.text())) errors.push(m.text()); });
page.on('dialog', (d) => d.accept());

console.log('Дашборд · контроль');
await page.goto(BASE + 'dashboard.html?demo=1');
await page.waitForTimeout(300);
await page.click('[data-view="control"]');
await page.waitForTimeout(200);
const before = await page.locator('.e-ticket').count();
ok(before === 6, 'в очереди 6 вопросов: спор, подозрительная, без отметки, не уверен, оценка, молчание');
const pay0 = flat(await page.textContent('.e-flow .e-kpi.ok b'));
await page.locator('.e-ticket', { hasText: 'расходятся' }).locator('[data-how="paid"]').click();
await page.waitForTimeout(300);
ok(await page.locator('.e-ticket').count() === before - 1, 'спор разобран — вопросов на один меньше');
const pay1 = flat(await page.textContent('.e-flow .e-kpi.ok b'));
ok(parseInt(pay1) === parseInt(pay0) + 1150, 'к выплате выросло на 1 150 ₸: ' + pay0 + ' → ' + pay1);
ok((await page.textContent('[data-view="control"]')).includes(String(before - 1)), 'число на вкладке обновилось');
const wa = await page.getAttribute('[data-remind]', 'href');
ok(/^https:\/\/wa\.me\/7\d{10}\?text=/.test(wa) && decodeURIComponent(wa).includes('confirm.html?t='), 'напоминание — WhatsApp со ссылкой клиента');
await page.click('[data-cl="ru"]');
ok(decodeURIComponent(await page.getAttribute('[data-remind]', 'href')).includes('напоминаем'), 'текст переключается на русский');
await page.click('[data-view="all"]');
ok(await page.locator('td .e-chip').count() >= 3, 'сводная: колонка оплаты клиента');
await page.click('[data-view="students"]');
await page.click('[data-edit="a"]');
ok(await page.locator('dialog [id$="Pay"]').count() >= 1, 'карточка: поля оплаты в «Изменить»');
await page.keyboard.press('Escape');

console.log('Кабинет учителя');
await page.goto(BASE + 'teacher.html?demo=1');
await page.waitForTimeout(300);
const lockedN = await page.locator('input[data-check]:disabled:checked').count();
ok(lockedN >= 10, 'подтверждённые клиентом уроки под замком: ' + lockedN);
ok(await page.locator('.t-issues .e-ticket').count() === 2, 'вопросы по урокам видны учителю: спор и низкая оценка');
const id = await page.locator('input[data-check]:not(:disabled):checked').first().getAttribute('data-check');
await page.uncheck('input[data-check="' + id + '"]');
await page.waitForTimeout(300);
ok(!(await page.isChecked('input[data-check="' + id + '"]')), 'учитель снял отметку с урока, который ждёт клиента');
await page.check('input[data-check="' + id + '"]');
await page.waitForTimeout(300);
ok(await page.isChecked('input[data-check="' + id + '"]'), 'и поставил обратно');
/* Первый урок, который ждёт клиента, — предпоследний пн/ср/пт до сегодня.
   Отметка позже трёх дней после урока — вопрос «задним числом»; раньше —
   обычная отметка. Считаем, какой из случаев сегодня. */
{
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const now = new Date(), today = iso(now);
  const dates = [];
  for (let d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 45); dates.length < 48; d.setDate(d.getDate() + 1))
    if ([1, 3, 5].includes(d.getDay())) dates.push(iso(d));
  const past = dates.filter((x) => x < today).length, target = dates[past - 2];
  const late = (Date.parse(today) - Date.parse(target)) / 864e5 > 3;
  const text = await page.textContent('.t-issues');
  ok(text.includes('отмечен задним числом') === late, late
    ? 'урок ' + target + ' отмечен спустя дни — сразу вопрос «задним числом»'
    : 'урок ' + target + ' отмечен вовремя — вопроса «задним числом» нет');
}
await page.locator('[data-les][data-focus="topic"]').nth(30).click();
await page.selectOption('#lc', 'p6');
ok((await page.inputValue('#lt')).includes('Future: Present Continuous'), '«Взять из курса» подставил тему');
ok((await page.inputValue('#lh')).includes('В платформе'), 'и домашку из урока курса');
await page.keyboard.press('Escape');

console.log('Экран клиента');
await page.goto(BASE + 'confirm.html?demo=1');
await page.waitForTimeout(300);
ok((await page.textContent('.c-h')).includes('сабақтары'), 'по умолчанию казахский');
const n = await page.locator('.c-les[data-les]').count();
for (let i = 0; i < n; i++) await page.locator('.c-les[data-les]').nth(i).locator('[data-ans="yes"]').click();
await page.click('#cSend');
await page.waitForSelector('.c-done');
ok((await page.textContent('.c-done h1')).includes('Рақмет'), 'ответ отправлен, «Рақмет»');
ok(errors.length === 0, 'ни одной ошибки скриптов' + (errors.length ? ': ' + errors.join(' | ') : ''));
await ctx.close();

console.log('Тестовая копия не ходит в базу');
{
  const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await c.newPage();
  const outside = [];
  p.on('request', (r) => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|fonts\.(googleapis|gstatic)\.com)$/.test(u.hostname)) outside.push(r.url()); });
  for (const s of ['dashboard.html', 'teacher.html', 'confirm.html']) {
    await p.goto(BASE + s);
    await p.waitForURL(/demo=1/);
    await p.waitForTimeout(250);
    ok(/[?&]demo=1/.test(p.url()), s + ' без ?demo сам переходит на тестовые данные');
  }
  await p.click('[data-lang="ru"]').catch(() => {});
  ok(outside.length === 0, 'ни одного запроса наружу' + (outside.length ? ': ' + outside.join(' ') : ''));
  await c.close();
}

console.log('Экраны: 390 и 1280');
const SCREENS = ['dashboard.html?demo=1', 'teacher.html?demo=1', 'teacher.html?demo=admin', 'confirm.html?demo=1'];
for (const w of [390, 1280]) {
  const c = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && real(m.text())) errs.push(m.text()); });
  for (const s of SCREENS) {
    const tabs = s.startsWith('dashboard') ? ['students', 'new', 'sched', 'all', 'control'] : [null];
    for (const t of tabs) {
      errs.length = 0;
      await p.goto(BASE + s);
      await p.waitForTimeout(250);
      if (t) { await p.click('[data-view="' + t + '"]'); await p.waitForTimeout(150); }
      const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      ok(over <= 0 && !errs.length, w + ' · ' + s + (t ? ' · ' + t : '') + (over > 0 ? ' — едет вбок на ' + over + 'px' : '') +
        (errs.length ? ' — ' + errs.join(' | ') : ''));
    }
  }
  await c.close();
}

await browser.close();
server.close();
console.log((fails ? 'ПРОВАЛ' : 'e2e ok') + ': ' + (checks - fails) + ' из ' + checks);
process.exit(fails ? 1 : 0);
