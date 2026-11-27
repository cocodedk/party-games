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

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): no mock exists; a plain, large-type, system-font, high-contrast layout is the builder's call within the design's anti-goals.
- runner (2026-11-27): the design rules: the form always shows a room-code field, prefilled from `?room=` when present.
- runner (2026-11-27): join errors show as one plain line above the Join button and the form keeps what was typed; wording is the builder's, later passed through the customer-words skill.
- runner (2026-11-27): while connecting or waiting for `joined` the Join button reads as busy; an unreachable server or a dropped socket shows a short message with a "Join again" button that returns to the form.
- runner (2026-11-27): after `closed` the page shows "The game screen closed" (the design's "The screen left", reworded by the customer-words pass so it is not confused with the Left team) with the same "Join again" button.
- runner (2026-11-27): the pad shows the player's colour full-screen with their name and team small at the top and a one-line hint (drag to move, circle to turn) that fades on first touch.
- runner (2026-11-27): this spec adds no automated tests; the count stays at `ℹ tests 21` and the manual check is its acceptance, as the plan says.

