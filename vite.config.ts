import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  // 本地開發 / 預覽用 './'；GitHub Pages deploy 時 actions/configure-pages 會
  // 把 repo 的 base path（例如 '/farm-futures/'）注入 VITE_BASE_PATH。
  base: process.env.VITE_BASE_PATH || './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    host: true,
  },
});
