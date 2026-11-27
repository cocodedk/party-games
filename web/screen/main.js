import { connect } from '../shared/net.js';
import { createLobby, apply } from './lobby.js';
import { styles } from './styles.js';
import { createBat, setTarget, stepBat } from '../games/pong/bat.js';
import { fit, draw } from '../games/pong/render.js';
import { MSG, NET_EVENT, WS_PATH, MS_PER_S, SCREEN_TEXT } from '../shared/constants.js';

const canvas = document.getElementById('field');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const lobby = createLobby();
const bats = new Map(); // player id → bat
let view = null;
let last = 0;
let frame = 0;

function resize() {
  view = fit(canvas);
}

function tick(now) {
  const dt = (now - last) / MS_PER_S;
  last = now;
  if (dt > 0) for (const bat of bats.values()) stepBat(bat, dt);
  draw(ctx, view, bats.values());
  frame = requestAnimationFrame(tick);
}

function lost() {
  cancelAnimationFrame(frame);
  window.removeEventListener('resize', resize);
  lobby.destroy();
  canvas.remove();
  bats.clear();
  status.textContent = SCREEN_TEXT.LOST;
  status.hidden = false;
}

apply(document.documentElement, styles.root);
apply(document.body, styles.body);
apply(status, styles.status);
status.textContent = SCREEN_TEXT.STARTING;

const net = connect(WS_PATH);
net.on(NET_EVENT.OPEN, () => net.send(MSG.CREATE));
net.on(NET_EVENT.CLOSE, lost);
net.on(MSG.CREATED, ({ room, base }) => {
  status.hidden = true;
  lobby.show(room, base);
  apply(canvas, styles.field);
  canvas.hidden = false;
  resize();
  window.addEventListener('resize', resize);
  last = performance.now();
  frame = requestAnimationFrame(tick);
});
net.on(MSG.PLAYER, (player) => {
  bats.set(player.id, createBat(player));
  lobby.add(player);
});
net.on(MSG.LEFT, ({ id }) => {
  bats.delete(id);
  lobby.remove(id);
});
net.on(MSG.INPUT, ({ id, x, y, a }) => {
  const bat = bats.get(id);
  if (bat) setTarget(bat, { x, y, a });
});
