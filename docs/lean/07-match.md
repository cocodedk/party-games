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

