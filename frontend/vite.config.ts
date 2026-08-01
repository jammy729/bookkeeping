import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';

// Injects the frontend build metadata placeholders used by health.html
// (__GIT_COMMIT__, __BUILD_TIME__) at build time only.
function injectBuildMeta(): Plugin {
  return {
    name: 'inject-build-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const commit = process.env.GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown';
      return html
        .replace(/__GIT_COMMIT__/g, commit)
        .replace(/__BUILD_TIME__/g, new Date().toISOString());
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), injectBuildMeta()],
  envDir: '..',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    allowedHosts: ['admin.localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: [
      'bookkeeping-frontend-scey.onrender.com',
      'admin.localhost',
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        health: path.resolve(__dirname, 'health.html'),
      },
    },
  },
});
