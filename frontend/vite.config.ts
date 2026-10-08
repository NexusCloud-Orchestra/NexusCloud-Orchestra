import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.PUBLIC_API_URL || 'http://localhost:7575',
          changeOrigin: true,
          secure: false,
        },
        '/health': {
          target: process.env.PUBLIC_API_URL || 'http://localhost:7575',
          changeOrigin: true,
          secure: false,
        },
      },
      // Avoid port 24678 collision with editor/daemon
      hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 24688 },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
