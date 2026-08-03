import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Avoids CORS friction in dev; the client calls /api/... directly
      // and Vite forwards it to the Express server.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Lead attachment files (see server/src/app.js static serving).
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
