import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScorers } from '../web/games/pong/scorers.js';
import { TEAM, EVENT, SCREEN_TEXT } from '../web/shared/constants.js';

const bats = new Map([
  ['a', { name: 'Ann', team: TEAM.LEFT }],
  ['c', { name: 'Cy', team: TEAM.LEFT }],
  ['b', { name: 'Bo', team: TEAM.RIGHT }],
]);
const hit = (id) => ({ type: EVENT.HIT, id });
const goal = (side) => ({ type: EVENT.GOAL, side });

test('each goal goes to the last bat that hit the ball, most goals first, own goals apart', () => {
  const s = createScorers();
  s.step([hit('b'), hit('c'), goal(TEAM.LEFT)], bats); // Cy's goal
  s.step([hit('a'), goal(TEAM.LEFT)], bats);
  s.step([hit('a')], bats); // the last hit carries over steps
  s.step([goal(TEAM.LEFT)], bats);
  s.step([hit('b'), goal(TEAM.LEFT)], bats); // Bo's own goal counts for the left team
  assert.deepEqual(s.goal(), { team: TEAM.LEFT, name: 'Bo', own: true });
  assert.equal(SCREEN_TEXT.GOAL('Bo', true), 'Own goal! Bo');
  s.step([hit('b'), goal(TEAM.RIGHT)], bats);
  assert.deepEqual(s.lines(), {
    [TEAM.LEFT]: [SCREEN_TEXT.SCORER('Ann', 2, false), SCREEN_TEXT.SCORER('Cy', 1, false), SCREEN_TEXT.SCORER('Bo', 1, true)],
    [TEAM.RIGHT]: [SCREEN_TEXT.SCORER('Bo', 1, false)],
  });
  assert.equal(SCREEN_TEXT.SCORER('Bo', 1, true), 'Bo 1 (own goal)');
  s.step([hit('b'), goal(TEAM.RIGHT)], bats);
  assert.deepEqual(s.lines()[TEAM.RIGHT], [SCREEN_TEXT.SCORER('Bo', 2, false)]);
});

test('a goal nobody touched has no scorer, and a goal clears the last hit; reset starts over', () => {
  const s = createScorers();
  assert.equal(s.goal(), null);
  s.step([goal(TEAM.RIGHT)], bats); // a serve straight in
  assert.deepEqual(s.goal(), { team: TEAM.RIGHT, name: null, own: false });
  assert.equal(SCREEN_TEXT.GOAL(null, false), 'Goal!');
  s.step([hit('a'), goal(TEAM.LEFT)], bats);
  assert.equal(SCREEN_TEXT.GOAL(s.goal().name, s.goal().own), 'Goal! Ann');
  s.reset();
  s.step([hit('a'), goal(TEAM.LEFT), goal(TEAM.LEFT)], bats); // the second goal has no hit since the first
  s.step([hit('gone'), goal(TEAM.LEFT)], bats); // a bat no longer in the game
  assert.deepEqual(s.lines(), { [TEAM.LEFT]: [SCREEN_TEXT.SCORER('Ann', 1, false)], [TEAM.RIGHT]: [] });
  s.reset();
  assert.deepEqual(s.lines(), { [TEAM.LEFT]: [], [TEAM.RIGHT]: [] });
  assert.equal(s.goal(), null);
});
