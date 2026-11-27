---
parent: "[[09-webmcp]]"
---

# 092-screen-tools

Part of `docs/lean/09-webmcp.md` (Task 7: WebMCP tools, llms.txt and end-to-end proof), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice, 091-webmcp-core.

## Goal

`/screen` declares its WebMCP tools. One screen; nothing a person sees changes. Read the `webmcp` skill and its `references/api.md` before writing.

**Files:** `web/screen/main.js` (174 lines now: the registration goes in a DOM-only glue file beside it), `web/shared/webmcp-constants.js`, `package.json` (coverage exclusion for the new glue file).

**Interfaces — Consumes:** `initTools(list)` and the pure input checks (091); the screen's own state (the room code, the players, `match.view()`). **Produces**, on `/screen` (tools return `{ok:false, error}` instead of throwing; silent without `document.modelContext`):
- `describe`: what is on the page.
- `get_state`: read-only: room, teams with names, score, phase, time left, and each player's bat position (`x`, `y`, `angle` with id and team).

## Acceptance

- [ ] Step 1: Implement the two tools; they answer from the screen's state at call time.
- [ ] Step 2: `npm test` → PASS, `ℹ tests 52` (no new tests: DOM glue, proved by the e2e of 095), coverage ≥ 90%; lint clean; every code file under 200 lines.

## Out of scope

The phone tools (093), the game-master tools (094), `llms.txt`, the e2e and the probe (095); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): `web/shared/constants.js` is near the 200-line limit, so this spec's WebMCP constants (tool names, descriptions, error texts, e2e and dist-scan values) go in one second constants module, `web/shared/webmcp-constants.js`, imported the same way; nothing else moves.
- runner (2026-11-27, the person delegated the call: "you run the show"): this spec's files also include `web/screen/main.js`, and the coverage exclusions in `package.json`'s `test` script for any new DOM glue file.
- runner (2026-11-27, the person delegated the call: "you run the show"): the proposed tool list is the one to build: `/screen` `describe`, `get_state`; phone `describe`, `join`, `move_bat`; master phone and `/host` `set_rules`, `start`, `pause`, `end`.
- runner (2026-11-27, the person delegated the call: "you run the show"): `get_state` also returns each player's bat position (`x`, `y`, `angle` with the player's id and team), so the e2e can assert the bat moved.
