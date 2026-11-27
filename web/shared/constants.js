// Every meaningful number and string, shared by the server and the browser.

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 4;

export const TEAM = { LEFT: 'left', RIGHT: 'right' };
export const TEAMS = [TEAM.LEFT, TEAM.RIGHT];
export const MAX_PER_TEAM = 4;

export const NAME_MAX = 16;

export const PLAYER_COLORS = [
  '#ff5a5f', '#ffb400', '#00c2a8', '#3d9bff',
  '#b26bff', '#ff7ac6', '#8bd450', '#ff8c42',
];

export const JOIN_ERROR = {
  NO_ROOM: 'no-room',
  TEAM_FULL: 'team-full',
  BAD_NAME: 'bad-name',
  BAD_TEAM: 'bad-team',
};

// WebSocket messages the server routes: { type, ...payload }.
export const MSG = {
  CREATE: 'create',
  CREATED: 'created',
  JOIN: 'join',
  JOINED: 'joined',
  ERROR: 'error',
  PLAYER: 'player',
  LEFT: 'left',
  INPUT: 'input',
  BUZZ: 'buzz',
  CLOSED: 'closed',
  HOST: 'host',
  ROLE: 'role',
  STATE: 'state',
  SETTINGS: 'settings',
  START: 'start',
  PAUSE: 'pause',
  RESUME: 'resume',
  END: 'end',
  AGAIN: 'again',
  LOBBY: 'lobby',
};
// Game-master commands, relayed to the screen only from the room's current game master.
export const MASTER_COMMANDS = [MSG.SETTINGS, MSG.START, MSG.PAUSE, MSG.RESUME, MSG.END, MSG.AGAIN, MSG.LOBBY];
export const MASTER_HOST = 'host'; // rooms.master() when a /host page is game master
export const HOST_ID_PREFIX = 'h'; // host ids, kept apart from the numeric phone ids

export const MESSAGE_MAX_BYTES = 1024;

export const DEFAULT_PORT = 8080;
export const LOCALHOST = 'localhost';
export const QR_PATH = '/qr.svg';
export const SITE_ROOT = 'dist';
export const PAGES = { '/': 'index.html', '/screen': 'screen.html', '/host': 'host.html' };
export const PORT_ENV = 'PORT'; // npm start listens on this environment variable's port, else DEFAULT_PORT
export const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
export const CONTENT_TYPE_BINARY = 'application/octet-stream';
export const HTTP_STATUS = { OK: 200, NOT_FOUND: 404 };

// Field in logical units (16:9); each team owns half of it.
export const FIELD_W = 16;
export const FIELD_H = 9;

// Bat: a thick segment; angle 0 is vertical, positive turns clockwise on screen.
export const BAT_LENGTH = 1.8;
export const BAT_THICKNESS = 0.25;
export const BAT_EASE_MS = 80; // time to cover BAT_EASE_REACHED of the way to the target
export const BAT_EASE_REACHED = 0.95;
export const MS_PER_S = 1000;

// Ball and collisions. Speeds are field units per second.
export const BALL_RADIUS = 0.2;
export const BALL_MAX = 24;
export const BALL_HIT_SPEEDUP = 1.05; // speed factor per bat hit
export const BAT_SWING_SHARE = 0.5; // part of the bat's contact-point velocity added to the ball
export const BUMP_FREEZE_MS = 1000; // teammates that collide ignore their phones this long
export const BUMP_SEPARATE_TRIES = 16; // most push-apart rounds over all teammate pairs per substep
export const WALL_FREE_STEPS = 20; // bisection steps that slide a pinned ball along the wall out of a bat
export const EVENT = { WALL: 'wall', HIT: 'hit', GOAL: 'goal', BUMP: 'bump' };

// Pad: finger segments shorter than this (px) are jitter and do not turn the bat.
export const PAD_MIN_MOVE = 2;

// Phone page.
export const ROOM_PARAM = 'room'; // ?room=CODE in the join link
export const WS_PATH = '/';
export const INPUT_PER_S = 60; // most input messages a phone sends per second
export const NET_EVENT = { OPEN: 'open', CLOSE: 'close' }; // socket events on() also reports
export const PHONE_TEXT = {
  JOIN: 'Join',
  JOINING: 'Joining…',
  TEAM: (label) => `${label} team`,
  SCREEN_LEFT: 'The game screen closed',
  DROPPED: 'Lost the connection to the game. Check that your phone is on the same Wi-Fi as the game.',
  ERROR: {
    [JOIN_ERROR.NO_ROOM]: 'No game uses that room code. Check the code on the game screen.',
    [JOIN_ERROR.TEAM_FULL]: 'That team is full. Pick the other team.',
    [JOIN_ERROR.BAD_NAME]: `Enter a name of 1 to ${NAME_MAX} characters.`,
    [JOIN_ERROR.BAD_TEAM]: 'Pick Left or Right.',
  },
};

// Screen page.
export const DPR_MAX = 1.5; // canvas pixels per CSS pixel, capped for cheap drawing on a TV
export const TEAM_NAME = { [TEAM.LEFT]: 'Left team', [TEAM.RIGHT]: 'Right team' };
export const FIELD_COLOR = '#000';
export const LINE_COLOR = '#fff';
export const LINE_WIDTH = 0.06; // field lines, in field units
export const MIDLINE_DASH = [0.3, 0.3]; // dash and gap, in field units
export const SCREEN_TEXT = {
  STARTING: 'Starting…',
  EMPTY_TEAM: 'Scan the code to join',
  LOST: 'Lost the connection to the game server. Reload this page.',
};

// Match rules (web/games/pong/match.js). Times in seconds.
export const PHASE = {
  LOBBY: 'lobby', COUNTDOWN: 'countdown', PLAYING: 'playing', GOAL: 'goal', PAUSED: 'paused', OVER: 'over',
};
export const MATCH_MODE = { TIME: 'time', SCORE: 'score' };
export const MATCH_RANGE = { [MATCH_MODE.TIME]: { min: 1, max: 10 }, [MATCH_MODE.SCORE]: { min: 1, max: 20 } }; // minutes, points
export const MATCH_DEFAULTS = { mode: MATCH_MODE.SCORE, value: 5 };
export const COUNTDOWN_S = 3;
export const GOAL_PAUSE_S = 1.5; // after a goal, before the next serve
export const MATCH_DT_MAX = 0.1; // longest step the match clock takes, so a stalled tab does not skip time
export const S_PER_MIN = 60;
export const CHANGE = { PHASE: 'phase', SERVE: 'serve' }; // step() changes: {type: PHASE, phase} / {type: SERVE, toward: team}
export const FIRST_SERVE_LEFT_BELOW = 0.5; // rng() below this serves first toward the left team
export const DRAW = 'draw'; // view().winner when a match ends level
