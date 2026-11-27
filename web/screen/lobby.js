// The lobby: QR code, room code, join URL and each team's player list.
import * as stylex from '@stylexjs/stylex';
import { styles } from './styles.js';
import { TEAMS, TEAM, TEAM_NAME, QR_PATH, ROOM_PARAM, SCREEN_TEXT } from '../shared/constants.js';

const byId = (id) => document.getElementById(id);

/** Sets the StyleX classes (and dynamic style variables) of a node. */
export function apply(node, ...looks) {
  const { className, style } = stylex.props(...looks);
  node.className = className || '';
  for (const key in style) node.style.setProperty(key, style[key]);
}

export function createLobby() {
  const root = byId('lobby');
  const players = new Map(); // id → {team, item}
  const lists = {};
  for (const team of TEAMS) {
    const section = byId(`team-${team}`);
    const [name, list] = section.children;
    name.textContent = TEAM_NAME[team];
    apply(section, styles.team, team === TEAM.RIGHT && styles.teamRight);
    apply(name, styles.teamName);
    apply(list, styles.list);
    lists[team] = list;
  }
  for (const id of ['join', 'qr', 'joinText', 'codeLabel', 'code', 'url']) apply(byId(id), styles[id]);

  function refresh(team) {
    const list = lists[team];
    const empty = list.querySelector('[data-empty]');
    const has = [...players.values()].some((p) => p.team === team);
    if (has && empty) empty.remove();
    if (!has && !empty) {
      const item = document.createElement('li');
      item.dataset.empty = '';
      item.textContent = SCREEN_TEXT.EMPTY_TEAM;
      apply(item, styles.player, styles.empty);
      list.appendChild(item);
    }
  }

  return {
    show(room, base) {
      byId('qr').src = `${QR_PATH}?${ROOM_PARAM}=${encodeURIComponent(room)}`;
      byId('code').textContent = room;
      byId('url').textContent = `${base}/?${ROOM_PARAM}=${room}`;
      TEAMS.forEach(refresh);
      apply(root, styles.lobby);
      root.hidden = false;
    },
    add({ id, name, team, color }) {
      const item = document.createElement('li');
      item.textContent = name;
      apply(item, styles.player, styles.playerColor(color));
      lists[team].appendChild(item);
      players.set(id, { team, item });
      refresh(team);
    },
    remove(id) {
      const p = players.get(id);
      if (!p) return;
      p.item.remove();
      players.delete(id);
      refresh(p.team);
    },
    destroy() {
      root.remove();
    },
  };
}
