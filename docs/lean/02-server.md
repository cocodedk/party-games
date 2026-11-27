# 02-server

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms are merged first.

## Task 2: Server and relay

**Files:** `server/index.js`, `server/relay.js`, `server/lan.js`, `server/qr.js`, `tests/relay.test.js`, `tests/lan.test.js`,
`tests/fixtures/site/` (tiny `index.html`, `screen.html`, `host.html` for the static-file tests), `package.json` (add `ws`, `qrcode`).

**Interfaces — Consumes:** `createRooms`, `MSG`. **Produces:** `startServer({port}) → Promise<{url, close()}>`;
`baseUrl(env, interfaces) → string` (PUBLIC_URL wins, else first non-internal IPv4, else localhost); GET `/qr.svg?room=CODE`
→ SVG of `<base>/?room=CODE`; `startServer({port, root = 'dist'})` serves `/` (phone page), `/screen`, `/host`, `/llms.txt` and static files
from `root` (no path traversal); tests pass a fixture root.

- [ ] Step 1: Failing tests with real `ws` clients against `startServer({port:0})`: screen `create` → `created`;
  phone `join` → screen gets `player`; phone `input` reaches screen; screen `buzz {id}` reaches only that phone;
  screen closes → phones get `closed`; message > 1 KB and non-JSON are dropped and the socket stays open;
  raw request `GET /%2e%2e/package.json` → 404; `baseUrl` cases (PUBLIC_URL, LAN IP, none).
- [ ] Step 2: Implement; `npm start` prints `Screen: <base>/screen`.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 15`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

