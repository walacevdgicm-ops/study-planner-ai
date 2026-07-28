import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': r('./src'),
      '@spa/shared-types': r('../../packages/shared-types/src/index.ts'),
      '@spa/ui-kit': r('../../packages/ui-kit/src/index.ts'),
    },
  },
  server: { port: 5173, host: true },
});
