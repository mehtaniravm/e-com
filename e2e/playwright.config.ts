import { defineConfig, devices } from '@playwright/test'

/**
 * Prerequisites before running:
 *   docker compose up -d          (PostgreSQL)
 *   cd user-service  && mvn spring-boot:run
 *   cd order-service && mvn spring-boot:run
 *   cd frontend      && npm run dev
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // Sequential — tests share a real DB and depend on seeded state
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 30_000,

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  reporter: [['list'], ['html', { open: 'never' }]],
})
