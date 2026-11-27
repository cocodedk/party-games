import { connect } from '../shared/net.js';
import { createLobby } from './lobby.js';
import { apply } from '../shared/dom.js';
import { styles } from './styles.js';
import { createBat, setTarget } from '../games/pong/bat.js';
import { createBall, stepWorld } from '../games/pong/physics.js';
import { frozen } from '../games/pong/bumps.js';
import { createMatch } from '../games/pong/match.js';
import { fit, draw } from '../games/pong/render.js';
import { createSound } from '../games/pong/sound.js';
import { registerScreenTools } from './tools.js';
import {
  MSG, NET_EVENT, WS_PATH, MS_PER_S, SCREEN_TEXT, TEAM, TEAMS, EVENT, PHASE, CHANGE, DRAW, MATCH_DT_MAX,
  SERVE_SPEED, SERVE_ANGLE_MAX, BUMP_BUZZ_MS, HUD, LINE_COLOR, TEAM_COLOR, SCORE_POP, SOUND_NAME,
  UNLOCK_EVENTS, EVENT_SOUND,
} from '../shared/constants.js';

const canvas = document.getElementById('field');
const status = document.getElementById('status');
const prompt = document.getElementById('sound');
const ctx = canvas.getContext('2d');
const lobby = createLobby();
const match = createMatch({ rng: Math.random });
const sound = createSound();
const popAt = { [TEAM.LEFT]: -Infinity, [TEAM.RIGHT]: -Infinity }; // performance.now() of each team's last goal
let seen = match.view(); // the view sync last saw, for the fanfares and score pop
const world = { ball: null, bats: new Map(), now: 0 }; // bats: player id → bat
let ball = null; // the ball in play; world.ball holds it only while playing
let view = null;
let last = 0;
let frame = 0;
let sent = ''; // the last state sent, as JSON
let laidOut = ''; // the lobby band's visibility and rules last shown, as JSON
let net = null;
let room = null; // the room code, once the server has made the room

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
  if (phase !== seen.phase && phase === PHASE.OVER) sound.play(SOUND_NAME.WIN);
  for (const team of TEAMS) {
    if (score[team] <= seen.score[team]) continue;
    popAt[team] = performance.now();
    if (phase === PHASE.GOAL) sound.play(SOUND_NAME.GOAL); // tied to the score, so a resumed goal hold stays quiet
  }
  seen = { phase, score };
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
  const { phase, score, timeLeft, winner, countdown } = match.view();
  if (phase === PHASE.LOBBY) return null;
  let label = null;
  if (phase === PHASE.COUNTDOWN) label = { text: String(countdown), size: HUD.COUNTDOWN_SIZE, color: LINE_COLOR };
  if (phase === PHASE.PAUSED) label = { text: SCREEN_TEXT.PAUSED, size: HUD.LABEL_SIZE, color: LINE_COLOR };
  if (phase === PHASE.OVER && winner === DRAW) label = { text: SCREEN_TEXT.DRAW, size: HUD.WINNER_SIZE, color: LINE_COLOR };
  else if (phase === PHASE.OVER) label = { text: SCREEN_TEXT.WINS(winner), size: HUD.WINNER_SIZE, color: TEAM_COLOR[winner] };
  const grow = {}; // each team's score pop, shrinking from SCORE_POP.GROW to 0
  for (const team of TEAMS) grow[team] = Math.max(0, 1 - (performance.now() - popAt[team]) / SCORE_POP.MS) * SCORE_POP.GROW;
  return { score, timeLeft, label, grow };
}

function tick(now) {
  const dt = Math.min((now - last) / MS_PER_S, MATCH_DT_MAX);
  last = now;
  if (dt > 0 && match.view().phase !== PHASE.PAUSED) {
    world.ball = match.view().phase === PHASE.PLAYING ? ball : null;
    const free = [...world.bats.keys()].filter((id) => !frozen(world.bats.get(id), world.now)); // already frozen: no new buzz
    const events = stepWorld(world, dt);
    for (const e of events) {
      if (EVENT_SOUND[e.type]) sound.play(EVENT_SOUND[e.type]);
      if (e.type === EVENT.BUMP) for (const id of e.ids) if (free.includes(id)) net.send(MSG.BUZZ, { id, ms: BUMP_BUZZ_MS });
    }
    for (const change of match.step(dt, events)) if (change.type === CHANGE.SERVE) serve(change.toward);
    sync();
  }
  draw(ctx, view, world.bats.values(), ball, hud(), world.now);
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
apply(prompt, styles.sound);
prompt.textContent = SCREEN_TEXT.SOUND;

function unlock() {
  sound.unlock();
  prompt.remove(); // gone for good
  for (const type of UNLOCK_EVENTS) window.removeEventListener(type, unlock);
}
for (const type of UNLOCK_EVENTS) window.addEventListener(type, unlock);

registerScreenTools(() => ({ room, view: match.view(), bats: [...world.bats.values()] }));

net = connect(WS_PATH);
net.on(NET_EVENT.OPEN, () => net.send(MSG.CREATE));
net.on(NET_EVENT.CLOSE, lost);
net.on(MSG.CREATED, (msg) => {
  room = msg.room;
  status.hidden = true;
  lobby.show(room, msg.base);
  apply(canvas, styles.field);
  canvas.hidden = false;
  window.addEventListener('resize', resize);
  sync();
  last = performance.now();
  frame = requestAnimationFrame(tick);
});
net.on(MSG.PLAYER, (player) => {
  world.bats.set(player.id, Object.assign(createBat(player), { name: player.name }));
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
