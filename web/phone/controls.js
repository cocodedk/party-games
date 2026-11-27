// The phase line and the game-master controls over a pad (the phone, and /host in 075): DOM only, no pad in here.
import { apply } from '../shared/dom.js';
import { styles } from './styles.js';
import { MSG, PHASE, MATCH_MODE, MATCH_RANGE, RULES_TEXT, MODE_TEXT, TEAM, PHONE_TEXT, SCREEN_TEXT } from '../shared/constants.js';

const ACTIVE = [PHASE.COUNTDOWN, PHASE.PLAYING, PHASE.GOAL, PHASE.PAUSED];

function make(tag, looks, ...kids) {
  const node = document.createElement(tag);
  apply(node, ...looks);
  for (const kid of kids) node.appendChild(kid);
  return node;
}

function winnerText({ left, right }) {
  if (left === right) return SCREEN_TEXT.DRAW;
  return SCREEN_TEXT.WINS(left > right ? TEAM.LEFT : TEAM.RIGHT);
}

function statusText({ phase, score }) {
  if (phase === PHASE.LOBBY) return '';
  if (phase === PHASE.COUNTDOWN) return PHONE_TEXT.GET_READY;
  if (phase === PHASE.PAUSED) return SCREEN_TEXT.PAUSED;
  if (phase === PHASE.OVER) return winnerText(score);
  return PHONE_TEXT.SCORE(score[TEAM.LEFT], score[TEAM.RIGHT]);
}

/** Adds the phase line and controls to root; send(type, payload) sends a game-master command. */
export function createControls(root, send) {
  let state = null; // the last state, or null before the first
  let master = false;

  const button = (text, looks, onClick) => {
    const b = make('button', [styles.control, ...looks]);
    b.type = 'button';
    b.textContent = text;
    // pointerup, not click: a second finger's tap while the first steers on the pad fires no click
    b.addEventListener('pointerup', (event) => {
      const r = b.getBoundingClientRect();
      const over = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
      if (over && !b.disabled) onClick();
    });
    b.addEventListener('click', (event) => event.detail === 0 && onClick()); // Enter or Space; a pointer press acted on pointerup
    b.addEventListener('pointerdown', (event) => event.stopPropagation()); // a tap on a control does not move the bat
    return b;
  };
  const settings = (mode, value) => {
    const { min, max } = MATCH_RANGE[mode];
    send(MSG.SETTINGS, { mode, value: Math.min(max, Math.max(min, value)) });
  };
  const step = (by) => () => settings(state.settings.mode, state.settings.value + by);

  const status = make('p', [styles.status]);
  const modes = Object.values(MATCH_MODE).map((mode) => {
    const b = button(MODE_TEXT[mode], [], () => settings(mode, state.settings.value));
    b.dataset.mode = mode;
    return b;
  });
  const rules = make('p', [styles.text]);
  const minus = button(PHONE_TEXT.LESS, [], step(-1));
  const plus = button(PHONE_TEXT.MORE, [], step(1));
  const start = button(PHONE_TEXT.START, [styles.wide], () => send(MSG.START));
  const pause = button(PHONE_TEXT.PAUSE, [styles.small], () => send(state.phase === PHASE.PAUSED ? MSG.RESUME : MSG.PAUSE));
  const again = button(PHONE_TEXT.AGAIN, [styles.wide], () => send(MSG.AGAIN));
  const end = button(PHONE_TEXT.END, [styles.small], () => send(MSG.END));
  const boxes = {
    lobby: make('div', [], make('div', [styles.row], ...modes, minus, plus), rules, make('div', [styles.row], start)),
    match: make('div', [styles.row], pause, end),
    over: make('div', [styles.row], again, button(PHONE_TEXT.LOBBY, [styles.wide], () => send(MSG.LOBBY))),
    wait: make('p', [styles.text]),
  };
  boxes.wait.textContent = PHONE_TEXT.WAITING;
  const panel = make('div', [styles.panel], ...Object.values(boxes));
  root.appendChild(status);
  root.appendChild(panel);

  const enable = (b, on) => {
    b.disabled = !on;
    apply(b, styles.control, (b === start || b === again) && styles.wide, (b === pause || b === end) && styles.small, !on && styles.off);
  };

  function render() {
    const phase = state && state.phase;
    status.textContent = state ? statusText(state) : '';
    const shown = {
      lobby: master && phase === PHASE.LOBBY,
      match: master && ACTIVE.includes(phase),
      over: master && phase === PHASE.OVER,
      wait: !master && (phase === PHASE.LOBBY || phase === PHASE.OVER),
    };
    for (const key in boxes) boxes[key].style.display = shown[key] ? '' : 'none'; // a flex class would beat hidden
    if (!state) return;
    const { mode, value } = state.settings;
    const { min, max } = MATCH_RANGE[mode];
    for (const b of modes) apply(b, styles.control, b.dataset.mode === mode && styles.on);
    rules.textContent = RULES_TEXT[mode](value);
    enable(minus, value > min);
    enable(plus, value < max);
    enable(start, state.canStart);
    enable(again, state.canStart);
    pause.textContent = phase === PHASE.PAUSED ? PHONE_TEXT.RESUME : PHONE_TEXT.PAUSE;
    enable(pause, phase !== PHASE.PAUSED || state.canStart);
  }

  render();
  return {
    /** The latest state from the screen (null: none yet). */
    update(next) {
      state = next;
      render();
    },
    /** Whether this page is the game master. */
    role(isMaster) {
      master = isMaster;
      render();
    },
  };
}
