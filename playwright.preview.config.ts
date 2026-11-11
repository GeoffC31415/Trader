import { defineConfig } from '@playwright/test';
import smoke from './playwright.config';

export default defineConfig({
  ...smoke,
  testMatch: 'readiness.spec.ts',
  use: { ...smoke.use, baseURL: 'http://127.0.0.1:4175' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175', reuseExistingServer: false,
  },
});
