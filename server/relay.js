import { MSG, MESSAGE_MAX_BYTES, MASTER_COMMANDS, MASTER_HOST } from '../web/shared/constants.js';

function send(ws, type, payload = {}) {
  ws?.send(JSON.stringify({ type, ...payload }));
}

/** A JSON object of at most MESSAGE_MAX_BYTES, else null (the message is dropped). */
function parse(data) {
  if (data.length > MESSAGE_MAX_BYTES) return null;
  try {
    const msg = JSON.parse(data);
    return msg && typeof msg === 'object' && !Array.isArray(msg) ? msg : null;
  } catch {
    return null;
  }
}

/** Routes messages between one screen, its phones and /host pages per room; base is the join URL's origin. Returns the ws 'connection' handler. */
export function createRelay(rooms, base) {
  // code → { screen, phones: Map(id → ws), hosts: Map(host id → ws), state: last state }; the order lives in rooms
  const sockets = new Map();

  function masterSocket(code, room) {
    const id = rooms.master(code);
    return id === MASTER_HOST ? room.hosts.get(rooms.get(code).hosts.at(-1)) : room.phones.get(id);
  }

  function sendState(room, ws) {
    if (room.state) send(ws, MSG.STATE, room.state);
  }

  const handlers = {
    [MSG.CREATE](ws, me) {
      if (me.code) return;
      me.code = rooms.create();
      me.isScreen = true;
      sockets.set(me.code, { screen: ws, phones: new Map(), hosts: new Map(), state: null });
      send(ws, MSG.CREATED, { room: me.code, base });
    },
    [MSG.JOIN](ws, me, msg) {
      if (me.code) return;
      const result = rooms.join(msg.room, msg);
      if (!result.ok) return send(ws, MSG.ERROR, { reason: result.reason });
      me.code = msg.room;
      me.id = result.id;
      const room = sockets.get(me.code);
      room.phones.set(me.id, ws);
      send(ws, MSG.JOINED, { id: me.id, color: result.color, isMaster: rooms.master(me.code) === me.id });
      sendState(room, ws);
      send(room.screen, MSG.PLAYER, rooms.get(me.code).players.get(me.id));
    },
    [MSG.HOST](ws, me, msg) {
      if (me.code) return;
      const room = sockets.get(msg.room);
      const replaced = room && masterSocket(msg.room, room);
      const result = rooms.host(msg.room);
      if (!result.ok) return send(ws, MSG.ERROR, { reason: result.reason });
      me.code = msg.room;
      me.id = result.id;
      me.isHost = true;
      send(replaced, MSG.ROLE, { isMaster: false });
      room.hosts.set(me.id, ws);
      send(ws, MSG.JOINED, { isMaster: true });
      sendState(room, ws);
    },
    [MSG.INPUT](ws, me, msg) {
      const room = me.id && !me.isHost && sockets.get(me.code);
      if (room) send(room.screen, MSG.INPUT, { id: me.id, x: msg.x, y: msg.y, a: msg.a });
    },
    [MSG.BUZZ](ws, me, msg) {
      const phone = me.isScreen && sockets.get(me.code).phones.get(msg.id);
      if (phone) send(phone, MSG.BUZZ, { id: msg.id, ms: msg.ms });
    },
    [MSG.STATE](ws, me, msg) {
      if (!me.isScreen) return;
      const room = sockets.get(me.code);
      room.state = { phase: msg.phase, score: msg.score, timeLeft: msg.timeLeft, settings: msg.settings, canStart: msg.canStart };
      for (const peer of [...room.phones.values(), ...room.hosts.values()]) sendState(room, peer);
    },
  };
  for (const type of MASTER_COMMANDS) {
    handlers[type] = (ws, me, msg) => {
      const room = sockets.get(me.code);
      if (!room || masterSocket(me.code, room) !== ws) return;
      send(room.screen, type, type === MSG.SETTINGS ? { mode: msg.mode, value: msg.value } : {});
    };
  }

  function close(me) {
    const room = sockets.get(me.code);
    if (!room) return;
    if (me.isScreen) {
      for (const peer of [...room.phones.values(), ...room.hosts.values()]) send(peer, MSG.CLOSED);
      sockets.delete(me.code);
      rooms.remove(me.code);
      return;
    }
    const before = masterSocket(me.code, room);
    (me.isHost ? room.hosts : room.phones).delete(me.id);
    rooms.leave(me.code, me.id);
    if (!me.isHost) send(room.screen, MSG.LEFT, { id: me.id });
    const after = masterSocket(me.code, room);
    if (after !== before) send(after, MSG.ROLE, { isMaster: true });
  }

  return function connection(ws) {
    const me = {};
    ws.on('error', () => {}); // a bad frame closes the socket; 'close' cleans up
    ws.on('message', (data) => {
      const msg = parse(data);
      if (msg && Object.hasOwn(handlers, msg.type)) handlers[msg.type](ws, me, msg);
    });
    ws.on('close', () => close(me));
  };
}
