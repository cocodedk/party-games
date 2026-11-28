// Who scored: each goal goes to the player whose bat last hit the ball; a last hit by the
// conceding team is an own goal. A goal nobody touched (a serve straight in) has no scorer.
import { TEAMS, EVENT, SCREEN_TEXT } from '../../shared/constants.js';

export function createScorers() {
  let last = null; // the bat that last hit the ball in play
  let tally = null; // per team: own and name → { name, own, goals }, in first-scored order

  function reset() {
    last = null;
    tally = {};
    for (const team of TEAMS) tally[team] = new Map();
  }
  reset();

  /** events: stepWorld's; bats: id → bat ({ name, team }), read at the hit so a scorer who leaves stays listed. */
  function step(events, bats) {
    for (const e of events) {
      if (e.type === EVENT.HIT) last = bats.get(e.id);
      if (e.type !== EVENT.GOAL) continue;
      if (last) {
        const own = last.team !== e.side;
        const key = `${own}:${last.name}`;
        const seen = tally[e.side].get(key) ?? { name: last.name, own, goals: 0 };
        seen.goals += 1;
        tally[e.side].set(key, seen);
      }
      last = null;
    }
  }

  /** Per team, the lines to show: one per scorer, most goals first, own goals apart. */
  function lines() {
    const out = {};
    for (const team of TEAMS) {
      out[team] = [...tally[team].values()].sort((a, b) => b.goals - a.goals).map((s) => SCREEN_TEXT.SCORER(s.name, s.goals, s.own));
    }
    return out;
  }

  return { reset, step, lines };
}
