// Creates today's per-member GitHub issues from docs/issues/issues.json
// (the same data the member_issues/*.pdf books are generated from).
//
// Usage:  node .github/scripts/create-daily-issues.mjs [--date YYYY-MM-DD] [--day N] [--dry-run]
// Env:    GH_TOKEN (repo scope), optional PROJECT_TOKEN (project scope) + PROJECT_NUMBER, PROJECT_OWNER
//
// Idempotent: an issue whose title already exists (open or closed) is skipped.

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PLAN_YEAR = 2026;
const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const DRY = args.includes('--dry-run');

const issues = JSON.parse(readFileSync(new URL('../../docs/issues/issues.json', import.meta.url), 'utf8'));

// ---- pick today's day --------------------------------------------------------
function todayIST() {
  // Runner is UTC; the team works in IST.
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
function isoOf(planDate) {
  // "Wed 30 Sep" -> "2026-09-30"
  const d = new Date(`${planDate.split(' ').slice(1).join(' ')} ${PLAN_YEAR} 12:00 UTC`);
  return d.toISOString().slice(0, 10);
}

let todays;
if (arg('--day')) {
  todays = issues.filter((i) => i.day === Number(arg('--day')));
} else {
  const date = arg('--date') ?? todayIST();
  todays = issues.filter((i) => isoOf(i.date) === date);
  if (!todays.length) {
    console.log(`No plan issues scheduled for ${date} (weekend, holiday or outside the plan). Nothing to do.`);
    process.exit(0);
  }
}

// ---- body rendering ------------------------------------------------------------
const PRI = { '!': 'BLOCKER', '~': 'P1' };

// Split the generated body into its "### Heading" sections.
function sections(body) {
  const out = {};
  let cur = null;
  for (const line of body.split('\n')) {
    const m = line.match(/^### (.+)$/);
    if (m) { cur = m[1].trim(); out[cur] = []; continue; }
    if (cur) out[cur].push(line);
  }
  return out;
}
const bullets = (lines = []) => lines.filter((l) => l.startsWith('- '));

// "Tasks (in order)" holds **Frontend** / **Backend / API** sub-blocks.
function splitTasks(lines = []) {
  const res = { fe: [], be: [] };
  let bucket = 'fe';
  for (const l of lines) {
    if (/^\*\*Frontend/.test(l)) bucket = 'fe';
    else if (/^\*\*Backend/.test(l)) bucket = 'be';
    else if (l.startsWith('- [ ]')) res[bucket].push(l);
  }
  return res;
}

function render(i) {
  const s = sections(i.body);
  const t = splitTasks(s['Tasks (in order)']);
  const pages = bullets(s['Pages / routes (spec)']);
  const fe = bullets(s['Frontend changes (module)']);
  const be = bullets(s['Backend changes (module)']);
  const rules = bullets(s['Business & security rules']);
  const branchNote = i.first
    ? ' (create it today and open a Draft PR)'
    : i.last ? ' (last day of this module: mark the PR Ready for review)' : ' (continue the same branch and Draft PR)';

  const out = [];
  out.push(
    `> **Issue ID:** \`${i.id}\` · **Date:** ${i.date} ${PLAN_YEAR} (Week ${i.week}, Day ${i.day}) · **Owner:** @${i.gh}`,
    `> **Module:** ${i.module} · **Branch:** \`${i.branch}\`${branchNote}`,
    `> **PR title:** \`${i.pr_title}\` · **Commit example:** \`${i.commit}\``,
    '',
  );
  if (pages.length) out.push('## Pages / routes', ...pages, '');

  out.push('## Frontend Tasks', '**Today (in order)**', ...(t.fe.length ? t.fe : ['- _No frontend task today._']), '');
  if (fe.length) out.push('**Files / components for this module**', ...fe, '');

  out.push('## Backend Tasks', '**Today (in order)**', ...(t.be.length ? t.be : ['- _No backend task today._']), '');
  if (be.length) out.push('**Model / layers / APIs for this module**', ...be, '');
  if (i.apis.length) out.push('**APIs touched today**', ...i.apis.map((a) => `- \`${a}\``), '');

  out.push(
    '## Testing',
    ...i.tests.map((x) => `- [ ] ${x}`),
    '- [ ] Loading, empty, error and offline states render (no blank screen)',
    '- [ ] Responsive at 360 / 768 / 1280 px, no horizontal scroll; keyboard only with visible focus',
    '- [ ] `npm run build` passes (frontend and/or backend); no console errors, no `any`, ESLint clean',
    "- [ ] Postman: success case + failure cases (missing field, no token, wrong role, another user's id)",
    '',
    '## Acceptance Criteria',
    ...i.done.map((x) => `- [ ] ${x}`),
    ...rules.map((r) => r.replace(/^- /, '- [ ] ')),
    '- [ ] Draft PR open to `develop` with `Closes #<this issue>`, screenshots / Postman proof attached',
    '',
  );
  if (i.deps) out.push(`**Dependencies / notes:** ${i.deps}`, '');
  out.push(
    '---',
    'Rules: one branch + one PR per module; never push to `develop`/`main`; no secrets or `.env`. ' +
      'See *HomeCareX_Member_Daily_Guide.pdf* and your issue book `member_issues/HomeCareX_Issues_<Name>.pdf`.',
  );
  return out.join('\n');
}

// ---- GitHub ----------------------------------------------------------------------
const gh = (a, opts = {}) => execFileSync('gh', a, { encoding: 'utf8', ...opts }).trim();

if (DRY) {
  for (const i of todays) console.log(`\n==== ${i.gh_title}\n[${i.labels.join(', ')}] @${i.gh} / ${i.milestone}\n\n${render(i)}`);
  process.exit(0);
}

const existing = new Set(
  JSON.parse(gh(['issue', 'list', '--state', 'all', '--limit', '1000', '--json', 'title'])).map((x) => x.title),
);
const labels = new Set(JSON.parse(gh(['label', 'list', '--limit', '500', '--json', 'name'])).map((x) => x.name));
const milestones = new Set(
  JSON.parse(gh(['api', 'repos/{owner}/{repo}/milestones?state=all&per_page=100'])).map((m) => m.title),
);

let failed = 0;
for (const i of todays) {
  if (existing.has(i.gh_title)) { console.log(`skip (exists): ${i.gh_title}`); continue; }
  try {
    for (const l of i.labels) if (!labels.has(l)) { gh(['label', 'create', l, '--force']); labels.add(l); }
    if (!milestones.has(i.milestone)) {
      gh(['api', 'repos/{owner}/{repo}/milestones', '-f', `title=${i.milestone}`]);
      milestones.add(i.milestone);
    }
    const url = gh(
      ['issue', 'create', '--title', i.gh_title, '--body-file', '-', '--assignee', i.gh,
        '--milestone', i.milestone, ...i.labels.flatMap((l) => ['--label', l])],
      { input: render(i) },
    );
    console.log(`created: ${url}`);

    if (process.env.PROJECT_TOKEN && process.env.PROJECT_NUMBER) {
      try {
        gh(['project', 'item-add', process.env.PROJECT_NUMBER, '--owner', process.env.PROJECT_OWNER, '--url', url],
          { env: { ...process.env, GH_TOKEN: process.env.PROJECT_TOKEN } });
      } catch (e) {
        console.warn(`  could not add to project: ${e.message.split('\n')[0]}`);
      }
    }
  } catch (e) {
    failed++;
    console.error(`FAILED: ${i.gh_title}\n${e.stderr || e.message}`);
  }
}
process.exit(failed ? 1 : 0);
