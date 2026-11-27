// WebMCP: tool names and the texts an agent reads. Extended by the page tools (screen, phone, game master).
import { MATCH_MODE, NAME_MAX } from './constants.js';

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
