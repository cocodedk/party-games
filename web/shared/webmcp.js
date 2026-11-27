// WebMCP: register a page's tools with an AI agent in the visitor's browser, and the pure input checks
// those tools call. An agent's input is not checked against inputSchema, so every tool goes through here.
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, NAME_MAX, TEAMS, MATCH_MODE, MATCH_RANGE } from './constants.js';
import { MOVE_ANGLE_MAX, WEBMCP_ERROR } from './webmcp-constants.js';
import { unit } from './unit.js';

const ROOM_PATTERN = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);
const MODES = Object.values(MATCH_MODE);

const isObject = (input) => Boolean(input) && typeof input === 'object' && !Array.isArray(input);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
// Errors are answers: a throw reaches the agent as an opaque UnknownError it cannot learn from.
export const refuse = (error, extra = {}) => ({ ok: false, error, ...extra });

// Registers each tool, passing options (e.g. {signal}) through; silent without a registry, and one refused tool does not stop the rest.
export async function initTools(list, options) {
  const registry = typeof document === 'undefined' ? null : document.modelContext;
  if (!registry || typeof registry.registerTool !== 'function') return;
  await Promise.all(list.map((tool) => Promise.resolve()
    .then(() => registry.registerTool(tool, options))
    .catch(() => { /* one refused tool must not take the others with it */ })));
}

// join {room, name, team} -> {ok:true, room, name, team} (room upper-cased, name trimmed and as long as the server allows) or a refusal.
export function checkJoin(input) {
  if (!isObject(input)) return refuse(WEBMCP_ERROR.NOT_OBJECT);
  const room = typeof input.room === 'string' ? input.room.trim().toUpperCase() : '';
  if (!ROOM_PATTERN.test(room)) return refuse(WEBMCP_ERROR.BAD_ROOM);
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > NAME_MAX) return refuse(WEBMCP_ERROR.BAD_NAME); // UTF-16 length, as server/rooms.js counts
  if (!TEAMS.includes(input.team)) return refuse(WEBMCP_ERROR.BAD_TEAM, { teams: TEAMS });
  return { ok: true, room, name, team: input.team };
}

// move_bat {x, y, angle} -> the pad's pose {ok:true, x, y, a}, x and y clamped to 0..1 as the pad does, angle to +-MOVE_ANGLE_MAX.
export function checkMove(input) {
  if (!isObject(input) || ![input.x, input.y, input.angle].every(isNumber)) return refuse(WEBMCP_ERROR.BAD_NUMBER);
  return { ok: true, x: unit(input.x), y: unit(input.y), a: Math.min(MOVE_ANGLE_MAX, Math.max(-MOVE_ANGLE_MAX, input.angle)) };
}

// set_rules {mode, value} -> {ok:true, mode, value} or a refusal that lists the valid modes and range.
export function checkRules(input) {
  if (!isObject(input)) return refuse(WEBMCP_ERROR.NOT_OBJECT);
  if (!MODES.includes(input.mode)) return refuse(WEBMCP_ERROR.BAD_MODE, { modes: MODES });
  const range = MATCH_RANGE[input.mode];
  if (!Number.isInteger(input.value) || input.value < range.min || input.value > range.max) {
    return refuse(WEBMCP_ERROR.BAD_VALUE, { range });
  }
  return { ok: true, mode: input.mode, value: input.value };
}
