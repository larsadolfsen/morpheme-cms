import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@interstellarcms/cms': fileURLToPath(
          new URL('../src/index.ts', import.meta.url)
        ),
      },
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  },
});