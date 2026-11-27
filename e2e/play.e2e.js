// End-to-end proof in a real Chrome with WebMCP: a screen and two phones, driven through the tools only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { startServer } from '../server/index.js';
import { TEAM, PHASE } from '../web/shared/constants.js';
import { TOOL, MASTER_TOOLS, PHONE_VIEW, WEBMCP_FLAG, E2E } from '../web/shared/webmcp-constants.js';

// Calls a tool through the registry as an agent would. Chrome 156+ takes an object, 153 a JSON string.
const call = (page, name, input = {}) => page.evaluate(async ([n, i]) => {
  const tool = (await document.modelContext.getTools()).find((t) => t.name === n);
  if (!tool) return { notListed: n };
  let out;
  try {
    out = await document.modelContext.executeTool(tool, i);
  } catch (e) {
    if (!(e instanceof TypeError)) throw e;
    out = await document.modelContext.executeTool(tool, JSON.stringify(i));
  }
  return JSON.parse(out);
}, [name, input]);

// Polls until check(value) holds; fails with what it last saw.
async function until(read, check, what) {
  const end = Date.now() + E2E.WAIT_MS;
  let seen;
  while (Date.now() < end) {
    seen = await read();
    if (check(seen)) return seen;
    await new Promise((done) => setTimeout(done, E2E.POLL_MS));
  }
  assert.fail(`${what}; last seen ${JSON.stringify(seen)}`);
}

const listed = (page) => page.evaluate(async () => (document.modelContext ? (await document.modelContext.getTools()).map((t) => t.name) : []));
const tools = (page, names) => until(() => listed(page), (have) => names.every((n) => have.includes(n)), `not proved: tools ${names} not all listed by getTools()`);

test('two phones join, the game master starts the match and a bat moves, all through WebMCP tools', async () => {
  const server = await startServer({ port: 0 });
  const host = new URL(server.url).host;
  const outside = [];
  let browser = null;
  try {
    browser = await chromium.launch({ channel: E2E.CHANNEL, headless: true, args: [WEBMCP_FLAG] });
    const context = await browser.newContext();
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (new URL(url).host === host) return route.continue();
      outside.push(url);
      return route.abort();
    });
    const screen = await context.newPage();
    await screen.goto(`${server.url}/screen`);
    await tools(screen, [TOOL.DESCRIBE, TOOL.GET_STATE]);
    const { room } = await until(() => call(screen, TOOL.GET_STATE), (s) => s.room, 'the screen made no room');

    const phones = {};
    for (const team of [TEAM.LEFT, TEAM.RIGHT]) {
      const phone = await context.newPage();
      await phone.goto(server.url);
      await tools(phone, [TOOL.DESCRIBE, TOOL.JOIN, TOOL.MOVE_BAT]);
      assert.equal((await call(phone, TOOL.JOIN, { room, name: E2E.NAMES[team], team })).ok, true);
      await until(() => call(phone, TOOL.DESCRIBE), (d) => d.showing === PHONE_VIEW.PAD, `the ${team} phone did not join`);
      phones[team] = phone;
    }
    const master = phones[TEAM.LEFT]; // the first phone to join is game master
    await tools(master, MASTER_TOOLS);
    assert.deepEqual((await until(() => call(master, TOOL.SET_RULES, E2E.RULES), (r) => r.ok, 'set_rules refused')).value, E2E.RULES.value);
    await screen.bringToFront(); // a background tab gets no animation frames, and the screen's clock runs on them
    await until(() => call(master, TOOL.START), (r) => r.ok, 'start refused');
    const playing = await until(() => call(screen, TOOL.GET_STATE), (s) => s.phase === PHASE.PLAYING, 'the match did not start');
    assert.deepEqual(playing.teams, { [TEAM.LEFT]: [E2E.NAMES[TEAM.LEFT]], [TEAM.RIGHT]: [E2E.NAMES[TEAM.RIGHT]] });

    const before = playing.bats.find((b) => b.team === TEAM.LEFT);
    assert.equal((await call(master, TOOL.MOVE_BAT, E2E.MOVE)).ok, true);
    await until(() => call(screen, TOOL.GET_STATE), (s) => {
      const bat = s.bats.find((b) => b.id === before.id);
      return Math.hypot(bat.x - before.x, bat.y - before.y) >= E2E.MOVED_MIN;
    }, 'the bat did not move');

    assert.equal(await master.evaluate((id) => getComputedStyle(document.getElementById(id)).touchAction, PHONE_VIEW.PAD), 'none');
    const shot = join(tmpdir(), E2E.SCREENSHOT);
    await screen.screenshot({ path: shot });
    console.log(`screenshot: ${shot}`);
    assert.deepEqual(outside, [], 'requests to another host');
  } finally {
    try {
      if (browser) await browser.close();
    } finally {
      await server.close();
    }
  }
});
