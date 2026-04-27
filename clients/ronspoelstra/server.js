// Local dev server for ron-site
// Usage: node server.js   (or: npm start)
// Then open: http://localhost:8080

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = 2026;

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.js':    'text/javascript; charset=utf-8',
  '.json':  'application/json',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.png':   'image/png',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  let pathname = req.url.split('?')[0];

  // Redirect bare directory to trailing slash
  if (!pathname.endsWith('/') && !extname(pathname)) {
    try {
      const s = await stat(join(ROOT, pathname));
      if (s.isDirectory()) {
        res.writeHead(301, { Location: pathname + '/' });
        res.end();
        return;
      }
    } catch { /* not a directory, fall through */ }
  }

  if (pathname.endsWith('/')) pathname += 'index.html';

  const filePath = join(ROOT, pathname);

  // Prevent path traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 — pagina niet gevonden</h1>');
  }
});

server.listen(PORT, () => {
  console.log(`\n  Ron Spoelstra — lokale preview`);
  console.log(`  ────────────────────────────────`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`\n  Ctrl+C om te stoppen\n`);
});
