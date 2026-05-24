import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/fofa/',
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5170,
    proxy: { '/api': 'http://localhost:4005', '/uploads': 'http://localhost:4005' },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: { provider: 'v8', reporter: ['text', 'lcov'] },
  },
});
