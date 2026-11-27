---
parent: "[[07-match]]"
---

# 071-roles

Part of `docs/lean/07-match.md` (Task 5: match rules and game-master flow), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics.

## Goal

The server knows who the game master of a room is and carries the game-master and match messages. Server layer only; no page changes.

**Files:** `server/rooms.js`, `server/relay.js`, `web/shared/constants.js` (new `MSG` types and the `'host'` master value), `tests/rooms.test.js`, `tests/relay.test.js`.

**Interfaces — Consumes:** `createRooms`, `createRelay`, `MSG`. **Produces:**
- `rooms.host(code) → {ok}` (`{ok:false}` with the existing no-room reason when no game uses the code); `rooms.master(code) → id|'host'`: the host if one is connected, else the first phone in join order; recomputed on every leave.
- Message `host {room}` (host → server); reply `joined {isMaster:true}`, or `error {reason}` for an unknown room. `join` replies `joined {id, color, isMaster}`.
- The server sends `role {isMaster}` to a phone or host whenever its role changes (a host joins or leaves, the master phone leaves).
- A second `host` for the same room takes over game master; the host it replaces is sent `role {isMaster:false}` and stays connected.
- `settings {mode, value}`, `start`, `pause`, `resume`, `end`, `again`, `lobby`: relayed to the room's screen only when sent by the current game master; from anyone else they are dropped.
- `state {phase, score, timeLeft, settings, canStart}`: relayed to every phone and host of the room only when sent by its screen; from anyone else it is dropped.
- When the screen closes, a connected host gets `closed` like the phones; when a host's socket closes, the role is recomputed.
- Existing limits hold for the new messages (1 KB, JSON objects only, unknown types dropped).

Builder's latitude: a phone or host that joins after the match started needs the current `state` for the later pieces (074, 075); how it gets it (for example the relay keeps the room's last `state` and sends it after `joined`) is settled here.

## Acceptance

- [ ] Step 1: Four failing tests, one `test()` each, in `tests/rooms.test.js` and/or `tests/relay.test.js` (the relay ones with real `ws` clients against `startServer({port:0})`, as the existing relay tests):
  1. the first phone is master;
  2. the master leaving passes the role to the next in join order;
  3. a host joining makes the host master and the phone not;
  4. the host leaving returns the role to the first phone.
  The relaying of a master command to the screen, the dropping of one from a non-master, the `state` fan-out and the second-host takeover have no test of their own: they are asserted inside these four, so the new handlers are covered.
- [ ] Step 2: Implement.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 36` (32 + 4), coverage ≥ 90%; the lint command of `profile-party-games.md` is clean.

## Out of scope

The match rules (072), every page (073 screen, 074 phone, 075 `/host`), and anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): a second `/host` takes over game master (the design's handover). (The page side of this decision is in 075.)
