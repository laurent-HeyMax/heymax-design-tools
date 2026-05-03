import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname), ['UI_CDN_']);
  return {
    resolve: {
      alias: {
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    define: {
      __UI_CDN_URL__: JSON.stringify(env.UI_CDN_URL ?? ''),
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      target: 'es2017',
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/main/code.ts'),
        formats: ['iife'],
        name: 'plugin',
        fileName: () => 'code.js',
      },
      rollupOptions: {
        output: {
          extend: true,
        },
      },
    },
  };
});
