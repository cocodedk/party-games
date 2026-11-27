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
