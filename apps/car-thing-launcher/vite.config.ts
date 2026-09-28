import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { bridgething, daemonProxy } from './scripts/bridgething.ts';
import { videos } from './scripts/videos.ts';

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss(), bridgething(), videos('videos')],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    host: true,
    proxy: await daemonProxy(),
  },
}));
