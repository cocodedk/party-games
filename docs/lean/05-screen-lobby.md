# 05-screen-lobby

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat, 04-phone-page are merged first.

## Task 3c: Screen page — lobby and bats (feel slice)

Goal: the user tries the control on a real phone before physics exists.

**Files:** `web/screen.html`, `web/screen/main.js`, `web/screen/lobby.js`, `web/screen/styles.js`, `web/games/pong/render.js`, `vite.config.js` (add the screen page).

**Interfaces — Consumes:** `connect`, bat API, `/qr.svg`.

- [ ] Step 1: Screen sends `create`; lobby shows QR, code, join URL, team lists; draws field and bats on rAF, DPR ≤ 1.5.
- [ ] Step 2: Manual: `npm start`, open the screen, join from a phone, circle the
  finger. **Stop and let the user try it.**

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

