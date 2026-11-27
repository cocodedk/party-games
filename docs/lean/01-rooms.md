# 01-rooms

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs (none) are merged first.

## Task 1: Room logic

**Files:** Create `web/shared/constants.js`, `server/rooms.js`, `tests/rooms.test.js` (`package.json`, `.gitignore` and the
test script already exist).

**Interfaces — Produces:**
- `createRooms() → { create(): code, join(code, {name, team}) → {ok, id, color} | {ok:false, reason}, leave(code, id), remove(code), get(code) }`
- reasons: `'no-room' | 'team-full' | 'bad-name' | 'bad-team'`; names trimmed, 1–16 chars.

- [ ] Step 1: Write failing tests: code is 4 chars from the alphabet and unique across 200 creates; bad team → `bad-team`;
  fifth player on a team → `team-full`; unknown code → `no-room`; empty / 17-char name → `bad-name`.
- [ ] Step 2: Run `npm test` → FAIL; implement; → PASS, `ℹ tests 6`.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

