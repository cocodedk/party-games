---
parent: "[[09-webmcp]]"
---

# 091-webmcp-core

Part of `docs/lean/09-webmcp.md` (Task 7: WebMCP tools, llms.txt and end-to-end proof), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 07-match, 08-juice.

## Goal

The shared WebMCP module and the pure input checks the page tools use. One layer (`web/shared/`); no page changes: nothing imports it until 092, 093 and 094. Read the `webmcp` skill and its `references/api.md` before writing.

**Files:** `web/shared/webmcp.js`, `web/shared/webmcp-constants.js` (new), `tests/webmcp.test.js`, `web/shared/constants.js` only if a constant must live there.

**Interfaces — Consumes:** `document.modelContext` (`registerTool`, per the skill's `references/api.md`). **Produces:**
- `initTools(list)`: registers each tool of `list`; silent without `document.modelContext` (no throw, no error, nothing visible); one refused `registerTool` does not stop the rest.
- The pure input checks the tools of 092, 093 and 094 call: bad input gives `{ok:false, error}` instead of a throw, and an out-of-range `move_bat {x, y, angle}` is clamped. They live in tested modules (not in a `main.js`), so the tests below cover them.
- `web/shared/webmcp-constants.js`: the tool names, descriptions and error texts, extended by the later pieces.

Builder's latitude: the exact shape and names of the pure checks, as long as 093's `move_bat` and the tools' bad-input answers go through them.

## Acceptance

- [ ] Step 1: Four failing tests, one `test()` each, in `tests/webmcp.test.js`:
  1. no registry → no throw;
  2. one refused `registerTool` doesn't stop the rest;
  3. bad input → `{ok:false}`;
  4. out-of-range `move_bat` clamped.
- [ ] Step 2: Implement.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 52` (48 + 4), coverage ≥ 90%; the lint command of `profile-party-games.md` is clean; every code file under 200 lines.

## Out of scope

Registering any tool on a page (092 screen, 093 phone, 094 game master); `llms.txt`, the `dist/` scan, the e2e and the probe (095); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27, the person delegated the call: "you run the show"): `web/shared/constants.js` is near the 200-line limit, so this spec's WebMCP constants (tool names, descriptions, error texts, e2e and dist-scan values) go in one second constants module, `web/shared/webmcp-constants.js`, imported the same way; nothing else moves.
- runner (2026-11-27, the person delegated the call: "you run the show"): the proposed tool list is the one to build: `/screen` `describe`, `get_state`; phone `describe`, `join`, `move_bat`; master phone and `/host` `set_rules`, `start`, `pause`, `end`.
