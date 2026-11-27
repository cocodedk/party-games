import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { initTools, checkJoin, checkMove, checkRules } from '../web/shared/webmcp.js';
import { MOVE_ANGLE_MAX } from '../web/shared/webmcp-constants.js';
import { TEAM, TEAMS, NAME_MAX, MATCH_MODE, MATCH_RANGE } from '../web/shared/constants.js';

const tool = (name) => ({ name, description: name, execute: async () => ({ ok: true }) });

afterEach(() => { delete globalThis.document; });

test('no registry: initTools neither throws nor rejects', async () => {
  await initTools([tool('a')]);
  globalThis.document = {};
  await initTools([tool('a')]);
  globalThis.document = { modelContext: {} };
  await initTools([tool('a')]);
});

test('one refused registerTool does not stop the rest', async () => {
  const held = [];
  const options = { signal: 'withdraw' };
  globalThis.document = { modelContext: { registerTool: (t, o) => {
    assert.equal(o, options);
    if (t.name === 'sync') throw new Error('refused');
    if (t.name === 'async') return Promise.reject(new Error('refused'));
    held.push(t.name);
    return Promise.resolve();
  } } };
  await initTools(['first', 'sync', 'async', 'last'].map(tool), options);
  assert.deepEqual(held, ['first', 'last']);
});

test('bad input gives {ok:false, error} instead of a throw', () => {
  const bad = [
    [checkJoin, [null, [], 'text', {}, { room: 'AB', name: 'Ann', team: TEAM.LEFT }, { room: 'abcd', name: '  ', team: TEAM.LEFT },
      { room: 'ABCD', name: 'Ann', team: 'up' }, { room: 'ABCD', name: 'n'.repeat(NAME_MAX + 1), team: TEAM.LEFT },
      { room: 'ABCD', name: '\u{1F600}'.repeat(NAME_MAX / 2 + 1), team: TEAM.LEFT }]],
    [checkMove, [null, {}, { x: '1', y: 0, angle: 0 }, { x: 0, y: NaN, angle: 0 }, { x: 0, y: 0, angle: Infinity }]],
    [checkRules, [null, [], { mode: 'laps', value: 3 }, { mode: MATCH_MODE.TIME, value: 1.5 },
      { mode: MATCH_MODE.SCORE, value: MATCH_RANGE[MATCH_MODE.SCORE].max + 1 }, { mode: MATCH_MODE.TIME, value: 0 }]],
  ];
  for (const [check, inputs] of bad) {
    for (const input of inputs) {
      const answer = check(input);
      assert.equal(answer.ok, false, `${check.name} ${JSON.stringify(input)}`);
      assert.equal(typeof answer.error, 'string');
    }
  }
  assert.deepEqual(checkJoin({ room: 'ABCD', name: 'x', team: 'up' }).teams, TEAMS);
  const emoji = '\u{1F600}'.repeat(NAME_MAX / 2); // NAME_MAX UTF-16 units: the most the server takes
  assert.deepEqual(checkJoin({ room: ' abcd ', name: ` ${emoji} `, team: TEAM.RIGHT }),
    { ok: true, room: 'ABCD', name: emoji, team: TEAM.RIGHT });
  assert.deepEqual(checkRules({ mode: MATCH_MODE.TIME, value: 2 }), { ok: true, mode: MATCH_MODE.TIME, value: 2 });
});

test('out-of-range move_bat is clamped to the pad pose', () => {
  assert.deepEqual(checkMove({ x: -3, y: 7, angle: 10 }), { ok: true, x: 0, y: 1, a: MOVE_ANGLE_MAX });
  assert.deepEqual(checkMove({ x: 2, y: -1, angle: -10 }), { ok: true, x: 1, y: 0, a: -MOVE_ANGLE_MAX });
  assert.deepEqual(checkMove({ x: 0.25, y: 0.5, angle: 0.3 }), { ok: true, x: 0.25, y: 0.5, a: 0.3 });
});
