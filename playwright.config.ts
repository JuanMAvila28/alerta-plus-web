import { defineConfig, devices } from '@playwright/test';

// End-to-end tests (plan phase 7) against the production build, with its own Worker and database.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4180',
    ...devices['Pixel 7'],
    locale: 'es-CO',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'sh e2e/start-api.sh',
      url: 'http://localhost:8790/api/documents',
      // Any answer (401) means it is up.
      ignoreHTTPSErrors: true,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command:
        'VITE_GOOGLE_CLIENT_ID=e2e-client.apps.googleusercontent.com VITE_GOOGLE_LOGIN_URI= npx vite build --outDir dist-e2e --emptyOutDir && API_URL=http://localhost:8790 npx vite preview --outDir dist-e2e --port 4180 --strictPort',
      url: 'http://localhost:4180',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
