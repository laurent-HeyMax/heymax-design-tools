import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src/ui',
  envDir: resolve(__dirname),
  envPrefix: ['VITE_', 'REPLICATE_'],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/ui'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    target: 'es2017',
    rollupOptions: {
      input: resolve(__dirname, 'src/ui/ui.html'),
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});
