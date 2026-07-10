/* ============================================================
   LIMINAL — tiny local server (no dependencies)
   Start via START.bat (double-click) or:  node server.js
   Needed because fetch()/GLB loading does not work over file://
============================================================ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const PORT = 8123;
const URL = `http://localhost:${PORT}/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aiff': 'audio/aiff',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found: ' + urlPath); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store', // always serve fresh files after edits
    });
    res.end(data);
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Server laeuft bereits — oeffne Browser...');
    if (!process.argv.includes('--no-open')) exec(`start "" "${URL}"`);
  } else {
    throw e;
  }
});

server.listen(PORT, () => {
  console.log(`LIMINAL laeuft auf ${URL}  (Fenster offen lassen, Ctrl+C zum Beenden)`);
  if (!process.argv.includes('--no-open')) exec(`start "" "${URL}"`);
});
