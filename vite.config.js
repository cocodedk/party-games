import { defineConfig } from 'vite';
import stylex from '@stylexjs/unplugin';

export default defineConfig({
  root: 'web',
  plugins: [stylex.vite()],
  build: { outDir: '../dist', emptyOutDir: true, target: 'chrome69' },
});
