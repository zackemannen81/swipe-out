import { resolve } from 'node:path';
import { defineConfig } from 'vite';
const WS_PROXY_TARGET = process.env.VITE_WS_PROXY_TARGET ?? 'http://127.0.0.1:8787';

const wsProxy = {
  '/ws': {
    target: WS_PROXY_TARGET,
    ws: true,
    changeOrigin: true,
  },
};

export default defineConfig({
    base: './',
  server: {
    port: 5173,
    host: true,
    open: true,
    allowedHosts: ['bkp.audioleaf.se', '.audioleaf.se'],
    proxy: wsProxy,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        editor: resolve(__dirname, 'editor.html'),
      },
    },
  },
});
