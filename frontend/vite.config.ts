import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

declare const process: any;

const isDocker = typeof process !== 'undefined' && process.platform === 'linux';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: isDocker ? 'http://backend:3000' : 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
