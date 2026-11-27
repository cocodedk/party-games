---
parent: "[[07-match]]"
---

# 075-host-page

Part of `docs/lean/07-match.md` (Task 5: match rules and game-master flow), split so each part fits one card. The whole design is `docs/superpowers/specs/2026-11-27-team-pong-design.md` and the full plan (global constraints, message protocol, file structure) is `docs/superpowers/plans/2026-11-27-team-pong.md`. Merged first: 01-rooms, 02-server, 03-pad-bat, 04-phone-page, 05-screen-lobby, 06-physics, 071-roles, 072-match-rules, 073-screen-match, 074-phone-controls.

## Goal

`/host?room=CODE`: the game-master controls without a pad, for the laptop. One screen. Design reference: the merged phone page (its room-code entry, messages and look) and the controls of 074.

**Files:** `web/host.html`, `web/host/main.js`, `web/host/styles.js` (StyleX), `vite.config.js` (add the host page to the inputs, in the same change as `web/host.html`: `npm test` builds first), the controls module of 074 (reused, not copied), `web/shared/constants.js`, `package.json` only if a new glue file needs a coverage exclusion.

**Interfaces — Consumes:** `host {room}` → `joined {isMaster:true}` or `error {reason}`, `role`, `state`, `closed` (071); the controls module (074).

Journey:
- **Start:** the laptop opens the link shown in the TV lobby (073).
- **No room in the URL, or a code no game uses:** the phone page's room-code entry, with its line "No game uses that room code. Check the code on the game screen." after a failed try.
- **Connecting:** "Connecting…".
- **Connected:** the same status line and controls as the master phone in every phase (settings and Start; Pause/Resume and End; Play again and Lobby), without a pad.
- **A second `/host` connects:** it takes over game master.
- **The screen closes / the socket drops:** the phone page's matching message ("The game screen closed" / "Lost the connection to the game…"), with the way back to the room-code entry that the phone page's lost state gives.

## Acceptance

- [ ] Step 1: Implement the journey above.
- [ ] Step 2: Manual check with `npm start`: `/host` alone shows the code entry; a wrong code shows the line; the right code shows the controls and the first phone loses its controls; closing the host page gives them back to the first phone; a full match can be run from the laptop; closing the screen shows the message.
- [ ] Step 3: `npm test` → PASS, `ℹ tests 47` (no new tests: DOM glue), coverage ≥ 90%; `dist/host.html` is built; lint clean; every code file under 200 lines.

## Out of scope

WebMCP tools and `llms.txt` (09); anything assigned to another spec in the plan.

## Decisions

- runner (2026-11-27): every constant this spec needs goes in `web/shared/constants.js` (the plan's single constants module), which is part of this spec's files even where the Files line does not list it.
- runner (2026-11-27): `/host` without a room, or with one no game uses, shows the phone page's room-code entry and its "No game uses that room code. Check the code on the game screen." line; it shows "Connecting…" while it connects; a second `/host` takes over game master (the design's handover); when the screen closes or the socket drops it shows the phone page's matching message ("The game screen closed" / "Lost the connection to the game…").
- runner (2026-11-27): only the master phone (and `/host`) shows controls: settings and Start in the lobby, Pause/Resume and End in countdown, playing, goal and paused, Play again and Lobby when over.
- person (2026-11-27): "yes" — End goes to `over` with the current score; the leading team wins, and a tie shows "Draw"; Play again and Lobby work from there as after a normal finish.
- runner (2026-11-27, the person delegated the call: "you run the show"): Resume is refused (the control is disabled) while a team is empty, matching Start; a team emptying pauses the match in `countdown`, `playing` or `goal`, not in `lobby` or `over`.
- runner (2026-11-27): the game-master controls on the phone, the `/host` page and the TV during a match all follow the merged phone page's look (black background, white system-font type, player colours); large type on the TV.
- runner (2026-11-27): to keep files under 200 lines the builder may add DOM-only glue files beside the listed ones (e.g. `web/phone/controls.js`) and add each to the coverage exclusions in `package.json` like the existing DOM files; game logic stays in tested modules.
- runner (2026-11-27): new on-screen text goes through the customer-words pass before the PR.
- runner (2026-11-27, the person delegated the call: "you run the show"): after a second `/host` takes over, the first `/host` page keeps its status line and shows "Waiting for the game master" with no controls.
