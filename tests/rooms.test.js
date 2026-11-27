import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRooms } from '../server/rooms.js';
import {
  ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, MAX_PER_TEAM, NAME_MAX, TEAM, JOIN_ERROR, MASTER_HOST,
} from '../web/shared/constants.js';

const CREATES = 200;

test('codes are 4 letters from the alphabet and unique across 200 creates', () => {
  const rooms = createRooms();
  const codes = new Set();
  for (let i = 0; i < CREATES; i++) {
    const code = rooms.create();
    assert.equal(code.length, ROOM_CODE_LENGTH);
    for (const ch of code) assert.ok(ROOM_CODE_ALPHABET.includes(ch), code);
    codes.add(code);
  }
  assert.equal(codes.size, CREATES);
});

test('join gives an id and colour, trims the name; leave and remove clear state', () => {
  const rooms = createRooms();
  const code = rooms.create();
  const a = rooms.join(code, { name: '  Ann  ', team: TEAM.LEFT });
  const b = rooms.join(code, { name: 'Bo', team: TEAM.RIGHT });
  assert.equal(a.ok, true);
  assert.notEqual(a.id, b.id);
  assert.notEqual(a.color, b.color);
  assert.equal(rooms.get(code).players.get(a.id).name, 'Ann');
  rooms.leave(code, a.id);
  assert.equal(rooms.get(code).players.has(a.id), false);
  rooms.remove(code);
  assert.equal(rooms.get(code), undefined);
});

test('a team other than left or right is bad-team', () => {
  const rooms = createRooms();
  const code = rooms.create();
  assert.deepEqual(rooms.join(code, { name: 'Ann', team: 'middle' }), { ok: false, reason: JOIN_ERROR.BAD_TEAM });
});

test('the fifth player on a team is team-full', () => {
  const rooms = createRooms();
  const code = rooms.create();
  for (let i = 0; i < MAX_PER_TEAM; i++) {
    assert.equal(rooms.join(code, { name: `P${i}`, team: TEAM.LEFT }).ok, true);
  }
  assert.deepEqual(rooms.join(code, { name: 'Extra', team: TEAM.LEFT }), { ok: false, reason: JOIN_ERROR.TEAM_FULL });
  assert.equal(rooms.join(code, { name: 'Other', team: TEAM.RIGHT }).ok, true);
});

test('an unknown code is no-room', () => {
  const rooms = createRooms();
  assert.deepEqual(rooms.join('ZZZZ', { name: 'Ann', team: TEAM.LEFT }), { ok: false, reason: JOIN_ERROR.NO_ROOM });
});

test('an empty or 17-character name is bad-name', () => {
  const rooms = createRooms();
  const code = rooms.create();
  const bad = { ok: false, reason: JOIN_ERROR.BAD_NAME };
  assert.deepEqual(rooms.join(code, { name: '   ', team: TEAM.LEFT }), bad);
  assert.deepEqual(rooms.join(code, { name: 'x'.repeat(NAME_MAX + 1), team: TEAM.LEFT }), bad);
  assert.equal(rooms.join(code, { name: 'x'.repeat(NAME_MAX), team: TEAM.LEFT }).ok, true);
});

test('the first phone is master; a room without phones has none', () => {
  const rooms = createRooms();
  const code = rooms.create();
  assert.equal(rooms.master(code), undefined);
  const a = rooms.join(code, { name: 'Ann', team: TEAM.LEFT });
  rooms.join(code, { name: 'Bo', team: TEAM.RIGHT });
  assert.equal(rooms.master(code), a.id);
  assert.equal(rooms.master('ZZZZ'), undefined);
});

test('the master leaving passes the role to the next phone in join order', () => {
  const rooms = createRooms();
  const code = rooms.create();
  const [a, b, c] = ['Ann', 'Bo', 'Cy'].map((name) => rooms.join(code, { name, team: TEAM.LEFT }));
  rooms.leave(code, b.id);
  assert.equal(rooms.master(code), a.id);
  rooms.leave(code, a.id);
  assert.equal(rooms.master(code), c.id);
  assert.deepEqual(rooms.host('ZZZZ'), { ok: false, reason: JOIN_ERROR.NO_ROOM });
  const h1 = rooms.host(code);
  const h2 = rooms.host(code);
  assert.equal(h1.ok, true);
  assert.equal(rooms.master(code), MASTER_HOST);
  assert.deepEqual(rooms.get(code).hosts, [h1.id, h2.id]);
  rooms.leave(code, h2.id);
  assert.deepEqual(rooms.get(code).hosts, [h1.id]);
  rooms.leave(code, h1.id);
  assert.equal(rooms.master(code), c.id);
  rooms.leave('ZZZZ', c.id);
});
