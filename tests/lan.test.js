import { test } from 'node:test';
import assert from 'node:assert/strict';
import { baseUrl } from '../server/lan.js';
import { DEFAULT_PORT } from '../web/shared/constants.js';

const LOOPBACK = { lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }] };
const LAN = {
  ...LOOPBACK,
  eth0: [
    { address: 'fe80::1', family: 'IPv6', internal: false },
    { address: '192.168.1.20', family: 'IPv4', internal: false },
  ],
};

test('PUBLIC_URL wins over the LAN address', () => {
  assert.equal(baseUrl({ PUBLIC_URL: 'https://pong.example' }, LAN, DEFAULT_PORT), 'https://pong.example');
  assert.equal(baseUrl({ PUBLIC_URL: 'https://pong.example/' }, LAN, DEFAULT_PORT), 'https://pong.example');
});

test('the first non-internal IPv4 address is used with the port', () => {
  assert.equal(baseUrl({}, LAN, DEFAULT_PORT), `http://192.168.1.20:${DEFAULT_PORT}`);
});

test('without a LAN address the base is localhost', () => {
  assert.equal(baseUrl({}, LOOPBACK, DEFAULT_PORT), `http://localhost:${DEFAULT_PORT}`);
  assert.equal(baseUrl({}, LOOPBACK), 'http://localhost');
});
