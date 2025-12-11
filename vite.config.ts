import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Use polling for WSL on Windows-mounted volumes (/mnt/d)
      usePolling: true,
      interval: 300, // Poll every 300ms
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});


