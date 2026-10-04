import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const bypassServeSpa = () => (
  /** @param {import('http').IncomingMessage} req */
  (req) => {
    const accept = String(req.headers?.accept ?? '');
    const ct = String(req.headers?.['content-type'] ?? '');
    const auth = String(req.headers?.authorization ?? '');

    const isApiSignal = auth.startsWith('Bearer') || ct.includes('application/json') || accept.includes('application/json') || (req.method !== 'GET');
    const isBrowserPage = accept.includes('text/html') || accept.includes('application/xhtml+xml');

    if (isBrowserPage && !isApiSignal) {
      return '/index.html';
    }
    return undefined;
  }
);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    historyApiFallback: {
      disableDotRule: true,
    },
    proxy: {
      '/auth':          { target: 'http://localhost:3000', changeOrigin: true, bypass: bypassServeSpa() },
      '/employees':     { target: 'http://localhost:3000', changeOrigin: true, bypass: bypassServeSpa() },
      '/admin':         { target: 'http://localhost:3000', changeOrigin: true, bypass: bypassServeSpa() },
      '/attendance':    { target: 'http://localhost:3000', changeOrigin: true, bypass: bypassServeSpa() },
      '/uploads':       { target: 'http://localhost:3000', changeOrigin: true },
      '/api':           { target: 'http://localhost:3000', changeOrigin: true },
      '/api-json':      { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
