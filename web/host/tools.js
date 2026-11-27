// /host's describe tool: what the page shows now, registered whether or not this page is game master.
import { initTools } from '../shared/webmcp.js';
import { TOOL, TOOL_DESCRIPTION, HOST_PAGE, HOST_VIEW, HOST_VIEW_TEXT, NO_INPUT, READ_ONLY } from '../shared/webmcp-constants.js';

const byId = (id) => document.getElementById(id);

// masterTools() names the game-master tools offered now (none while this page is not game master).
export function registerHostTools(masterTools) {
  const describe = () => {
    const view = Object.values(HOST_VIEW).find((id) => !byId(id).hidden);
    const { id, key } = HOST_VIEW_TEXT[view];
    const offered = masterTools();
    return { ok: true, page: HOST_PAGE, showing: view, [key]: byId(id).textContent, gameMaster: offered.length > 0, tools: [TOOL.DESCRIBE, ...offered] };
  };
  initTools([
    { name: TOOL.DESCRIBE, description: TOOL_DESCRIPTION.HOST_DESCRIBE, inputSchema: NO_INPUT, annotations: READ_ONLY, execute: async () => describe() },
  ]);
}
