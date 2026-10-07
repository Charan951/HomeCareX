// Usage: npm run seed -- <name>   → runs src/scripts/seed-<name>.ts
// Add new seeds as src/scripts/seed-<name>.ts; no package.json edit needed.
const { existsSync, readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const dir = join(__dirname, '..', 'src', 'scripts');
const name = process.argv[2];
const file = name && join(dir, `seed-${name}.ts`);
if (!file || !existsSync(file)) {
  const available = readdirSync(dir).filter((f) => /^seed-.*\.ts$/.test(f)).map((f) => f.slice(5, -3));
  console.error(`Usage: npm run seed -- <name>\nAvailable: ${available.join(', ')}`);
  process.exit(1);
}
const r = spawnSync('npx', ['ts-node', '--transpile-only', file], { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
