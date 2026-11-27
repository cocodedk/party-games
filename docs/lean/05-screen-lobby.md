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

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): no mock exists; the lobby is a plain, large-type, system-font, high-contrast TV layout (QR and room code large enough to read from a sofa, team lists in each team's half), the builder's call within the design's anti-goals. Screen text goes through the customer-words pass before the PR.
- runner (2026-11-27): this spec adds no automated tests; the count stays at `ℹ tests 21` and the manual check is its acceptance, as the plan says.
- runner (2026-11-27): `web/screen.html` links `/assets/stylex.css` by hand, as `web/index.html` does (the StyleX plugin does not link it).
- runner (2026-11-27): `npm start` reads an optional `PORT` environment variable, defaulting to `DEFAULT_PORT`, because 8080 is already taken on the machine where the user will try it; `server/index.js` is part of this spec's files for that.
- runner (2026-11-27): the screen shows "Starting…" until `created` arrives, and "Lost the connection to the game server. Reload this page." (lobby and bats removed) when the server is unreachable or the socket drops.
- runner (2026-11-27): the lobby's join URL comes from the server: `created` gains `base`, so `server/relay.js` and `tests/relay.test.js` are part of this spec's files (assert it inside an existing test; the count stays 21).
- runner (2026-11-27): the merged phone page (black background, white system-font type, player colours) is the look the lobby follows.
- runner (2026-11-27): an empty team list shows the team name and "Scan the code to join"; each player's name appears in their colour and is removed when they leave.

