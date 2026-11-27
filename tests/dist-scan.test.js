// The site loads nothing from another host: no http:// or https:// URL in the build but the server's own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_ROOT, LOCALHOST } from '../web/shared/constants.js';
import { URL_PATTERN } from '../web/shared/webmcp-constants.js';

const files = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)]));

test('dist/ names no outside URL', () => {
  const all = files(SITE_ROOT);
  assert.ok(all.length > 0, 'no build: run vite build first');
  const outside = all.flatMap((f) => (readFileSync(f, 'latin1').match(URL_PATTERN) || [])
    .filter((url) => new URL(url).hostname !== LOCALHOST)
    .map((url) => `${f}: ${url}`));
  assert.deepEqual(outside, []);
});
