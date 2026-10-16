#!/usr/bin/env node
/* Проверка схемы на настоящем Postgres: заглушка Supabase, все патчи по
   порядку, база «как до контроля уроков», патч контроля (дважды — он
   должен быть повторяемым) и тест от имени учителя, админа и клиента.

     PGHOST=… PGPORT=… PGUSER=postgres node backend/test/check_sql.mjs

   Нужны psql, createdb и dropdb (Postgres 16: brew install postgresql@16).
   База en_check создаётся заново при каждом запуске.

   Последний шаг — сверка правила выплаты: одни и те же случаи считает
   триггер базы и CTRL.payable из app/control.js. Разойдутся — экран
   покажет «к выплате» не то, что заплатит база. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DB = process.env.EN_CHECK_DB || 'en_check';
const CONTROL = 'patch_2026-10-16_control.sql';

function sh(cmd, args, quiet) {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    console.error('✗ ' + cmd + ' ' + args.join(' ') + '\n' + (e.stdout || '') + (e.stderr || ''));
    process.exit(1);
  }
}
const psqlFile = (f) => sh('psql', ['-q', '-X', '-v', 'ON_ERROR_STOP=1', '-d', DB, '-f', f]);
const psql = (sql) => sh('psql', ['-q', '-X', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-d', DB, '-c', sql]).trim();

sh('dropdb', ['--if-exists', DB]);
sh('createdb', [DB]);

const patches = fs.readdirSync(path.join(ROOT, 'backend')).filter((f) => /^patch_.*\.sql$/.test(f)).sort();
const before = patches.filter((f) => f < CONTROL), after = patches.filter((f) => f >= CONTROL && f !== CONTROL);
const plan = ['backend/test/supabase_stub.sql', 'backend/supabase_min.sql',
  ...before.map((f) => 'backend/' + f), 'backend/test/legacy_setup.sql',
  'backend/' + CONTROL, 'backend/' + CONTROL, ...after.map((f) => 'backend/' + f)];
for (const f of plan) { psqlFile(f); console.log('  ✓ ' + f); }

const out = psqlFile('backend/test/control_test.sql');
console.log('  ' + out.trim().split('\n').pop());

/* ── сверка правила выплаты с app/control.js ─────────────────────────── */
const ctx = {}; ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'app/control.js'), 'utf8'), ctx);
const C = ctx.CTRL;
let n = 0, bad = 0;
for (const taught of [true, false]) for (const answer of [null, 'yes', 'no', 'unsure'])
for (const quality of [null, 1, 2, 3, 5]) for (const review of [null, 'paid', 'void']) {
  if (answer !== 'yes' && quality != null) continue;
  const lit = (v) => (v == null ? 'null' : typeof v === 'string' ? "'" + v + "'" : String(v));
  const got = psql("insert into public.en_teacher_lessons (card_id, month, idx, plan_date, taught, client_answer, client_quality, review) " +
    "values ('22222222-2222-2222-2222-222222222222', " + (20 + Math.floor(n / 31)) + ', ' + (n++ % 31 + 1) + ", current_date - 1, " + taught + ', ' + lit(answer) + ', ' +
    lit(quality) + ', ' + lit(review) + ') returning done') === 't';
  const want = C.payable({ taught, client_answer: answer, client_quality: quality, review });
  if (got !== want) { bad++; console.error('  ✗ расходятся: ' + JSON.stringify({ taught, answer, quality, review, base: got, screen: want })); }
}
console.log((bad ? '  ✗ ' : '  ✓ ') + 'правило выплаты: база и app/control.js согласны в ' + (n - bad) + ' из ' + n + ' случаев');
if (bad) process.exit(1);
console.log('sql ok');
