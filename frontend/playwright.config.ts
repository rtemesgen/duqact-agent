import { defineConfig, devices } from '@playwright/test';

const backendCommand = "powershell -Command \"cd 'E:\\satesoft\\mobile-agent-custom\\backend'; $env:SPRING_PROFILES_ACTIVE='dev'; $env:PORT='18080'; $env:CORS_ALLOWED_ORIGIN='http://127.0.0.1:4173'; gradle bootRun\"";
const frontendCommand = "powershell -Command \"cd 'E:\\satesoft\\mobile-agent-custom\\frontend'; $env:VITE_API_URL='http://127.0.0.1:18080/api'; npm run dev -- --host 127.0.0.1 --port 4173\"";

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    channel: 'chrome',
    viewport: { width: 1440, height: 1024 },
  },
  webServer: [
    {
      command: backendCommand,
      url: 'http://127.0.0.1:18080/api/auth/login',
      reuseExistingServer: false,
      timeout: 180000,
    },
    {
      command: frontendCommand,
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: 'chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
