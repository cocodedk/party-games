import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMatch } from '../web/games/pong/match.js';
import {
  TEAM, EVENT, PHASE, MATCH_MODE, MATCH_RANGE, MATCH_DEFAULTS, COUNTDOWN_S, GOAL_PAUSE_S, MATCH_DT_MAX, S_PER_MIN,
  CHANGE, DRAW,
} from '../web/shared/constants.js';

const DT = 1 / 16; // exact in binary, so steps add up to whole seconds without rounding drift
const BOTH = { [TEAM.LEFT]: 1, [TEAM.RIGHT]: 2 };
const LEFT_SCORES = [{ type: EVENT.GOAL, side: TEAM.LEFT }];
const RIGHT_SCORES = [{ type: EVENT.GOAL, side: TEAM.RIGHT }];
const EPS = 1e-9;

/** Steps the match for about `seconds`, returning every change. */
function run(match, seconds) {
  const changes = [];
  for (let t = 0; t < seconds - EPS; t += DT) changes.push(...match.step(DT));
  return changes;
}

/** A match past its countdown, in playing. */
function playing({ mode = MATCH_DEFAULTS.mode, value = MATCH_DEFAULTS.value, rng = () => 0 } = {}) {
  const match = createMatch({ rng });
  match.settings(mode, value);
  match.start(BOTH);
  run(match, COUNTDOWN_S);
  return match;
}

test('start is refused with an empty team; settings ignore bad modes and values', () => {
  const match = createMatch({ rng: () => 0 });
  assert.deepEqual(match.view(), {
    phase: PHASE.LOBBY, score: { left: 0, right: 0 }, timeLeft: null, settings: MATCH_DEFAULTS, canStart: false, winner: null, countdown: null,
  });
  for (const [mode, value] of [['speed', 3], [MATCH_MODE.TIME, 2.5], [MATCH_MODE.TIME, '3'], [MATCH_MODE.TIME, 0],
    [MATCH_MODE.TIME, MATCH_RANGE.time.max + 1], [MATCH_MODE.SCORE, MATCH_RANGE.score.max + 1], ['constructor', 1]]) {
    assert.equal(match.settings(mode, value), false, `${mode} ${value}`);
  }
  assert.deepEqual(match.view().settings, MATCH_DEFAULTS);
  assert.equal(match.settings(MATCH_MODE.SCORE, MATCH_RANGE.score.max), true);
  assert.equal(match.start({ [TEAM.LEFT]: 2, [TEAM.RIGHT]: 0 }), false);
  match.teams({ [TEAM.LEFT]: 2 });
  assert.equal(match.start(), false);
  assert.equal(match.view().phase, PHASE.LOBBY);
  match.teams(BOTH);
  assert.equal(match.view().canStart, true);
  assert.equal(match.start(), true);
  assert.equal(match.start(), false);
  assert.equal(match.settings(MATCH_MODE.SCORE, 3), false);
});

test('the countdown lasts 3 s, then playing with a serve', () => {
  const match = createMatch({ rng: () => 0 });
  match.start(BOTH);
  assert.equal(match.view().phase, PHASE.COUNTDOWN);
  assert.equal(match.view().countdown, COUNTDOWN_S);
  assert.deepEqual(run(match, COUNTDOWN_S - DT), []);
  assert.equal(match.view().countdown, 1);
  assert.deepEqual(match.step(DT), [{ type: CHANGE.PHASE, phase: PHASE.PLAYING }, { type: CHANGE.SERVE, toward: TEAM.LEFT }]);
  assert.equal(match.view().countdown, null);
});

test('a goal scores +1, holds phase goal for 1.5 s, then serves toward the team that conceded', () => {
  const match = playing();
  assert.deepEqual(match.step(DT, LEFT_SCORES), [{ type: CHANGE.PHASE, phase: PHASE.GOAL }]);
  assert.deepEqual(match.view().score, { left: 1, right: 0 });
  assert.deepEqual(run(match, GOAL_PAUSE_S - DT), []);
  assert.deepEqual(match.step(DT), [{ type: CHANGE.PHASE, phase: PHASE.PLAYING }, { type: CHANGE.SERVE, toward: TEAM.RIGHT }]);
  match.step(DT, RIGHT_SCORES);
  run(match, GOAL_PAUSE_S);
  assert.deepEqual(match.view().score, { left: 1, right: 1 });
});

test('score mode ends when a team reaches the target; End goes to over with the leader or a draw', () => {
  const match = playing({ value: 2 });
  match.step(DT, RIGHT_SCORES);
  run(match, GOAL_PAUSE_S);
  assert.deepEqual(match.step(DT, RIGHT_SCORES), [{ type: CHANGE.PHASE, phase: PHASE.OVER }]);
  assert.equal(match.view().winner, TEAM.RIGHT);
  const ended = playing();
  assert.equal(ended.end(), true);
  assert.deepEqual(ended.view().phase, PHASE.OVER);
  assert.equal(ended.view().winner, DRAW);
  assert.equal(ended.end(), false);
  const leading = playing();
  leading.step(DT, LEFT_SCORES);
  leading.end();
  assert.equal(leading.view().winner, TEAM.LEFT);
});

