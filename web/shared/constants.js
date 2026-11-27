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
};

export const MESSAGE_MAX_BYTES = 1024;

export const DEFAULT_PORT = 8080;
export const LOCALHOST = 'localhost';
export const QR_PATH = '/qr.svg';
export const SITE_ROOT = 'dist';
export const PAGES = { '/': 'index.html', '/screen': 'screen.html', '/host': 'host.html' };
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

// Pad: finger segments shorter than this (px) are jitter and do not turn the bat.
export const PAD_MIN_MOVE = 2;
