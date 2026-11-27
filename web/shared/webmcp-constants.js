// WebMCP: tool names and the texts an agent reads. Extended by the page tools (screen, phone, game master).
import { MATCH_MODE, NAME_MAX, FIELD_W, FIELD_H } from './constants.js';

export const NO_INPUT = { type: 'object', properties: {} }; // inputSchema of a tool that takes nothing
export const READ_ONLY = { readOnlyHint: true };

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
  PHONE_DESCRIBE: 'Say what this phone page shows now: the join form (with any error), the bat pad (with the player and team) or the lost-connection notice, and which tools it has. Read-only.',
  PHONE_JOIN: 'Join the room on the TV with a name and a team, as the Join button does. It only sends the request: call describe afterwards to see the bat pad, or the join form with the error.',
  PHONE_MOVE_BAT: 'Move this player\'s bat, as a finger on the pad does: x and y from 0 to 1 across the team\'s half (from the top left), angle in radians (0 upright, positive clockwise). Values out of range are clamped; the answer gives the pose sent. Only after joining.',
  SCREEN_GET_STATE: 'Read the match now: room code, each team with its player names, score, phase, seconds left (null in a goals match) and every bat (player id, team, x, y, angle). Read-only.',
};

// What /screen's describe answers, in English.
export const SCREEN_PAGE = `The TV screen of Team Pong: a ${FIELD_W} by ${FIELD_H} field split into a left and a right half, one per team. `
  + 'Each phone that joins with the room code moves one bat on its team\'s half; the score and clock sit at the top. '
  + 'Before the match a lobby band shows the room code, a QR code and the players. Nothing on this page acts: it only shows.';
export const PHONE_PAGE = 'The phone controller of Team Pong. First a join form (room code, name, Left or Right team); once joined, '
  + 'the whole page is a pad that moves the player\'s bat on the TV; a game master also sees match controls. If the connection drops, a notice offers to join again.';
// The phone page's sections (element ids) and, for describe, the id and answer key of the text each one shows.
export const PHONE_VIEW = { FORM: 'form', PAD: 'pad', LOST: 'lost' };
export const PHONE_VIEW_TEXT = {
  [PHONE_VIEW.FORM]: { id: 'error', key: 'formError' },
  [PHONE_VIEW.PAD]: { id: 'who', key: 'player' },
  [PHONE_VIEW.LOST]: { id: 'lostText', key: 'notice' },
};
// What the join and move_bat input fields mean, for the agent.
export const FIELD_TEXT = {
  ROOM: 'The room code shown on the TV screen.',
  NAME: 'The player name shown on the TV.',
  TEAM: 'Which half of the field the bat plays on.',
  X: 'Across the team\'s half, 0 to 1 from the left.',
  Y: 'Down the field, 0 to 1 from the top.',
  ANGLE: 'Radians: 0 upright, positive clockwise.',
};
export const BAT_UNITS = `x and y in field units (x 0..${FIELD_W}, y 0..${FIELD_H}, from the top left); angle in radians, 0 upright, positive clockwise.`;

export const MOVE_ANGLE_MAX = Math.PI; // move_bat clamps angle to this many radians either side of upright

export const WEBMCP_ERROR = {
  NOT_OBJECT: 'Send the input as a JSON object.',
  BAD_ROOM: 'room must be the code shown on the TV screen.',
  BAD_NAME: `name must be 1 to ${NAME_MAX} characters (an emoji counts as 2).`,
  BAD_TEAM: 'team must be one of the listed teams.',
  BAD_NUMBER: 'x, y and angle must be numbers: x and y from 0 to 1, angle in radians.',
  BAD_MODE: `mode must be "${MATCH_MODE.TIME}" or "${MATCH_MODE.SCORE}".`,
  NOT_JOINED: 'Join a room first: the bat moves only once the pad is showing.',
  ALREADY_JOINED: 'This phone has joined already: its bat pad is showing.',
  BAD_VALUE: 'value must be a whole number in the range for the mode.',
};
