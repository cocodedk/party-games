// /screen's WebMCP tools: read-only answers from the screen's own state at call time.
import { initTools } from '../shared/webmcp.js';
import { TOOL, TOOL_DESCRIPTION, SCREEN_PAGE, BAT_UNITS } from '../shared/webmcp-constants.js';
import { TEAMS } from '../shared/constants.js';

const NO_INPUT = { type: 'object', properties: {} };
const READ_ONLY = { readOnlyHint: true };

// read() -> { room, view: match.view(), bats: [{ id, team, name, x, y, a }] }
export function registerScreenTools(read) {
  const describe = () => ({ ok: true, page: SCREEN_PAGE, room: read().room, tools: [TOOL.DESCRIBE, TOOL.GET_STATE] });
  const getState = () => {
    const { room, view, bats } = read();
    const teams = {};
    for (const team of TEAMS) teams[team] = bats.filter((b) => b.team === team).map((b) => b.name);
    return {
      ok: true,
      room,
      teams,
      score: view.score,
      phase: view.phase,
      timeLeft: view.timeLeft === null ? null : Math.ceil(view.timeLeft),
      bats: bats.map(({ id, team, x, y, a }) => ({ id, team, x, y, angle: a })),
      units: BAT_UNITS,
    };
  };
  initTools([
    { name: TOOL.DESCRIBE, description: TOOL_DESCRIPTION.SCREEN_DESCRIBE, inputSchema: NO_INPUT, annotations: READ_ONLY, execute: async () => describe() },
    { name: TOOL.GET_STATE, description: TOOL_DESCRIPTION.SCREEN_GET_STATE, inputSchema: NO_INPUT, annotations: READ_ONLY, execute: async () => getState() },
  ]);
}
