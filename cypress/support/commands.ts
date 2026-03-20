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

export {};
