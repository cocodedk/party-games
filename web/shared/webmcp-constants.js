// WebMCP: tool names and the texts an agent reads. Extended by the page tools (screen, phone, game master).
import { MATCH_MODE, MATCH_RANGE, NAME_MAX, FIELD_W, FIELD_H, TEAM } from './constants.js';

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
  SET_RULES: 'Choose the match rules before it starts, as the Time/Goals toggle and the -/+ buttons do: mode "time" (value in minutes) or "score" (value in goals to win). Offered only to the game master; works in the lobby only.',
  START: 'Start the match, as the Start button does (lobby only, with at least one player on each team). The TV counts down 3-2-1 first.',
  PAUSE: 'Pause the match, or resume it when it is paused, as the Pause/Resume button does. Works only while a match is on.',
  END: 'End the match now, as the End button does: the TV shows the final score and the winner. It cannot be undone.',
  HOST_DESCRIBE: 'Say what this game-master page shows now: the room form (with any error), the match controls (with the room) or the lost-connection notice, whether this page is game master, and which tools it has. Read-only.',
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
  MODE: 'time: play for a number of minutes; score: first team to a number of goals wins.',
  VALUE: `A whole number: minutes ${MATCH_RANGE[MATCH_MODE.TIME].min}-${MATCH_RANGE[MATCH_MODE.TIME].max}, goals ${MATCH_RANGE[MATCH_MODE.SCORE].min}-${MATCH_RANGE[MATCH_MODE.SCORE].max}.`,
};
export const MASTER_TOOLS = [TOOL.SET_RULES, TOOL.START, TOOL.PAUSE, TOOL.END];
export const HOST_PAGE = 'The game-master page of Team Pong, for a laptop: first a form for the room code on the TV, then the match controls '
  + '(rules and Start in the lobby, Pause and End during a match) while this page is game master, otherwise a waiting line.';
export const HOST_VIEW = { FORM: 'form', CONTROLS: 'controls', LOST: 'lost' };
export const HOST_VIEW_TEXT = {
  [HOST_VIEW.FORM]: { id: 'error', key: 'formError' },
  [HOST_VIEW.CONTROLS]: { id: 'who', key: 'room' },
  [HOST_VIEW.LOST]: { id: 'lostText', key: 'notice' },
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
  NOT_NOW: 'That button is not on the game master\'s screen right now (wrong phase, or not enough players).',
  BAD_VALUE: 'value must be a whole number in the range for the mode.',
};

// The end-to-end proof (e2e/play.e2e.js): a real Chrome with WebMCP switched on, driven through the tools only.
export const WEBMCP_FLAG = '--enable-features=WebMCP';
export const E2E = {
  CHANNEL: 'chrome',
  NAMES: { [TEAM.LEFT]: 'Ann', [TEAM.RIGHT]: 'Bo' },
  RULES: { mode: MATCH_MODE.TIME, value: 1 },
  MOVE: { x: 1, y: 0, angle: 0.5 }, // the left bat to the top of the centre line
  MOVED_MIN: 1, // field units the bat must travel to count as moved
  WAIT_MS: 15000, // longest wait for a tool to appear or the page to reach a state
  POLL_MS: 100,
  SCREENSHOT: 'team-pong-screen.png', // written to the system's temp folder
};

// The dist/ scan (tests/dist-scan.test.js): no URL in the build may point anywhere but the page's own server.
export const URL_PATTERN = /https?:\/\/[^\s"'`<>()]+/g;
