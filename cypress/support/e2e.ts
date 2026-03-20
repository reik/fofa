import './commands';

// Suppress uncaught exceptions from the app during tests
Cypress.on('uncaught:exception', (_err, _runnable) => false);

beforeEach(() => {
  // Intercept any unhandled errors from hot-toast or other libraries
});
