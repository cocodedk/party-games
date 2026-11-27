import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import stylex from '@stylexjs/unplugin';

const page = (name) => fileURLToPath(new URL(`web/${name}.html`, import.meta.url));

export default defineConfig({
  root: 'web',
  plugins: [stylex.vite()],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'chrome69',
    rollupOptions: { input: { index: page('index'), screen: page('screen') } },
  },
});
