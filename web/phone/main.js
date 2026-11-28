import { createPad } from './pad.js';
import { createControls } from './controls.js';
import { apply } from '../shared/dom.js';
import { connect } from '../shared/net.js';
import { styles } from './styles.js';
import { registerPhoneTools } from './tools.js';
import {
  MSG, NET_EVENT, JOIN_ERROR, ROOM_PARAM, WS_PATH, INPUT_PER_S, MS_PER_S, ROOM_CODE_LENGTH, NAME_MAX, PHONE_TEXT,
} from '../shared/constants.js';

const byId = (id) => document.getElementById(id);
const el = {
  form: byId('form'), title: byId('title'), roomLabel: byId('roomLabel'), nameLabel: byId('nameLabel'),
  room: byId('room'), name: byId('name'), teams: byId('teams'), error: byId('error'), join: byId('join'),
  lost: byId('lost'), lostText: byId('lostText'), again: byId('again'),
  pad: byId('pad'), who: byId('who'), hint: byId('hint'),
};
const teamButtons = Array.from(el.teams.querySelectorAll('button'));
const controls = createControls(el.pad, (type, payload) => net && net.send(type, payload));

let team = null;
let net = null; // the live connection, or null
let timer = 0; // pending trailing input send
let sent = null; // last pose sent
let sentAt = -Infinity; // when it was sent (performance.now ms)
let pad = null;
let pose = null; // latest pad pose, sent by sendPose() if it changed
let pointer = null; // the one pointer that drives the pad

function show(view) {
  for (const node of [el.form, el.lost, el.pad]) node.hidden = node !== view;
}

function pickTeam(picked) {
  team = picked;
  for (const b of teamButtons) apply(b, styles.team, b.dataset.team === team && styles.teamOn);
}

function setBusy(busy) {
  el.join.disabled = busy;
  el.join.textContent = busy ? PHONE_TEXT.JOINING : PHONE_TEXT.JOIN;
  apply(el.join, styles.button, busy && styles.busy);
}

function hangUp() {
  if (net) net.close();
  net = null;
  clearTimeout(timer);
  timer = 0;
  pointer = null;
  pad = null; // move_bat waits for the next JOINED
  controls.role(false); // no game-master tools without a connection
}

function fail(text) {
  hangUp();
  el.error.textContent = text;
  setBusy(false);
  show(el.form);
}

function lost(text) {
  hangUp();
  setBusy(false);
  el.lostText.textContent = text;
  show(el.lost);
}

const samePose = (p, q) => q && p.x === q.x && p.y === q.y && p.a === q.a;

/** Sends the latest pose if it changed, at most INPUT_PER_S times a second; a later call is queued, never dropped. */
function sendPose() {
  if (timer || !net || !pose || samePose(pose, sent)) return;
  const wait = sentAt + MS_PER_S / INPUT_PER_S - performance.now();
  if (wait > 0) {
    timer = setTimeout(() => {
      timer = 0;
      sendPose();
    }, wait);
    return;
  }
  net.send(MSG.INPUT, pose);
  sent = pose;
  sentAt = performance.now();
}

function startPad(color) {
  setBusy(false);
  apply(el.pad, styles.pad, styles.padColor(color));
  apply(el.hint, styles.hint);
  const label = teamButtons.find((b) => b.dataset.team === team).textContent;
  el.who.textContent = `${el.name.value.trim()} · ${PHONE_TEXT.TEAM(label)}`;
  show(el.pad);
  pad = createPad();
  pose = null;
  sent = null;
  sentAt = -Infinity;
}

function join(event) {
  event.preventDefault();
  if (!team) return fail(PHONE_TEXT.ERROR[JOIN_ERROR.BAD_TEAM]);
  hangUp();
  el.error.textContent = '';
  setBusy(true);
  const msg = { room: el.room.value.trim().toUpperCase(), name: el.name.value, team };
  const conn = connect(WS_PATH);
  net = conn;
  conn.on(NET_EVENT.OPEN, () => conn.send(MSG.JOIN, msg));
  conn.on(MSG.JOINED, (m) => {
    startPad(m.color);
    controls.update(null);
    controls.role(m.isMaster);
  });
  conn.on(MSG.ROLE, (m) => controls.role(m.isMaster));
  conn.on(MSG.STATE, (m) => controls.update(m));
  conn.on(MSG.BUZZ, (m) => navigator.vibrate && navigator.vibrate(m.ms)); // absent on some browsers: no buzz
  conn.on(MSG.ERROR, (m) => fail(PHONE_TEXT.ERROR[m.reason]));
  conn.on(MSG.CLOSED, () => lost(PHONE_TEXT.SCREEN_LEFT));
  conn.on(NET_EVENT.CLOSE, () => lost(PHONE_TEXT.DROPPED));
}

function at(event) {
  const r = el.pad.getBoundingClientRect();
  return [event.clientX - r.left, event.clientY - r.top, r.width, r.height];
}

el.pad.addEventListener('pointerdown', (event) => {
  if (pointer !== null) return;
  pointer = event.pointerId;
  el.pad.setPointerCapture(pointer);
  apply(el.hint, styles.hint, styles.hintGone);
  pose = pad.down(...at(event), event.timeStamp);
  sendPose();
});
el.pad.addEventListener('pointermove', (event) => {
  if (event.pointerId !== pointer) return;
  pose = pad.move(...at(event));
  sendPose();
});
// A tap stands the bat upright and a double tap lays it flat; a cancelled touch is never a tap.
const lift = (cancelled) => (event) => {
  if (event.pointerId !== pointer) return;
  pointer = null;
  const a = pad.up(event.timeStamp, cancelled);
  if (a === null) return;
  pose = { ...pose, a };
  sendPose();
};
el.pad.addEventListener('pointerup', lift(false));
el.pad.addEventListener('pointercancel', lift(true));

el.form.addEventListener('submit', join);
registerPhoneTools({
  masterTools: controls.tools,
  join(msg) { // fills the form as a person would, then submits it
    el.room.value = msg.room;
    el.name.value = msg.name;
    pickTeam(msg.team);
    join(new Event('submit'));
  },
  move(next) { // the pad's path: the latest pose, sent by sendPose()
    if (!pad || !net) return false;
    pose = next;
    sendPose();
    return true;
  },
});
for (const b of teamButtons) b.addEventListener('click', () => pickTeam(b.dataset.team));
el.again.addEventListener('click', () => {
  el.error.textContent = '';
  show(el.form);
});

apply(document.documentElement, styles.root);
apply(document.body, styles.body);
apply(el.form, styles.form);
apply(el.title, styles.title);
apply(el.roomLabel, styles.label);
apply(el.nameLabel, styles.label);
apply(el.room, styles.input, styles.code);
apply(el.name, styles.input);
apply(el.teams, styles.teams);
apply(el.error, styles.error);
apply(el.lost, styles.lost);
apply(el.again, styles.button);
apply(el.who, styles.who);
pickTeam(null);
setBusy(false);
el.room.maxLength = ROOM_CODE_LENGTH;
el.name.maxLength = NAME_MAX;
el.room.value = new URLSearchParams(location.search).get(ROOM_PARAM) || '';