test('time mode ends when the clock reaches 0', () => {
  const match = playing({ mode: MATCH_MODE.TIME, value: 1 });
  assert.equal(match.view().timeLeft, S_PER_MIN);
  match.step(DT, LEFT_SCORES);
  run(match, GOAL_PAUSE_S);
  run(match, S_PER_MIN - DT);
  assert.equal(match.view().phase, PHASE.PLAYING);
  assert.deepEqual(match.step(DT), [{ type: CHANGE.PHASE, phase: PHASE.OVER }]);
  assert.equal(match.view().timeLeft, 0);
  assert.equal(match.view().winner, TEAM.LEFT);
});

test('a tie at time-out plays on until the next goal wins', () => {
  const match = playing({ mode: MATCH_MODE.TIME, value: 1 });
  run(match, S_PER_MIN + 1);
  assert.equal(match.view().phase, PHASE.PLAYING);
  assert.equal(match.view().timeLeft, 0);
  assert.deepEqual(match.step(DT, RIGHT_SCORES), [{ type: CHANGE.PHASE, phase: PHASE.OVER }]);
  assert.equal(match.view().winner, TEAM.RIGHT);
});

test('pause freezes the clock; resume continues', () => {
  const match = playing({ mode: MATCH_MODE.TIME, value: 1 });
  assert.equal(match.resume(), false);
  assert.equal(match.pause(), true);
  assert.equal(match.pause(), false);
  const frozen = match.view().timeLeft;
  assert.deepEqual(run(match, 5), []);
  assert.equal(match.view().timeLeft, frozen);
  assert.equal(match.resume(), true);
  assert.equal(match.view().phase, PHASE.PLAYING);
  match.step(DT);
  assert.ok(Math.abs(match.view().timeLeft - (frozen - DT)) < EPS);
});

test('a 5 s dt is clamped: the clock drops at most 0.1 s', () => {
  const match = playing({ mode: MATCH_MODE.TIME, value: 1 });
  const before = match.view().timeLeft;
  match.step(5);
  assert.ok(before - match.view().timeLeft <= MATCH_DT_MAX + EPS);
  assert.ok(before - match.view().timeLeft > 0);
});

test('a team emptying while playing pauses; resume is refused until it has a player again', () => {
  const match = playing();
  match.teams({ [TEAM.LEFT]: 1, [TEAM.RIGHT]: 0 });
  assert.equal(match.view().phase, PHASE.PAUSED);
  assert.equal(match.resume(), false);
  match.teams(BOTH);
  assert.equal(match.resume(), true);
  match.step(DT, LEFT_SCORES);
  match.teams({ [TEAM.LEFT]: 0, [TEAM.RIGHT]: 1 });
  assert.equal(match.view().phase, PHASE.PAUSED);
  match.teams(BOTH);
  match.resume();
  assert.equal(match.view().phase, PHASE.GOAL);
  const counting = createMatch({ rng: () => 0 });
  counting.start(BOTH);
  counting.teams({ [TEAM.LEFT]: 1 });
  assert.equal(counting.view().phase, PHASE.PAUSED);
  const lobby = createMatch({ rng: () => 0 });
  lobby.teams({ [TEAM.LEFT]: 1 });
  assert.equal(lobby.view().phase, PHASE.LOBBY);
  const over = playing();
  over.end();
  over.teams({ [TEAM.LEFT]: 1 });
  assert.equal(over.view().phase, PHASE.OVER);
});

test('the first serve direction comes from the injected rng', () => {
  for (const [r, toward] of [[0.1, TEAM.LEFT], [0.9, TEAM.RIGHT]]) {
    const match = createMatch({ rng: () => r });
    match.start(BOTH);
    assert.deepEqual(run(match, COUNTDOWN_S).at(-1), { type: CHANGE.SERVE, toward });
  }
});

test('again keeps the teams and resets the score; toLobby returns to the lobby', () => {
  const match = playing({ value: 1 });
  assert.equal(match.again(), false);
  match.step(DT, LEFT_SCORES);
  assert.equal(match.view().phase, PHASE.OVER);
  assert.equal(match.again(), true);
  assert.deepEqual(match.view().score, { left: 0, right: 0 });
  assert.equal(match.view().phase, PHASE.COUNTDOWN);
  assert.equal(match.view().canStart, true);
  match.end();
  match.teams({ [TEAM.RIGHT]: 1 });
  assert.equal(match.again(), false);
  assert.equal(match.toLobby(), true);
  assert.equal(match.view().phase, PHASE.LOBBY);
  assert.equal(match.view().settings.value, 1);
});
