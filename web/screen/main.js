import { connect } from '../shared/net.js';
import { createLobby } from './lobby.js';
import { apply } from '../shared/dom.js';
import { styles } from './styles.js';
import { createBat, setTarget } from '../games/pong/bat.js';
import { createBall, stepWorld } from '../games/pong/physics.js';
import { frozen } from '../games/pong/bumps.js';
import { createMatch } from '../games/pong/match.js';
import { fit, draw } from '../games/pong/render.js';
import {
  MSG, NET_EVENT, WS_PATH, MS_PER_S, SCREEN_TEXT, TEAM, TEAMS, EVENT, PHASE, CHANGE, DRAW, MATCH_DT_MAX,
  SERVE_SPEED, SERVE_ANGLE_MAX, BUMP_BUZZ_MS,
} from '../shared/constants.js';

const canvas = document.getElementById('field');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const lobby = createLobby();
const match = createMatch({ rng: Math.random });
const world = { ball: null, bats: new Map(), now: 0 }; // bats: player id → bat
let ball = null; // the ball in play; world.ball holds it only while playing
let view = null;
let last = 0;
let frame = 0;
let sent = ''; // the last state sent, as JSON
let laidOut = ''; // the lobby band's visibility and rules last shown, as JSON
let net = null;

function resize() {
  view = fit(canvas);
}

function serve(toward) {
  const angle = (Math.random() * 2 - 1) * SERVE_ANGLE_MAX;
  const dir = toward === TEAM.LEFT ? -1 : 1;
  ball = Object.assign(createBall(), { vx: dir * SERVE_SPEED * Math.cos(angle), vy: SERVE_SPEED * Math.sin(angle) });
}

/** Lays the page out for the phase and sends the phones the state when it changed. */
function sync() {
  const { phase, score, timeLeft, settings, canStart } = match.view();
  const layout = JSON.stringify([phase === PHASE.LOBBY, settings]);
  if (layout !== laidOut) {
    laidOut = layout;
    lobby.update(phase === PHASE.LOBBY, settings);
    resize(); // the field grows or shrinks with the band
  }
  if (phase !== PHASE.PLAYING && phase !== PHASE.PAUSED) ball = null; // a scored ball waits off the field until the next serve
  const state = JSON.stringify({ phase, score, timeLeft: timeLeft === null ? null : Math.ceil(timeLeft), settings, canStart });
  if (state === sent) return;
  sent = state;
  net.send(MSG.STATE, JSON.parse(state));
}

function hud() {
  const { phase, score, timeLeft, winner } = match.view();
  if (phase === PHASE.LOBBY) return null;
  let label = null;
  if (phase === PHASE.PAUSED) label = SCREEN_TEXT.PAUSED;
  if (phase === PHASE.OVER) label = winner === DRAW ? SCREEN_TEXT.DRAW : SCREEN_TEXT.WINS(winner);
  return { score, timeLeft, label };
}

function tick(now) {
  const dt = Math.min((now - last) / MS_PER_S, MATCH_DT_MAX);
  last = now;
  if (dt > 0 && match.view().phase !== PHASE.PAUSED) {
    world.ball = match.view().phase === PHASE.PLAYING ? ball : null;
    const free = [...world.bats.keys()].filter((id) => !frozen(world.bats.get(id), world.now)); // already frozen: no new buzz
    const events = stepWorld(world, dt);
    for (const e of events) {
      if (e.type === EVENT.BUMP) for (const id of e.ids) if (free.includes(id)) net.send(MSG.BUZZ, { id, ms: BUMP_BUZZ_MS });
    }
    for (const change of match.step(dt, events)) if (change.type === CHANGE.SERVE) serve(change.toward);
    sync();
  }
  draw(ctx, view, world.bats.values(), ball, hud());
  frame = requestAnimationFrame(tick);
}

function teams() {
  const counts = {};
  for (const t of TEAMS) counts[t] = 0;
  for (const bat of world.bats.values()) counts[bat.team] += 1;
  match.teams(counts);
  sync();
}

function lost() {
  cancelAnimationFrame(frame);
  window.removeEventListener('resize', resize);
  lobby.destroy();
  canvas.remove();
  world.bats.clear();
  status.textContent = SCREEN_TEXT.LOST;
  status.hidden = false;
}

apply(document.documentElement, styles.root);
apply(document.body, styles.body);
apply(status, styles.status);
status.textContent = SCREEN_TEXT.STARTING;

net = connect(WS_PATH);
net.on(NET_EVENT.OPEN, () => net.send(MSG.CREATE));
net.on(NET_EVENT.CLOSE, lost);
net.on(MSG.CREATED, ({ room, base }) => {
  status.hidden = true;
  lobby.show(room, base);
  apply(canvas, styles.field);
  canvas.hidden = false;
  window.addEventListener('resize', resize);
  sync();
  last = performance.now();
  frame = requestAnimationFrame(tick);
});
net.on(MSG.PLAYER, (player) => {
  world.bats.set(player.id, createBat(player));
  lobby.add(player);
  teams();
});
net.on(MSG.LEFT, ({ id }) => {
  world.bats.delete(id);
  lobby.remove(id);
  teams();
});
net.on(MSG.INPUT, ({ id, x, y, a }) => {
  const bat = world.bats.get(id);
  if (bat) setTarget(bat, { x, y, a });
});
// Game-master commands (the server relays them only from the game master).
const COMMANDS = {
  [MSG.SETTINGS]: ({ mode, value }) => match.settings(mode, value),
  [MSG.START]: () => match.start(),
  [MSG.PAUSE]: () => match.pause(),
  [MSG.RESUME]: () => match.resume(),
  [MSG.END]: () => match.end(),
  [MSG.AGAIN]: () => match.again(),
  [MSG.LOBBY]: () => match.toLobby(),
};
for (const [type, run] of Object.entries(COMMANDS)) {
  net.on(type, (msg) => {
    run(msg);
    sync();
  });
}
