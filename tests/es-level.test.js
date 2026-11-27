// The TV runs about Chrome 69: every built script must parse at that ES level.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'acorn';
import { SITE_ROOT } from '../web/shared/constants.js';

// ES2019, not 2018: the minifier emits optional catch binding (catch{), which Chrome 66+ supports.
const ES_LEVEL = 2019;
const ASSETS = join(SITE_ROOT, 'assets');

test('every built script parses at the TV\'s ES level', () => {
  const scripts = readdirSync(ASSETS).filter((name) => name.endsWith('.js'));
  assert.ok(scripts.length > 0, 'no built scripts: run vite build first');
  for (const name of scripts) {
    assert.doesNotThrow(() => parse(readFileSync(join(ASSETS, name), 'utf8'), { ecmaVersion: ES_LEVEL, sourceType: 'module' }), name);
  }
});
