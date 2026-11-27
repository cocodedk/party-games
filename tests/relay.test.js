import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import QRCode from 'qrcode';
import { startServer } from '../server/index.js';
import { MSG, MESSAGE_MAX_BYTES, TEAM, JOIN_ERROR, QR_PATH } from '../web/shared/constants.js';

const ROOT = fileURLToPath(new URL('fixtures/site', import.meta.url));

async function serve(t) {
  const server = await startServer({ port: 0, root: ROOT });
  t.after(() => server.close());
  return server;
}

/** An open ws client whose messages queue up until next() takes them, in order. */
async function connect(url) {
  const ws = new WebSocket(url.replace('http', 'ws'));
  const queue = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    const waiter = waiters.shift();
    if (waiter) waiter(msg);
    else queue.push(msg);
  });
  await new Promise((resolve) => ws.once('open', resolve));
  return {
    ws,
    send: (type, payload = {}) => ws.send(JSON.stringify({ type, ...payload })),
    next: () => (queue.length ? Promise.resolve(queue.shift()) : new Promise((r) => waiters.push(r))),
  };
}

async function join(url, room, name, team = TEAM.LEFT) {
  const phone = await connect(url);
  phone.send(MSG.JOIN, { room, name, team });
  return { phone, joined: await phone.next() };
}

/** A server with a screen that created a room and has seen one phone join. */
async function roomWithPhone(t) {
  const { url } = await serve(t);
  const screen = await connect(url);
  screen.send(MSG.CREATE);
  const { room } = await screen.next();
  const { phone, joined } = await join(url, room, 'Ann');
  const player = await screen.next();
  return { url, screen, room, phone, joined, player };
}

function rawStatus(url, path) {
  const { hostname, port } = new URL(url);
  return new Promise((resolve, reject) => {
    http.get({ hostname, port, path }, (res) => {
      res.resume();
      resolve(res.statusCode);
    }).on('error', reject);
  });
}

test('screen create gets created; a phone join reaches the screen as player, and leaving as left', async (t) => {
  const { url, screen, room, phone, joined, player } = await roomWithPhone(t);
  assert.match(room, /^[A-Z]{4}$/);
  assert.equal(joined.type, MSG.JOINED);
  assert.deepEqual(player, { type: MSG.PLAYER, id: joined.id, name: 'Ann', team: TEAM.LEFT, color: joined.color });
  const bad = await join(url, 'NOPE', 'Bo');
  assert.deepEqual(bad.joined, { type: MSG.ERROR, reason: JOIN_ERROR.NO_ROOM });
  phone.ws.close();
  assert.deepEqual(await screen.next(), { type: MSG.LEFT, id: joined.id });
});

test('phone input reaches the screen with the phone id; screen input and a second create or join are ignored', async (t) => {
  const { screen, room, phone, joined } = await roomWithPhone(t);
  screen.send(MSG.CREATE);
  screen.send(MSG.INPUT, { id: joined.id, x: 1, y: 1, a: 0 });
  screen.send(MSG.BUZZ, { id: joined.id, ms: 10 });
  assert.deepEqual(await phone.next(), { type: MSG.BUZZ, id: joined.id, ms: 10 });
  phone.send(MSG.JOIN, { room, name: 'Ann', team: TEAM.RIGHT });
  phone.send(MSG.INPUT, { id: 'someone-else', x: 0.5, y: 0.25, a: 1 });
  assert.deepEqual(await screen.next(), { type: MSG.INPUT, id: joined.id, x: 0.5, y: 0.25, a: 1 });
  screen.send(MSG.BUZZ, { id: joined.id, ms: 20 });
  assert.deepEqual(await phone.next(), { type: MSG.BUZZ, id: joined.id, ms: 20 });
});

test('screen buzz reaches only the phone it names; a phone buzz is dropped', async (t) => {
  const { url, screen, room, phone, joined } = await roomWithPhone(t);
  const other = await join(url, room, 'Bo', TEAM.RIGHT);
  await screen.next();
  phone.send(MSG.BUZZ, { id: other.joined.id, ms: 50 });
  phone.send(MSG.INPUT, { x: 0, y: 0, a: 0 });
  assert.equal((await screen.next()).type, MSG.INPUT);
  screen.send(MSG.BUZZ, { id: joined.id, ms: 50 });
  assert.deepEqual(await phone.next(), { type: MSG.BUZZ, id: joined.id, ms: 50 });
  screen.ws.close();
  assert.deepEqual(await other.phone.next(), { type: MSG.CLOSED });
});

test('when the screen closes its phones get closed and the room is gone', async (t) => {
  const { url, screen, room, phone } = await roomWithPhone(t);
  screen.ws.close();
  assert.deepEqual(await phone.next(), { type: MSG.CLOSED });
  phone.send(MSG.INPUT, { x: 0, y: 0, a: 0 });
  const late = await join(url, room, 'Cy');
  assert.deepEqual(late.joined, { type: MSG.ERROR, reason: JOIN_ERROR.NO_ROOM });
});

test('oversized and non-JSON messages are dropped and the socket stays open', async (t) => {
  const { url } = await serve(t);
  const client = await connect(url);
  client.ws.send(JSON.stringify({ type: MSG.CREATE, pad: 'x'.repeat(MESSAGE_MAX_BYTES) }));
  client.ws.send('not json');
  client.ws.send('null');
  client.send('constructor');
  const rogue = await connect(url);
  rogue.ws._socket.write(Buffer.from([0x81, 0x01, 0x41])); // unmasked frame: a protocol error
  client.send(MSG.JOIN, { room: 'NOPE', name: 'Ann', team: TEAM.LEFT });
  assert.deepEqual(await client.next(), { type: MSG.ERROR, reason: JOIN_ERROR.NO_ROOM });
  assert.equal(client.ws.readyState, WebSocket.OPEN);
});

test('serves the pages, llms.txt and the room QR code, and refuses paths outside the root', async (t) => {
  const { url, base } = await serve(t);
  for (const [path, text] of [['/', 'phone page'], ['/screen', 'screen page'], ['/host', 'host page'], ['/llms.txt', 'fixture']]) {
    const res = await fetch(url + path);
    assert.equal(res.status, 200, path);
    assert.match(await res.text(), new RegExp(text), path);
  }
  const qr = await fetch(`${url}${QR_PATH}?room=ABCD`);
  assert.equal(qr.headers.get('content-type'), 'image/svg+xml');
  assert.equal(await qr.text(), await QRCode.toString(`${base}/?room=ABCD`, { type: 'svg' }));
  for (const path of [
    '/%2e%2e/package.json', '/..%2f..%2f..%2fpackage.json', '/%zz', '/missing.html', '//',
    `${QR_PATH}?room=${'x'.repeat(4000)}`,
  ]) {
    assert.equal(await rawStatus(url, path), 404, path);
  }
});
