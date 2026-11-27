import { MSG, MESSAGE_MAX_BYTES } from '../web/shared/constants.js';

function send(ws, type, payload = {}) {
  ws.send(JSON.stringify({ type, ...payload }));
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

/** Routes messages between one screen and its phones per room; base is the join URL's origin. Returns the ws 'connection' handler. */
export function createRelay(rooms, base) {
  const sockets = new Map(); // code → { screen, phones: Map(id → ws) }

  const handlers = {
    [MSG.CREATE](ws, me) {
      if (me.code) return;
      me.code = rooms.create();
      me.isScreen = true;
      sockets.set(me.code, { screen: ws, phones: new Map() });
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
      send(ws, MSG.JOINED, { id: me.id, color: result.color });
      send(room.screen, MSG.PLAYER, rooms.get(me.code).players.get(me.id));
    },
    [MSG.INPUT](ws, me, msg) {
      const room = me.id && sockets.get(me.code);
      if (room) send(room.screen, MSG.INPUT, { id: me.id, x: msg.x, y: msg.y, a: msg.a });
    },
    [MSG.BUZZ](ws, me, msg) {
      const phone = me.isScreen && sockets.get(me.code).phones.get(msg.id);
      if (phone) send(phone, MSG.BUZZ, { id: msg.id, ms: msg.ms });
    },
  };

  function close(me) {
    const room = sockets.get(me.code);
    if (!room) return;
    if (me.isScreen) {
      for (const phone of room.phones.values()) send(phone, MSG.CLOSED);
      sockets.delete(me.code);
      rooms.remove(me.code);
    } else {
      room.phones.delete(me.id);
      rooms.leave(me.code, me.id);
      send(room.screen, MSG.LEFT, { id: me.id });
    }
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
