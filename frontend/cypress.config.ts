import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on) {
      on('before:browser:launch', (_browser, launchOptions) => {
        launchOptions.args.push('--disable-gpu');
        launchOptions.args.push('--disable-software-rasterizer');
        launchOptions.args.push('--no-sandbox');
        return launchOptions;
      });
    },
    baseUrl: 'http://localhost:5174',
    specPattern: '../cypress/e2e/**/*.cy.ts',
    supportFile: '../cypress/support/e2e.ts',
    fixturesFolder: '../cypress/fixtures',
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:4000/api',
    },
  },
});
