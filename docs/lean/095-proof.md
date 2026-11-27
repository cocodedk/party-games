---
parent: "[[09-webmcp]]"
---

# 095-proof

Part of `docs/lean/09-webmcp.md` (Task 7: WebMCP tools, llms.txt and end-to-end proof), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice, 091-webmcp-core, 092-screen-tools, 093-phone-tools, 094-master-tools.

## Goal

`llms.txt`, the offline check and the end-to-end proof of the tools in a real Chrome. One layer (documentation and tests); no page changes. Read the `webmcp` skill and its `references/api.md` before writing.

**Files:** `web/public/llms.txt`, `e2e/play.e2e.js`, a unit test for the `dist/` scan (in `tests/`), `web/shared/webmcp-constants.js` (e2e and dist-scan values), `package.json` (dev dep `playwright`; script `e2e` = `node --test 'e2e/**/*.e2e.js'`; the e2e stays out of `npm test` because it needs Chrome and is slow).

**Interfaces — Consumes:** `startServer({port})`; the tools of 092 (`describe`, `get_state`), 093 (`describe`, `join`, `move_bat`) and 094 (`set_rules`, `start`, `pause`, `end`); `scripts/probe.py` of the `webmcp` skill.

## Acceptance

- [ ] Step 1: `web/public/llms.txt`: pages and tools, one line each.
- [ ] Step 2: A unit test scans `dist/` for `http://` / `https://` URLs other than the server's own and fails on any.
- [ ] Step 3: e2e (Playwright, `channel:'chrome'`, WebMCP flag per the skill): start server, open `/screen` and two phone pages, drive `join` (one per team), `set_rules`, `start`, `move_bat` via the tools only; assert `get_state` shows phase `playing` and the bat moved; assert the phone pad's computed `touch-action` is `none`; screenshot screen. A tool `getTools()` doesn't list is reported not-proved.
- [ ] Step 4: The e2e also routes every request whose host is not the local server to an abort and asserts none was attempted.
- [ ] Step 5: Run `scripts/probe.py` from the skill with and without WebMCP.
- [ ] Step 6: `npm test` → PASS, `ℹ tests 53` (52 + the `dist/` scan), coverage ≥ 90%; `npm run e2e` PASS; lint clean; every code file under 200 lines.

## Out of scope

Changing any tool (091 to 094); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): `web/shared/constants.js` is near the 200-line limit, so this spec's WebMCP constants (tool names, descriptions, error texts, e2e and dist-scan values) go in one second constants module, `web/shared/webmcp-constants.js`, imported the same way; nothing else moves.
- runner (2026-11-27, the person delegated the call: "you run the show"): the proposed tool list is the one to build: `/screen` `describe`, `get_state`; phone `describe`, `join`, `move_bat`; master phone and `/host` `set_rules`, `start`, `pause`, `end`.
- runner (2026-11-27, the person delegated the call: "you run the show"): `get_state` also returns each player's bat position (`x`, `y`, `angle` with the player's id and team), so the e2e can assert the bat moved.
