// The phone page's WebMCP tools: describe reads the page, join and move_bat go through the form's and the pad's code.
import { initTools, checkJoin, checkMove, refuse } from '../shared/webmcp.js';
import {
  TOOL, TOOL_DESCRIPTION, PHONE_PAGE, PHONE_VIEW, PHONE_VIEW_TEXT, FIELD_TEXT, NO_INPUT, READ_ONLY, WEBMCP_ERROR,
} from '../shared/webmcp-constants.js';
import { TEAMS, NAME_MAX, ROOM_CODE_LENGTH } from '../shared/constants.js';

const byId = (id) => document.getElementById(id);
const showing = () => Object.values(PHONE_VIEW).find((id) => !byId(id).hidden);

const JOIN_INPUT = {
  type: 'object',
  properties: {
    room: { type: 'string', minLength: ROOM_CODE_LENGTH, maxLength: ROOM_CODE_LENGTH, description: FIELD_TEXT.ROOM },
    name: { type: 'string', minLength: 1, maxLength: NAME_MAX, description: FIELD_TEXT.NAME },
    team: { type: 'string', enum: TEAMS, description: FIELD_TEXT.TEAM },
  },
  required: ['room', 'name', 'team'],
};
const MOVE_INPUT = {
  type: 'object',
  properties: {
    x: { type: 'number', minimum: 0, maximum: 1, description: FIELD_TEXT.X },
    y: { type: 'number', minimum: 0, maximum: 1, description: FIELD_TEXT.Y },
    angle: { type: 'number', description: FIELD_TEXT.ANGLE },
  },
  required: ['x', 'y', 'angle'],
};

// page.masterTools() names the game-master tools offered now; page.join({room, name, team}) submits the form; page.move({x, y, a}) sends a pose, false before joining.
export function registerPhoneTools(page) {
  const describe = () => {
    const view = showing();
    const { id, key } = PHONE_VIEW_TEXT[view];
    return { ok: true, page: PHONE_PAGE, showing: view, [key]: byId(id).textContent, tools: [TOOL.DESCRIBE, TOOL.JOIN, TOOL.MOVE_BAT, ...page.masterTools()] };
  };
  const join = (input) => {
    if (showing() === PHONE_VIEW.PAD) return refuse(WEBMCP_ERROR.ALREADY_JOINED);
    const checked = checkJoin(input);
    if (!checked.ok) return checked;
    page.join(checked);
    return { ok: true, sent: { room: checked.room, name: checked.name, team: checked.team } };
  };
  const move = (input) => {
    const checked = checkMove(input);
    if (!checked.ok) return checked;
    const pose = { x: checked.x, y: checked.y, a: checked.a };
    if (!page.move(pose)) return refuse(WEBMCP_ERROR.NOT_JOINED);
    return { ok: true, pose: { x: pose.x, y: pose.y, angle: pose.a } };
  };
  initTools([
    { name: TOOL.DESCRIBE, description: TOOL_DESCRIPTION.PHONE_DESCRIBE, inputSchema: NO_INPUT, annotations: READ_ONLY, execute: async () => describe() },
    { name: TOOL.JOIN, description: TOOL_DESCRIPTION.PHONE_JOIN, inputSchema: JOIN_INPUT, execute: async (input) => join(input) },
    { name: TOOL.MOVE_BAT, description: TOOL_DESCRIPTION.PHONE_MOVE_BAT, inputSchema: MOVE_INPUT, execute: async (input) => move(input) },
  ]);
}
