const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const exts = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ttf',
  '.otf',
  '.mp3',
  '.wav',
];
const importRe = /from ['"](\.[^'"]+)['"]|require\(['"](\.[^'"]+)['"]\)/g;
const files = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.expo')) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) files.push(p);
  }
}

function resolveImport(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  if (fs.existsSync(base) && !fs.statSync(base).isDirectory()) {
    return true;
  }
  for (const ext of exts) {
    if (fs.existsSync(base + ext)) return true;
  }
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const ext of exts) {
      if (fs.existsSync(path.join(base, 'index' + ext))) return true;
    }
  }
  return false;
}

walk(root);
const missing = [];

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRe.exec(src))) {
    const spec = match[1] || match[2];
    if (!resolveImport(file, spec)) {
      missing.push({ file: path.relative(root, file), spec });
    }
  }
}

if (missing.length) {
  console.error('Missing imports:');
  missing.forEach(({ file, spec }) => console.error(`  ${file} -> ${spec}`));
  process.exit(1);
}

console.log(`OK: checked ${files.length} files, all relative imports resolve.`);
