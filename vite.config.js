import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    outDir: 'public',
    emptyOutDir: false,
  },

  server: {
    port: 5173,
    host: true,

    hmr: {
        host: '10.212.1.6',
        port: 5173,
    },

    proxy: {
      '/api': {
        target: 'http://localhost:3000',
      },

      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },

});
