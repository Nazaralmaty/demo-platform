#!/usr/bin/env node
/* Сквозная проверка демо в настоящем браузере.

     node app/check_e2e.mjs

   Поднимает свой статический сервер, открывает Chromium и проходит
   сценарий показа целиком, по разным страницам — так, как его пройдёт
   директор школы на встрече:

     учитель отмечает сегодняшний урок → клиент по ссылке отвечает
     «не было» на один урок → в контроле появляется спор, молчание
     уходит → администратор снимает урок → ведомость и обзор пересчитаны
     → в Telegram администратора ушёл алерт.

   Плюс каждый экран на 390 и 1280: ни одной ошибки в консоли и ни
   одного пикселя горизонтальной прокрутки.

   Нужен Playwright: npm i -g playwright && npx playwright install chromium
   (в облачной среде Claude он уже стоит). */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) {}
  try {
    const g = execSync('npm root -g').toString().trim();
    return await import(path.join(g, 'playwright', 'index.mjs'));
  } catch (e) {}
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
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('  ✗ ' + msg); } else console.log('  ✓ ' + msg); }
const flat = (s) => String(s).replace(/[\s  ]+/g, '');

async function open(page, url) {
  await page.goto(BASE + url, { waitUntil: 'load' });
  await page.waitForTimeout(150);
}

/* ── 1. Сценарий показа ─────────────────────────────────────────────── */
console.log('Сценарий показа');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('dialog', (d) => d.accept());

await open(page, 'demo.html');
await page.evaluate(() => localStorage.clear());
await open(page, 'demo.html');
ok(flat(await page.textContent('.h-board')).includes('35650₸'), 'обложка: 35 650 ₸ к выплате');
ok((await page.textContent('#eNavN')).trim() === '7', 'в шапке 7 вопросов в контроле');

await open(page, 'teacher.html?t=t1');
await page.click('button.ok[data-teach]');
await page.waitForTimeout(150);
ok(await page.isVisible('.e-toast.on'), 'учитель: отметка — тост');
ok(await page.locator('.e-les .e-check.on').count() >= 2, 'учитель: сегодняшний урок отмечен в журнале');

await open(page, 'confirm.html?t=gsc-s2-2026-10-1');
const cards = page.locator('.c-les[data-les]');
ok(await cards.count() === 5, 'клиент: Тимур видит 5 уроков');
ok(await page.isDisabled('#cSend'), 'клиент: без ответов кнопка закрыта');
await cards.nth(0).locator('[data-ans="no"]').click();
for (let i = 1; i < 5; i++) await page.locator('.c-les[data-les]').nth(i).locator('[data-ans="yes"]').click();
await page.fill('#cNote', 'Первого октября урок перенесли, а потом не провели.');
await page.click('#cSend');
await page.waitForSelector('.c-done');
ok(true, 'клиент: ответ отправлен');
await page.click('[data-lang="kk"]');
ok((await page.textContent('.c-done h1')).includes('Рақмет'), 'клиент: экран переключается на казахский');
await page.click('[data-lang="ru"]');

await open(page, 'proverka.html');
const kinds = await page.$$eval('.e-ticket .e-chip', (els) => els.map((e) => e.textContent));
ok(!kinds.includes('Клиент не ответил'), 'контроль: молчание Тимура ушло');
ok(kinds.filter((k) => k === 'Учитель и клиент расходятся').length === 2, 'контроль: появился спор по Тимуру');
const timur = page.locator('.e-ticket', { hasText: 'Тимур' });
ok(flat(await timur.textContent()).includes('Первогооктябряурокперенесли'), 'контроль: в споре — слова клиента');
await timur.locator('[data-how="void"]').click();
await page.waitForTimeout(150);
ok(await page.locator('.e-ticket', { hasText: 'Тимур' }).count() === 0, 'контроль: спор Тимура снят');
ok((await page.textContent('#eNavN')).trim() === '6', 'контроль: в шапке 6 вопросов');
const pay = flat(await page.textContent('.e-flow'));
ok(pay.includes('41250₸'), 'контроль: к выплате 35 650 + 4 × 1 400 = 41 250 ₸');

await open(page, 'dashboard.html');
ok(flat(await page.textContent('.e-kpis')).includes('41250₸'), 'обзор: те же 41 250 ₸');
await page.click('[data-card="s2"]');
ok(await page.isVisible('dialog.e-dlg[open]'), 'обзор: журнал ученика открывается');
ok((await page.locator('dialog .e-chip', { hasText: 'Снят' }).count()) === 1, 'обзор: в журнале Тимура урок снят');
await page.click('#dPaid');
ok(!flat(await page.textContent('.e-kpis')).includes('1из7'), 'обзор: оплата Тимура записана, просрочек нет');

await open(page, 'notifications.html?student=s2');
const tg = await page.textContent('#tgFeed');
ok(tg.includes('Тимур') && tg.includes('«не было»'), 'оповещения: администратору ушёл алерт о споре');

await open(page, 'proverka.html?view=client&student=s2');
ok(page.url().includes('confirm.html?t=gsc-s2-2026-10-1'), 'старая ссылка из уведомления ведёт на экран клиента');

ok(errors.length === 0, 'ни одной ошибки в консоли за сценарий' + (errors.length ? ': ' + errors.join(' | ') : ''));
await ctx.close();

/* ── 2. Каждый экран на телефоне и ноутбуке ─────────────────────────── */
console.log('Экраны: 390 и 1280');
const SCREENS = ['demo.html', 'dashboard.html', 'dashboard.html?view=teachers', 'dashboard.html?view=sched',
  'proverka.html', 'teacher.html', 'teacher.html?t=t3', 'notifications.html', 'confirm.html',
  'confirm.html?t=gsc-s3-2026-10-1', 'index.html',
  'archive/v1/demo.html', 'archive/v1/dashboard.html', 'archive/v1/proverka.html', 'archive/v1/teacher.html',
  '1english/index.html', '1english/dashboard.html?demo=1', '1english/teacher.html?demo=1', '1english/confirm.html?demo=1'];
for (const w of [390, 1280]) {
  const c = await browser.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await open(p, 'demo.html');
  await p.evaluate(() => localStorage.clear());
  for (const s of SCREENS) {
    errs.length = 0;
    await open(p, s);
    /* Архив v1 — «как было», его горизонтальную прокрутку не чиним. */
    const over = s.startsWith('archive/') ? 0 : await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 0 && errs.length === 0, w + ' · ' + s + (over > 0 ? ' — едет вбок на ' + over + 'px' : '') +
      (errs.length ? ' — ' + errs.join(' | ') : ''));
  }
  await c.close();
}

await browser.close();
server.close();
console.log((fails ? 'ПРОВАЛ' : 'e2e ok') + ': ' + (checks - fails) + ' из ' + checks);
process.exit(fails ? 1 : 0);
