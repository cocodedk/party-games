# 04-phone-page

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat are merged first.

## Task 3b: Phone page — join and pad

**Files:** `vite.config.js` (phone page only for now; later specs add theirs), `package.json` (add `vite`, `@stylexjs/stylex`, `@stylexjs/unplugin`; `build` = `vite build`; prefix `test` with
`vite build && `; `start` = `vite build && node server/index.js`), `web/shared/net.js`, `web/index.html` (phone), `web/phone/main.js`, `web/phone/styles.js`.

**Interfaces — Consumes:** `createPad`, `MSG`. **Produces:** `connect(path) → {send(type, payload), on(type, fn)}` (net.js).

- [ ] Step 1: Page: room from `?room=`, name, Left/Right buttons, then a full-screen pad in the player colour;
  `touch-action:none; overscroll-behavior:none`, viewport `user-scalable=no`; `input` throttled to 60/s, on change only.
- [ ] Step 2: Manual check against the running server: join shows the pad; a second join with a full team shows the
  reason.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

