const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ignoredDirs = new Set([
  '.git',
  'node_modules',
  '_unused_review',
  '.tmp',
  'artifacts',
  'dist-timeweb',
  'kxchat-server',
  'tests',
  'playwright-report',
  'coverage'
]);

const files = [];
const problems = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (/\.(html|css)$/i.test(entry.name)) {
      files.push(full);
    }
  }
}

function cleanRef(ref) {
  if (!ref) return '';
  const trimmed = ref.trim();
  if (
    trimmed === '' ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('javascript:') ||
    /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ||
    trimmed.startsWith('//')
  ) {
    return '';
  }
  const withoutHash = trimmed.split('#')[0].split('?')[0];
  if (withoutHash === '' || withoutHash.endsWith('/')) return '';
  try {
    return decodeURI(withoutHash);
  } catch (_) {
    return withoutHash;
  }
}

function resolveRef(fromFile, ref) {
  const cleaned = cleanRef(ref);
  if (!cleaned) return null;
  if (cleaned.startsWith('/')) {
    return path.join(root, cleaned.slice(1));
  }
  return path.resolve(path.dirname(fromFile), cleaned);
}

function checkRef(fromFile, ref) {
  const target = resolveRef(fromFile, ref);
  if (!target) return;
  if (!fs.existsSync(target)) {
    problems.push(`${path.relative(root, fromFile)} -> ${ref}`);
  }
}

function extractSrcset(value) {
  return value
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

walk(root);

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (/\.html$/i.test(file)) {
    for (const match of text.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
      checkRef(file, match[1]);
    }
    for (const match of text.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
      for (const src of extractSrcset(match[1])) {
        checkRef(file, src);
      }
    }
  }
  if (/\.css$/i.test(file)) {
    for (const match of text.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      checkRef(file, match[2]);
    }
  }
}

if (problems.length > 0) {
  console.error('Missing local static references:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log(`Static validation passed: ${files.length} HTML/CSS files checked.`);
