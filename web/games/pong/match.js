// Match rules: phases, score, clock, end and serve. The caller steps physics only in PHASE.PLAYING
// and serves a new ball when step() returns a CHANGE.SERVE.
import {
  TEAM, TEAMS, EVENT, PHASE, MATCH_MODE, MATCH_RANGE, MATCH_DEFAULTS, COUNTDOWN_S, GOAL_PAUSE_S, MATCH_DT_MAX,
  S_PER_MIN, CHANGE, DRAW, FIRST_SERVE_LEFT_BELOW,
} from '../../shared/constants.js';

const ACTIVE = [PHASE.COUNTDOWN, PHASE.PLAYING, PHASE.GOAL]; // phases a pause or End can interrupt
const other = (team) => (team === TEAM.LEFT ? TEAM.RIGHT : TEAM.LEFT);
const zero = () => ({ [TEAM.LEFT]: 0, [TEAM.RIGHT]: 0 });

/** rng() → [0, 1) picks the first serve's direction. */
export function createMatch({ rng }) {
  const rules = { ...MATCH_DEFAULTS };
  let counts = zero();
  let phase = PHASE.LOBBY;
  let resumeTo = null; // the phase a pause interrupted
  let timer = 0; // seconds left in countdown or goal
  let score = zero();
  let timeLeft = null; // seconds, time mode only
  let serveToward = null;

  const canStart = () => TEAMS.every((t) => counts[t] > 0);
  const timed = () => rules.mode === MATCH_MODE.TIME;

  /** Ignores an unknown mode or a value that is not a whole number in the mode's range; only in the lobby. */
  function settings(mode, value) {
    const range = Object.hasOwn(MATCH_RANGE, mode) && MATCH_RANGE[mode];
    if (phase !== PHASE.LOBBY || !range || !Number.isInteger(value) || value < range.min || value > range.max) return false;
    Object.assign(rules, { mode, value });
    return true;
  }

  /** The players per team, {left, right}; a team emptying mid-match pauses it. */
  function teams(next) {
    counts = { ...zero(), ...next };
    if (!canStart() && ACTIVE.includes(phase)) pause();
  }

  function begin() {
    score = zero();
    timeLeft = timed() ? rules.value * S_PER_MIN : null;
    serveToward = rng() < FIRST_SERVE_LEFT_BELOW ? TEAM.LEFT : TEAM.RIGHT;
    timer = COUNTDOWN_S;
    phase = PHASE.COUNTDOWN;
  }

  function start(teamCounts) {
    if (phase !== PHASE.LOBBY) return false;
    if (teamCounts) counts = { ...zero(), ...teamCounts };
    if (!canStart()) return false;
    begin();
    return true;
  }

  function pause() {
    if (!ACTIVE.includes(phase)) return false;
    resumeTo = phase;
    phase = PHASE.PAUSED;
    return true;
  }

  function resume() {
    if (phase !== PHASE.PAUSED || !canStart()) return false;
    phase = resumeTo;
    return true;
  }

  function end() {
    if (!ACTIVE.includes(phase) && phase !== PHASE.PAUSED) return false;
    phase = PHASE.OVER;
    return true;
  }

  function again() {
    if (phase !== PHASE.OVER || !canStart()) return false;
    begin();
    return true;
  }

  function toLobby() {
    phase = PHASE.LOBBY;
    score = zero();
    timeLeft = null;
    return true;
  }

  /** Advances the match by dt seconds (at most MATCH_DT_MAX) given stepWorld's events; returns the changes. */
  function step(dt, events = []) {
    const before = phase;
    const changes = [];
    const t = Math.min(dt, MATCH_DT_MAX);
    if (phase === PHASE.COUNTDOWN || phase === PHASE.GOAL) {
      timer -= t;
      if (timer <= 0) {
        phase = PHASE.PLAYING;
        changes.push({ type: CHANGE.SERVE, toward: serveToward });
      }
    } else if (phase === PHASE.PLAYING) {
      const goal = events.find((e) => e.type === EVENT.GOAL);
      if (goal) scoreGoal(goal.side);
      else if (timed() && timeLeft > 0) {
        timeLeft = Math.max(0, timeLeft - t);
        if (timeLeft === 0 && score[TEAM.LEFT] !== score[TEAM.RIGHT]) phase = PHASE.OVER;
      }
    }
    if (phase !== before) changes.unshift({ type: CHANGE.PHASE, phase });
    return changes;
  }

  function scoreGoal(team) {
    score[team] += 1;
    const won = timed() ? timeLeft === 0 : score[team] >= rules.value;
    if (won) {
      phase = PHASE.OVER;
      return;
    }
    phase = PHASE.GOAL;
    timer = GOAL_PAUSE_S;
    serveToward = other(team);
  }

  function winner() {
    if (phase !== PHASE.OVER) return null;
    const diff = score[TEAM.LEFT] - score[TEAM.RIGHT];
    return diff === 0 ? DRAW : diff > 0 ? TEAM.LEFT : TEAM.RIGHT;
  }

  function view() {
    return { phase, score: { ...score }, timeLeft, settings: { ...rules }, canStart: canStart(), winner: winner() };
  }

  return { settings, teams, start, pause, resume, end, again, toLobby, step, view };
}
