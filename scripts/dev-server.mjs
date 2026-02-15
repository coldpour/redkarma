import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import net from 'node:net';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const HOST = '127.0.0.1';
const DEFAULT_PORT = 8890;
const MAX_PORT = 65535;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
};

const sseClients = new Set();
let reloadTimer = null;

function parsePreferredPort() {
  const parsed = Number(process.env.PORT);
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_PORT) {
    return parsed;
  }

  return DEFAULT_PORT;
}

function isPortAvailable(port, host) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();
    tester.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });
    tester.once('listening', () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, host);
  });
}

async function findAvailablePort(startPort, host) {
  for (let port = startPort; port <= MAX_PORT; port += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }

  throw new Error(`No available ports found from ${startPort} to ${MAX_PORT}`);
}

function openBrowser(url) {
  let command;
  let args;

  if (process.platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (process.platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.once('error', (error) => {
    console.warn(`Could not open browser automatically: ${error.message}`);
  });
  child.unref();
}

function shouldIgnorePath(relativePath) {
  return (
    relativePath.startsWith('.git/') ||
    relativePath.startsWith('node_modules/') ||
    relativePath.startsWith('.worktrees/')
  );
}

function injectLiveReload(html) {
  const snippet = `
<script>
(() => {
  const source = new EventSource('/__live_reload');
  source.onmessage = (event) => {
    if (event.data === 'reload') {
      window.location.reload();
    }
  };
})();
</script>`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${snippet}\n</body>`);
  }

  return `${html}${snippet}`;
}

function sendReload() {
  for (const client of sseClients) {
    client.write('data: reload\n\n');
  }
}

function queueReload() {
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }

  reloadTimer = setTimeout(() => {
    sendReload();
    reloadTimer = null;
  }, 75);
}

function createWatcher() {
  fs.watch(ROOT, { recursive: true }, (eventType, filename) => {
    if (!filename) {
      return;
    }

    const relativePath = filename.split(path.sep).join('/');
    if (shouldIgnorePath(relativePath)) {
      return;
    }

    if (eventType === 'change' || eventType === 'rename') {
      queueReload();
    }
  });
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  const requestPath = req.url.split('?')[0];

  if (requestPath === '/__live_reload') {
    res.writeHead(200, {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });
    res.write(': connected\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.resolve(ROOT, `.${normalizedPath}`);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', contentType);

    if (ext === '.html') {
      const html = injectLiveReload(buffer.toString('utf8'));
      res.end(html);
      return;
    }

    res.end(buffer);
  });
});

createWatcher();

async function startServer() {
  const preferredPort = parsePreferredPort();
  const port = await findAvailablePort(preferredPort, HOST);
  const url = `http://${HOST}:${port}`;

  server.listen(port, HOST, () => {
    if (port !== preferredPort) {
      console.log(`Preferred port ${preferredPort} is unavailable, using ${port}`);
    }
    console.log(`Dev server running at ${url}`);
    openBrowser(url);
  });
}

startServer().catch((error) => {
  if (error.code === 'EACCES' || error.code === 'EPERM') {
    console.error(`Unable to bind local ports on ${HOST}. Try running outside restricted sandbox or set PORT.`);
    process.exit(1);
  }

  console.error(error.message);
  process.exit(1);
});
