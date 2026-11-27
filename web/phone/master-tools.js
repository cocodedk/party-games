// The game master's WebMCP tools (master phone and /host): each presses its button's own code path,
// and only while that button is on the screen. offer(false) withdraws them through an AbortSignal.
import { initTools, checkRules, refuse } from '../shared/webmcp.js';
import { TOOL, TOOL_DESCRIPTION, MASTER_TOOLS, FIELD_TEXT, NO_INPUT, WEBMCP_ERROR } from '../shared/webmcp-constants.js';
import { MATCH_MODE } from '../shared/constants.js';

const RULES_INPUT = {
  type: 'object',
  properties: {
    mode: { type: 'string', enum: Object.values(MATCH_MODE), description: FIELD_TEXT.MODE },
    value: { type: 'integer', description: FIELD_TEXT.VALUE },
  },
  required: ['mode', 'value'],
};

// controls.usable(name): its button is shown and enabled; controls.run(name, input) presses it.
export function createMasterTools(controls) {
  let controller = null; // set while the tools are offered
  const press = (name, input) => {
    if (!controls.usable(name)) return refuse(WEBMCP_ERROR.NOT_NOW);
    controls.run(name, input);
    return { ok: true, pressed: name };
  };
  const setRules = (input) => {
    const checked = checkRules(input);
    if (!checked.ok) return checked;
    const answer = press(TOOL.SET_RULES, checked);
    return answer.ok ? { ...answer, mode: checked.mode, value: checked.value } : answer;
  };
  const list = [
    { name: TOOL.SET_RULES, description: TOOL_DESCRIPTION.SET_RULES, inputSchema: RULES_INPUT, execute: async (input) => setRules(input) },
    { name: TOOL.START, description: TOOL_DESCRIPTION.START, inputSchema: NO_INPUT, execute: async () => press(TOOL.START) },
    { name: TOOL.PAUSE, description: TOOL_DESCRIPTION.PAUSE, inputSchema: NO_INPUT, execute: async () => press(TOOL.PAUSE) },
    { name: TOOL.END, description: TOOL_DESCRIPTION.END, inputSchema: NO_INPUT, annotations: { consequentialHint: true }, execute: async () => press(TOOL.END) },
  ];
  return {
    offer(on) {
      if (on === Boolean(controller)) return;
      if (controller) {
        controller.abort();
        controller = null;
        return;
      }
      controller = new AbortController();
      initTools(list, { signal: controller.signal });
    },
    /** The tool names offered now. */
    names: () => (controller ? MASTER_TOOLS : []),
  };
}
