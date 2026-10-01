import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env['CI'] ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] || 'http://127.0.0.1:4201',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.env['CI'] ? undefined : 'chrome' },
    },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : [
        {
          command: 'node e2e/start-api.cjs',
          url: 'http://127.0.0.1:3001/api/health',
          reuseExistingServer: false,
        },
        {
          command: 'ng serve --host 127.0.0.1 --port 4201 --proxy-config e2e/proxy.conf.json',
          url: 'http://127.0.0.1:4201',
          reuseExistingServer: false,
        },
      ],
});
