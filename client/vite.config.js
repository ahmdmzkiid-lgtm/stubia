import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // In development, read .env from parent directory (monorepo root)
  // In production (Vercel), env vars are injected by the platform
  envDir: mode === 'production' ? undefined : '../',
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
