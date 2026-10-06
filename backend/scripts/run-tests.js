// Runs every *.test.ts under src/ so new tests never need a package.json edit.
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

function find(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? find(p) : p.endsWith('.test.ts') ? [p] : [];
  });
}

const files = find(join(__dirname, '..', 'src')).sort();
const r = spawnSync(process.execPath, ['--require', 'ts-node/register/transpile-only', '--test', ...files], { stdio: 'inherit' });
process.exit(r.status ?? 1);
