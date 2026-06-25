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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-router')) {
              return 'vendor-core';
            }
            if (id.includes('katex') || id.includes('react-katex')) {
              return 'vendor-math';
            }
            if (id.includes('xlsx') || id.includes('papaparse')) {
              return 'vendor-excel';
            }
            return 'vendor-others';
          }
        },
      },
    },
  },
}));
