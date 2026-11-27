# Team Pong — design

Date: 2026-11-27. First game of a collection of light party games played on a TV browser and
controlled from phone browsers.

## Intent

A party game night: one big screen shows the game, everyone in the room joins from their own phone's
browser (no app install), picks a team and controls their own bat. It must run smoothly on a weak TV
browser and feel instant. Team Pong is the first game; the code is laid out so more games can follow.

## Goals

- Phones join by scanning a QR code or typing a room code shown on the screen.
- Two teams, Left and Right, 1–4 players each; every player controls one bat.
- Free bat control: the bat moves anywhere in its team's own half and rotates.
- Teammate bats that collide bounce apart, flash and freeze for 1 second; their phones vibrate.
- A goal plays a short fanfare and updates the score; the match ends by time or by score, as the
  game master chose.

## Non-goals (for now)

- Other games, a game picker, accounts, saved scores, spectators, AI players.
- Deploying to the internet (the design must not block it; see Rooms).
- Reconnecting a dropped phone to its old bat (it simply joins again).

## Anti-goals (a failure even if it works)

- CPU-hungry visuals (shadows, blur, particles, filters, large textures) that stutter on a TV.
- Noticeable lag between finger and bat.
- Any install step for players, or any third-party resource (CDN, Google Fonts).

## Decided with the user

- Runs from a Node server the user starts on a laptop on the home Wi-Fi; later possibly on the internet.
- The screen is a web page (`/screen`): shown either from the laptop over HDMI or opened in the TV's
  own browser.
- Room codes from the start (e.g. `KBQX`), so several parties could share one internet server later.
- Game master: the game can be set up from the laptop (`/host`), or else the first phone to join is
  game master.
- Bat control: the finger's position on the phone maps to the bat's position anywhere in the team's
  own half; circling the finger rotates the bat, which keeps its angle when the finger stops.
- Bats stay within their team's own half.
- Colliding teammates bounce apart and freeze for 1 second.
- All teammates share the whole half, so bumps are frequent and part of the fun (no lanes).
- The game ends by time or by score; the game master decides which, and the value.

## Approaches

- **A. The screen runs the game (picked).** The `/screen` page does physics, drawing and sound; the
  server only relays phone input to the screen and screen events to phones. Fewest parts, no
  lag between game and sound, one ball and 8 bats is trivial work.
- B. The server runs the game and streams state ~30×/s; the screen only draws. Choppier without
  interpolation, more code.
- C. Peer-to-peer WebRTC. Rejected: complex and unreliable on TV browsers.

## Design

### Stack (builder's call, stated)

Node 24, plain ES modules, no build step. Server dependencies: `ws` and `qrcode` (QR rendered as
SVG on the server). Browser code is vanilla JS. System fonts only. Code files stay under 200 lines;
meaningful numbers (limits, timings, speeds, message types) live in a constants module.

### Pages

- `/screen` — creates a room, shows the lobby (QR, room code, join URL, team lists, current
  settings) and then the match.
- `/` (phone) — enter room code (prefilled from the QR link) and a name, pick Left or Right, then
  the touch pad. The game master's phone also shows settings and Start / Pause / End.
- `/host?room=CODE` — the game-master controls without a bat, for the laptop. If a host page is
  connected it is game master; otherwise the first phone; if the game master leaves, the next
  player in join order takes over.

### Rooms and messages

The server keeps rooms in memory: code → screen socket, host socket, players (id, name, team).
Codes are 4 letters without look-alikes (no I/O). The server routes JSON messages: phone input →
screen; screen events (role, vibrate, game state) → phones. When the screen disconnects the room
closes and phones show "The screen left". Player input is sent at most 60×/s and only when it
changes.

### Field and physics (on the screen)

- 16:9 field in logical units, drawn to one canvas, scaled to the window, device-pixel ratio capped
  at 1–1.5 for cheap rendering. Fixed physics step (60 Hz), draw on requestAnimationFrame.
