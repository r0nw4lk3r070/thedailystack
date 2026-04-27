// build.js — Ron Spoelstra site builder
// Reads partials and injects them into all HTML pages between marker comments.
// Usage: node build.js
// Markers in HTML:
//   <!-- PARTIAL:nav-nl -->...<!-- /PARTIAL:nav-nl -->
//   <!-- PARTIAL:nav-en -->...<!-- /PARTIAL:nav-en -->
//   <!-- PARTIAL:nav-home -->...<!-- /PARTIAL:nav-home -->
//   <!-- PARTIAL:footer-nl -->...<!-- /PARTIAL:footer-nl -->
//   <!-- PARTIAL:footer-en -->...<!-- /PARTIAL:footer-en -->

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = __dirname;
const PARTIALS_DIR = join(SITE_ROOT, 'partials');

// Load all partials into memory
const partials = {};
for (const file of readdirSync(PARTIALS_DIR)) {
  if (!file.endsWith('.html')) continue;
  const name = file.replace('.html', '');
  partials[name] = readFileSync(join(PARTIALS_DIR, file), 'utf8').trimEnd();
}
console.log(`Loaded partials: ${Object.keys(partials).join(', ')}`);

// Walk all HTML files recursively, skip partials folder
function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === 'partials') continue; // never process partials themselves
      walkHtml(fullPath, files);
    } else if (extname(entry) === '.html') {
      files.push(fullPath);
    }
  }
  return files;
}

const htmlFiles = walkHtml(SITE_ROOT);
let updated = 0;
let skipped = 0;

for (const filePath of htmlFiles) {
  let content = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  let changed = false;

  for (const [name, partial] of Object.entries(partials)) {
    const startMarker = `<!-- PARTIAL:${name} -->`;
    const endMarker   = `<!-- /PARTIAL:${name} -->`;
    const startIdx = content.indexOf(startMarker);
    if (startIdx === -1) continue;
    const endIdx = content.indexOf(endMarker);
    if (endIdx === -1) {
      console.warn(`  WARN: found start marker but no end marker for ${name} in ${filePath}`);
      continue;
    }
    const before = content.slice(0, startIdx + startMarker.length);
    const after  = content.slice(endIdx);
    const newContent = `${before}\n${partial}\n${after}`;
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  OK: ${filePath.replace(SITE_ROOT, '')}`);
    updated++;
  } else {
    skipped++;
  }
}

console.log('');
console.log(`Build done. Updated: ${updated}  |  Unchanged: ${skipped}`);
