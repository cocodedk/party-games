# 09-webmcp

Goal, behaviour and acceptance tests are below; the whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Earlier specs 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice are merged first.

## Task 7: WebMCP tools, llms.txt and end-to-end proof

**Files:** `web/shared/webmcp.js`, registrations in each page's main, `web/public/llms.txt`, `tests/webmcp.test.js`,
`e2e/play.e2e.js`, `package.json` (dev dep `playwright`; script `e2e` = `node --test 'e2e/**/*.e2e.js'`; the e2e stays out of
`npm test` because it needs Chrome and is slow). Read the `webmcp` skill and its `references/api.md` before writing.

Tools (proposed; returns `{ok:false, error}` instead of throwing; silent without `document.modelContext`):
- `/screen`: `describe` (what is on the page), `get_state` (read-only: room, teams with names, score, phase, time left).
- phone: `describe`, `join {room, name, team}`, `move_bat {x, y, angle}` (same code path as the pad).
- master phone and `/host`: `set_rules {mode, value}`, `start`, `pause`, `end` (registered only where the
  buttons are).

- [ ] Step 1: Unit tests: no registry → no throw; one refused `registerTool` doesn't stop the rest; bad input →
  `{ok:false}`; out-of-range `move_bat` clamped.
- [ ] Step 2: e2e (Playwright, `channel:'chrome'`, WebMCP flag per the skill): start server, open `/screen` and two
  phone pages, drive `join` (one per team), `set_rules`, `start`, `move_bat` via the tools only; assert
  `get_state` shows phase `playing` and the bat moved; assert the phone pad's computed `touch-action` is `none`; screenshot screen. A tool `getTools()` doesn't list is
  reported not-proved.
- [ ] Step 2b: e2e also routes every request whose host is not the local server to an abort and asserts none was
  attempted; a unit test scans `dist/` for `http://` / `https://` URLs other than the server's own and fails on any.
- [ ] Step 3: `web/public/llms.txt`: pages and tools, one line each. Run `scripts/probe.py` from the skill with and without WebMCP.
- [ ] Step 4: `npm test` → PASS, `ℹ tests 53`, coverage ≥ 90%; `npm run e2e` PASS.

## Out of scope

Anything assigned to another spec in the plan.

## Decisions

