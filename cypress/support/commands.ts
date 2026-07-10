/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login via API and store token in localStorage (bypasses UI login)
       */
      loginAs(email: string, password: string): Chainable<void>;
      /**
       * Register a new test user via API
       */
      registerUser(user: {
        email: string; password: string; name: string; city: string; state: string;
      }): Chainable<void>;
      /**
       * Clear all app state
       */
      clearAppState(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginAs', (email: string, password: string) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/login`, { email, password })
    .then(({ body }) => {
      window.localStorage.setItem(
        'fofa-auth',
        JSON.stringify({ state: { user: body.user, token: body.token }, version: 0 })
      );
    });
});

Cypress.Commands.add('registerUser', (user) => {
  cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, user);
});

Cypress.Commands.add('clearAppState', () => {
  cy.clearLocalStorage();
  cy.clearCookies();
});

// GitHub Pages serves a project site at a subpath with no server-side SPA
// rewrite, so a direct cy.visit() to any nested route (e.g. /dashboard)
// gets a real HTTP 404 for the initial document before public/404.html's
// client-side redirect can load the actual app. That 404 never happens
// during local/dev runs (baseUrl is localhost there), so it's safe to
// always tolerate it here and just wait for the app shell to mount.
Cypress.Commands.overwrite('visit', ((originalFn: any, url: any, options: any) => {
  return originalFn(url, { failOnStatusCode: false, ...options }).get('#root', { timeout: 10000 });
}) as any);

export {};
