---
parent: "[[09-webmcp]]"
---

# 093-phone-tools

Part of `docs/lean/09-webmcp.md` (Task 7: WebMCP tools, llms.txt and end-to-end proof), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice, 091-webmcp-core, 092-screen-tools.

## Goal

The phone page (`/`) declares its WebMCP tools. One screen; nothing a person sees changes. Read the `webmcp` skill and its `references/api.md` before writing.

**Files:** `web/phone/main.js` (171 lines now: the registration goes in a DOM-only glue file beside it), `web/shared/webmcp-constants.js`, `package.json` (coverage exclusion for the new glue file).

**Interfaces — Consumes:** `initTools(list)` and the pure input checks, the `move_bat` clamp included (091); the phone page's own join and pose-sending code. **Produces**, on the phone page (tools return `{ok:false, error}` instead of throwing; silent without `document.modelContext`):
- `describe`: what is on the page.
- `join {room, name, team}`.
- `move_bat {x, y, angle}`: same code path as the pad; an out-of-range value is clamped by the check of 091.

## Acceptance

- [ ] Step 1: Implement the three tools.
- [ ] Step 2: `npm test` → PASS, `ℹ tests 52` (no new tests: DOM glue, proved by the e2e of 095), coverage ≥ 90%; lint clean; every code file under 200 lines.

## Out of scope

The game-master tools on the master phone and `/host` (094); `llms.txt`, the e2e and the probe (095); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): `web/shared/constants.js` is near the 200-line limit, so this spec's WebMCP constants (tool names, descriptions, error texts, e2e and dist-scan values) go in one second constants module, `web/shared/webmcp-constants.js`, imported the same way; nothing else moves.
- runner (2026-11-27, the person delegated the call: "you run the show"): this spec's files also include `web/phone/main.js` (the tools share the pad's code paths), and the coverage exclusions in `package.json`'s `test` script for any new DOM glue file.
- runner (2026-11-27, the person delegated the call: "you run the show"): the proposed tool list is the one to build: `/screen` `describe`, `get_state`; phone `describe`, `join`, `move_bat`; master phone and `/host` `set_rules`, `start`, `pause`, `end`.
