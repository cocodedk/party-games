import {
  ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, TEAMS, MAX_PER_TEAM, NAME_MAX, PLAYER_COLORS, JOIN_ERROR,
} from '../web/shared/constants.js';

function randomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** In-memory room state: code → { players: Map(id → {id, name, team, color}) }. */
export function createRooms() {
  const rooms = new Map();
  let nextId = 1;

  function create() {
    let code;
    do code = randomCode(); while (rooms.has(code));
    rooms.set(code, { players: new Map() });
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

  function leave(code, id) {
    rooms.get(code)?.players.delete(id);
  }

  function remove(code) {
    rooms.delete(code);
  }

  function get(code) {
    return rooms.get(code);
  }

  return { create, join, leave, remove, get };
}
