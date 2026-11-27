import {
  ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, TEAMS, MAX_PER_TEAM, NAME_MAX, PLAYER_COLORS, JOIN_ERROR, MASTER_HOST, HOST_ID_PREFIX,
} from '../web/shared/constants.js';

function randomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** In-memory room state: code → { hosts: [host id], players: Map(id → {id, name, team, color}) }, both in join order. */
export function createRooms() {
  const rooms = new Map();
  let nextId = 1;

  function create() {
    let code;
    do code = randomCode(); while (rooms.has(code));
    rooms.set(code, { hosts: [], players: new Map() });
    return code;
  }

  function join(code, { name, team }) {
    const room = rooms.get(code);
    if (!room) return { ok: false, reason: JOIN_ERROR.NO_ROOM };
    if (!TEAMS.includes(team)) return { ok: false, reason: JOIN_ERROR.BAD_TEAM };
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (trimmed.length < 1 || trimmed.length > NAME_MAX) return { ok: false, reason: JOIN_ERROR.BAD_NAME };
    const players = [...room.players.values()];
    if (players.filter((p) => p.team === team).length >= MAX_PER_TEAM) {
      return { ok: false, reason: JOIN_ERROR.TEAM_FULL };
    }
    const used = new Set(players.map((p) => p.color));
    const color = PLAYER_COLORS.find((c) => !used.has(c));
    const id = String(nextId++);
    room.players.set(id, { id, name: trimmed, team, color });
    return { ok: true, id, color };
  }

  /** Adds a connected /host page; the most recent one still connected is game master. */
  function host(code) {
    const room = rooms.get(code);
    if (!room) return { ok: false, reason: JOIN_ERROR.NO_ROOM };
    const id = HOST_ID_PREFIX + nextId++;
    room.hosts.push(id);
    return { ok: true, id };
  }

  /** MASTER_HOST if a host is connected (the game master is then room.hosts.at(-1)), else the first phone in join order. */
  function master(code) {
    const room = rooms.get(code);
    if (!room) return undefined;
    return room.hosts.length ? MASTER_HOST : room.players.keys().next().value;
  }

  /** Removes a phone or a host by id. */
  function leave(code, id) {
    const room = rooms.get(code);
    if (!room) return;
    room.hosts = room.hosts.filter((h) => h !== id);
    room.players.delete(id);
  }

  function remove(code) {
    rooms.delete(code);
  }

  function get(code) {
    return rooms.get(code);
  }

  return { create, join, host, master, leave, remove, get };
}
