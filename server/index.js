import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { WebSocketServer } from 'ws';
import { createRooms } from './rooms.js';
import { createRelay } from './relay.js';
import { baseUrl } from './lan.js';
import { qrSvg } from './qr.js';
import {
  DEFAULT_PORT, PORT_ENV, LOCALHOST, QR_PATH, SITE_ROOT, PAGES, CONTENT_TYPES, CONTENT_TYPE_BINARY, HTTP_STATUS,
} from '../web/shared/constants.js';

/** The file under root a request path names, or null when it is malformed or escapes root. */
function resolveFile(root, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(PAGES[pathname] ?? pathname);
  } catch {
    return null;
  }
  const file = path.join(root, rel);
  return file.startsWith(root + path.sep) ? file : null;
}

async function readSite(root, pathname) {
  const file = resolveFile(root, pathname);
  if (!file) throw new Error('outside root');
  return { body: await readFile(file), type: CONTENT_TYPES[path.extname(file)] ?? CONTENT_TYPE_BINARY };
}

/** HTTP pages, the room QR code and the WebSocket relay on one port. */
export function startServer({ port = DEFAULT_PORT, root = SITE_ROOT } = {}) {
  const dir = path.resolve(root);
  let base;
  const server = http.createServer(async (req, res) => {
    try {
      const { pathname, searchParams } = new URL(req.url, base);
      const { body, type } = pathname === QR_PATH
        ? { body: await qrSvg(base, searchParams.get('room') ?? ''), type: CONTENT_TYPES['.svg'] }
        : await readSite(dir, pathname);
      res.writeHead(HTTP_STATUS.OK, { 'content-type': type }).end(body);
    } catch {
      res.writeHead(HTTP_STATUS.NOT_FOUND).end();
    }
  });
  const wss = new WebSocketServer({ server });

  return new Promise((resolve) => server.listen(port, () => {
    const actual = server.address().port;
    base = baseUrl(process.env, os.networkInterfaces(), actual);
    wss.on('connection', createRelay(createRooms(), base));
    resolve({
      url: `http://${LOCALHOST}:${actual}`,
      base,
      close() {
        for (const client of wss.clients) client.terminate();
        wss.close();
        server.closeAllConnections();
        return new Promise((done) => server.close(done));
      },
    });
  }));
}

if (import.meta.main) {
  const { base } = await startServer({ port: Number(process.env[PORT_ENV]) || DEFAULT_PORT });
  console.log(`Screen: ${base}/screen`);
}
