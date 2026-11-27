// /host: the game-master controls for a laptop, without a pad.
import { createControls } from '../phone/controls.js';
import { connect } from '../shared/net.js';
import { apply } from '../shared/dom.js';
import { styles as phone } from '../phone/styles.js';
import { styles } from './styles.js';
import { registerHostTools } from './tools.js';
import { MSG, NET_EVENT, ROOM_PARAM, WS_PATH, ROOM_CODE_LENGTH, PHONE_TEXT } from '../shared/constants.js';

const byId = (id) => document.getElementById(id);
const el = {
  form: byId('form'), title: byId('title'), roomLabel: byId('roomLabel'), room: byId('room'), error: byId('error'),
  join: byId('join'), lost: byId('lost'), lostText: byId('lostText'), again: byId('again'),
  controls: byId('controls'), who: byId('who'),
};
let net = null; // the live connection, or null
const controls = createControls(el.controls, (type, payload) => net && net.send(type, payload), true);

function show(view) {
  for (const node of [el.form, el.lost, el.controls]) node.hidden = node !== view;
}

function setBusy(busy) {
  el.join.disabled = busy;
  el.join.textContent = busy ? PHONE_TEXT.CONNECTING : PHONE_TEXT.CONNECT;
  apply(el.join, phone.button, busy && phone.busy);
}

function hangUp() {
  if (net) net.close();
  net = null;
  setBusy(false);
  controls.role(false); // no game-master tools without a connection
}

function fail(text) {
  hangUp();
  el.error.textContent = text;
  show(el.form);
}

function lost(text) {
  hangUp();
  el.lostText.textContent = text;
  show(el.lost);
}

function start() {
  hangUp();
  el.error.textContent = '';
  setBusy(true);
  show(el.form);
  const room = el.room.value.trim().toUpperCase();
  const conn = connect(WS_PATH);
  net = conn;
  conn.on(NET_EVENT.OPEN, () => conn.send(MSG.HOST, { room }));
  conn.on(MSG.JOINED, (m) => {
    setBusy(false);
    el.who.textContent = PHONE_TEXT.ROOM(room);
    controls.update(null);
    controls.role(m.isMaster);
    show(el.controls);
  });
  conn.on(MSG.ROLE, (m) => controls.role(m.isMaster));
  conn.on(MSG.STATE, (m) => controls.update(m));
  conn.on(MSG.ERROR, (m) => fail(PHONE_TEXT.ERROR[m.reason]));
  conn.on(MSG.CLOSED, () => lost(PHONE_TEXT.SCREEN_LEFT));
  conn.on(NET_EVENT.CLOSE, () => lost(PHONE_TEXT.DROPPED));
}

el.form.addEventListener('submit', (event) => {
  event.preventDefault();
  start();
});
el.again.addEventListener('click', () => {
  el.error.textContent = '';
  show(el.form);
});

apply(document.documentElement, phone.root);
apply(document.body, phone.body);
apply(el.form, phone.form);
apply(el.title, phone.title);
apply(el.roomLabel, phone.label);
apply(el.room, phone.input, phone.code);
apply(el.error, phone.error);
apply(el.lost, phone.lost);
apply(el.again, phone.button);
apply(el.controls, styles.controls);
apply(el.who, phone.who);
registerHostTools(controls.tools);
setBusy(false);
el.room.maxLength = ROOM_CODE_LENGTH;
el.room.value = new URLSearchParams(location.search).get(ROOM_PARAM) || '';
if (el.room.value) start();
