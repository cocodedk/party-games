---
parent: "[[09-webmcp]]"
---

# 094-master-tools

Part of `docs/lean/09-webmcp.md` (Task 7: WebMCP tools, llms.txt and end-to-end proof), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice, 091-webmcp-core, 092-screen-tools, 093-phone-tools.

## Goal

The game-master controls declare their WebMCP tools, on the master phone and on `/host`. One module (the shared controls of 074, which both pages use); nothing a person sees changes. Read the `webmcp` skill and its `references/api.md` before writing.

**Files:** `web/phone/controls.js`, `web/phone/main.js` and `web/host/main.js` (also the `/host` `describe` tool) (only where the registration needs wiring), `web/shared/webmcp-constants.js`, `package.json` only if a new glue file needs a coverage exclusion.

**Interfaces — Consumes:** `initTools(list)` and the pure input checks (091); the controls' own button code paths (`settings {mode, value}`, `start`, `pause`, `end`). **Produces**, on the master phone and `/host` (tools return `{ok:false, error}` instead of throwing; silent without `document.modelContext`):
- `set_rules {mode, value}`, `start`, `pause`, `end`: registered only where the buttons are; each does what its button does, through the same code path.
- `/host` `describe`: what is on the page, registered whether or not this host is game master.

Builder's latitude: how a tool stops being offered when its buttons go (the role changes); the skill's `references/api.md` gives the mechanism (an `AbortSignal`, there is no `unregisterTool`).

## Acceptance

- [ ] Step 1: Implement the four tools.
- [ ] Step 2: `npm test` → PASS, `ℹ tests 52` (no new tests: DOM glue, proved by the e2e of 095), coverage ≥ 90%; lint clean; every code file under 200 lines.

## Out of scope

`llms.txt`, the `dist/` scan, the e2e and the probe (095); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): `web/shared/constants.js` is near the 200-line limit, so this spec's WebMCP constants (tool names, descriptions, error texts, e2e and dist-scan values) go in one second constants module, `web/shared/webmcp-constants.js`, imported the same way; nothing else moves.
- runner (2026-11-27, the person delegated the call: "you run the show"): this spec's files also include `web/phone/controls.js`, `web/phone/main.js` and `web/host/main.js` (the tools share the buttons' code paths), and the coverage exclusions in `package.json`'s `test` script for any new DOM glue file.
- runner (2026-11-27, the person delegated the call: "you run the show"): the proposed tool list is the one to build: `/screen` `describe`, `get_state`; phone `describe`, `join`, `move_bat`; master phone and `/host` `set_rules`, `start`, `pause`, `end`.
- runner (2026-11-27, the person delegated the call: "you run the show"): `/host` also gets a `describe` tool (every page declares one), registered whether or not it is game master.
