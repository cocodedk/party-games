// WebMCP: tool names and the texts an agent reads. Extended by the page tools (screen, phone, game master).
import { MATCH_MODE, NAME_MAX, FIELD_W, FIELD_H } from './constants.js';

export const TOOL = {
  DESCRIBE: 'describe',
  GET_STATE: 'get_state',
  JOIN: 'join',
  MOVE_BAT: 'move_bat',
  SET_RULES: 'set_rules',
  START: 'start',
  PAUSE: 'pause',
  END: 'end',
};

// What each tool tells the agent: what comes back and when to use it.
export const TOOL_DESCRIPTION = {
  SCREEN_DESCRIBE: 'Say what this TV screen shows: the Team Pong field, the room code phones join with, and which tools this page has. Read-only.',
  SCREEN_GET_STATE: 'Read the match now: room code, each team with its player names, score, phase, seconds left (null in a goals match) and every bat (player id, team, x, y, angle). Read-only.',
};

// What /screen's describe answers, in English.
export const SCREEN_PAGE = `The TV screen of Team Pong: a ${FIELD_W} by ${FIELD_H} field split into a left and a right half, one per team. `
  + 'Each phone that joins with the room code moves one bat on its team\'s half; the score and clock sit at the top. '
  + 'Before the match a lobby band shows the room code, a QR code and the players. Nothing on this page acts: it only shows.';
export const BAT_UNITS = `x and y in field units (x 0..${FIELD_W}, y 0..${FIELD_H}, from the top left); angle in radians, 0 upright, positive clockwise.`;

export const MOVE_ANGLE_MAX = Math.PI; // move_bat clamps angle to this many radians either side of upright

export const WEBMCP_ERROR = {
  NOT_OBJECT: 'Send the input as a JSON object.',
  BAD_ROOM: 'room must be the code shown on the TV screen.',
  BAD_NAME: `name must be 1 to ${NAME_MAX} characters (an emoji counts as 2).`,
  BAD_TEAM: 'team must be one of the listed teams.',
  BAD_NUMBER: 'x, y and angle must be numbers: x and y from 0 to 1, angle in radians.',
  BAD_MODE: `mode must be "${MATCH_MODE.TIME}" or "${MATCH_MODE.SCORE}".`,
  BAD_VALUE: 'value must be a whole number in the range for the mode.',
};
