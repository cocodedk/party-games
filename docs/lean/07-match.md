# 07-match

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics are merged first.

## Task 5: Match rules and game-master flow

**Files:** `web/games/pong/match.js`, `web/host.html`, `web/host/main.js`, `web/host/styles.js` (StyleX), `vite.config.js`
(add the host page), `server/rooms.js`, `server/relay.js` (roles, `host`, `role`), wire into screen/phone main,
`tests/match.test.js`, `tests/rooms.test.js`, `tests/relay.test.js`.

**Interfaces — Produces:** roles in `server/rooms.js`: `rooms.host(code) → {ok}`, `rooms.master(code) → id|'host'` (host if connected, else first phone in join order; recomputed on every leave), server sends `role {isMaster}` on change; `createMatch({rng}) → { settings(mode, value), start(teamCounts), pause(), resume(), end(),
again(), toLobby(), step(dt, events) → changes[], view() → {phase, score, timeLeft, settings, canStart} }`; phases
`'lobby'|'countdown'|'playing'|'goal'|'paused'|'over'`; defaults `mode:'score', value:5`; time mode in minutes 1–10,
score mode 1–20.

- [ ] Step 1: Failing tests: first phone is master; master leaving passes the role to the next in join order; host joining makes host master and the phone not; host leaving returns the role to the first phone; start refused with an empty team; countdown 3 s → playing; goal → score+1, phase `goal`
  1.5 s, serve toward the team that conceded; score mode ends at target; time mode ends at 0; tie at time-out → next
  goal wins; pause freezes the clock; a 5 s dt is clamped (clock drops ≤ 0.1 s); team empties while playing → paused;
  first serve direction from injected rng; `again` keeps teams and resets score.
- [ ] Step 2: Implement; screen sends `state` on change; master phone shows settings (mode toggle, value −/+ ),
  Start, during play small Pause/End buttons at the pad edge (Pause becomes Resume, also after an automatic pause),
  and on the winner screen Play again / Lobby; `/host?room=CODE` shows the same controls without a
  pad; `buzz` → `navigator.vibrate` if present.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 47`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): `stepWorld` (spec 06) already steps the bats and skips frozen ones, so wiring physics into the screen removes the separate `stepBat` call in `web/screen/main.js`; `stepWorld` keeps its clock in `world.now` (ms), and after a goal the ball stays put until this spec re-serves it.
- runner (2026-11-27): `stepWorld(world, dt)` takes `bats` as an array or a Map and adds `world.now` (ms, default 0) as the clock for `frozenUntil`; after a goal the ball stays outside the field and the next `stepWorld` emits `goal` again, so the match stops stepping physics outside `playing` and re-serves a new ball with `createBall()`.
- person (2026-11-27): "it is okay" — a free bat that hits a frozen teammate freezes only itself, as spec 06 built it.
- runner (2026-11-27): the game-master controls on the phone, the `/host` page and the TV during a match all follow the merged phone page's look (black background, white system-font type, player colours); large type on the TV.
- runner (2026-11-27): `/host` without a room, or with one no game uses, shows the phone page's room-code entry and its "No game uses that room code. Check the code on the game screen." line; it shows "Connecting…" while it connects; a second `/host` takes over game master (the design's handover); when the screen closes or the socket drops it shows the phone page's matching message ("The game screen closed" / "Lost the connection to the game…"). The TV lobby shows the `/host?room=CODE` link in small type under the join URL, labelled for the laptop.
- runner (2026-11-27): every phone keeps its pad in every phase; a status line over the pad says the phase (countdown number, score, "Paused", the winner). Only the master phone (and `/host`) shows controls: settings and Start in the lobby, Pause/Resume and End in countdown, playing, goal and paused, Play again and Lobby when over. Others see "Waiting for the game master" in the lobby and when over.
- runner (2026-11-27): this spec draws on the TV the ball, the score, the clock (time mode) and a "Paused" label, hides the lobby band (QR, code, team lists) once the match starts and brings it back in the lobby phase, and shows the current settings in the lobby; spec 08 adds only the juice listed there (score pop, bump flash, 3-2-1, winner styling).
- person (2026-11-27): "yes" — End goes to `over` with the current score; the leading team wins, and a tie shows "Draw"; Play again and Lobby work from there as after a normal finish.
- runner (2026-11-27, the person delegated the call: "you run the show"): Resume is refused (the control is disabled) while a team is empty, matching Start; a team emptying pauses the match in `countdown`, `playing` or `goal`, not in `lobby` or `over`.
- runner (2026-11-27): this spec's files include `web/games/pong/render.js`, `web/screen/lobby.js`, `web/screen/main.js`, `web/phone/main.js`, `web/phone/styles.js`, `web/shared/net.js`, `web/index.html`, `web/screen.html` and `package.json`; to keep files under 200 lines the builder may add DOM-only glue files beside them (e.g. `web/phone/controls.js`) and add each to the coverage exclusions in `package.json` like the existing DOM files; game logic stays in tested modules.
- runner (2026-11-27): new on-screen text goes through the customer-words pass before the PR.