- Top and bottom edges bounce the ball; the ball leaving the left or right edge is a goal for the
  other team.
- A bat is a line segment with thickness, centre (x, y) and angle. Its target pose comes from the
  phone; the bat eases toward it (fast enough to feel direct, smooth over network jitter). Its
  velocity is tracked.
- Ball hits a bat: reflect about the bat's surface normal, add part of the bat's velocity (a swing
  hits harder), small speed-up per hit, clamped to a max speed.
- Teammate bats overlapping: push apart, both flash and freeze for 1 s (ignore input), screen tells
  both phones to vibrate (`navigator.vibrate`; silently skipped where unsupported, e.g. iOS).
- Opposing bats never meet (separate halves).

### Phone control

- The whole phone screen is a touch pad, mapped to the team's half as the player sees it on the TV
  (pad left = field left, pad top = field top).
- Rotation: the bat's angle changes by the signed turning of the finger's movement direction, so a
  straight drag moves without rotating and a circle spins the bat the same way round.
- Lifting the finger leaves the bat where it is.
- Each player gets a colour shown on their phone and on their bat.

### Match flow

Lobby → game master picks mode (Time: minutes, or Score: points to win) and value, presses Start →
countdown 3-2-1 → serve from the centre toward a random side → after each goal: fanfare, score
pop, serve toward the team that conceded after ~1.5 s → end when time runs out or a team reaches
the target → winner screen with fanfare → game master can play again (same teams) or return to
the lobby. Time mode ending on a tie: next goal wins. Players may join mid-match; they appear on
their team at once. Pause freezes everything.

### Sound

Generated with WebAudio on the screen (bleeps for hits and walls, a short arpeggio fanfare for goals,
a longer one for the win). No audio files. Browsers require one user gesture before audio: the
screen shows a "Click to start sound" prompt once.

### Agent tools and `/llms.txt`

Each page registers WebMCP tools (`document.modelContext.registerTool`): a `describe` tool on every
page, plus on `/screen` a read-only `get_state` (room code, teams, score, phase, time left). The
server serves `/llms.txt` listing those pages and tools.

### Tests

`node:test`: the pure modules (physics, collision, rotation from finger path, room/role logic,
match rules) unit-tested; one end-to-end test that starts the server, opens `/screen` and two phone
pages in Playwright, joins both and checks a bat moves. Coverage floor 90%.

## Calls made during the builder check (not yet confirmed by the user)

- **Join URL:** the server finds the laptop's LAN IPv4 address, prints it at startup and puts it in
  the QR code; plain HTTP on the LAN. A `PUBLIC_URL` setting overrides it for internet use later.
- **Old TV browsers:** browser code targets about Chrome 69 (Tizen/webOS era): no syntax or APIs newer
  than that, no CSS nesting, and no module-only features beyond basic `<script type="module">`.
- **Sound unlock:** any click, tap or remote key press on the screen unlocks sound. Without one the
  game plays silently.
- **Screen refresh:** if the screen page is refreshed the room is lost and everyone joins again
  (accepted for a party game).
- **Pad mapping:** the same for both teams (pad left = field left). A touch moves the bat straight to
  the finger, since the mapping is absolute. The pad is stretched to the half's shape.
- **Bat clamp:** the whole bat, rotated, stays inside its half. A frozen bat is still solid to the
  ball. Physics uses substeps so a fast ball cannot pass through a thin bat.
- **Start rule:** Start needs at least one player on each team. Uneven teams (1 vs 4) are allowed. A
  player who leaves mid-match has their bat removed. If a team empties mid-match, the match pauses.
- **Game master handover:** a `/host` page that connects takes over game master. When it leaves,
  the role goes to the first phone in join order. On a game-master phone, Pause and End are small
  buttons at the edge of the pad, so the player keeps playing.
- **Input rate:** phones send input up to 60×/s on change (cheap on a LAN).

## Left to the builder

File layout (keep a `games/pong/` seam for future games), exact speeds, sizes, colours and
easing constants, message names, visual style within the anti-goals.
