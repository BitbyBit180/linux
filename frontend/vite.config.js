import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['unregenerable-booker-subsibilantly.ngrok-free.dev'],
    proxy: {
      // Frontend calls /api/... -> Express backend on :5000 (see backend/)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});