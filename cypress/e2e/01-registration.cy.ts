/// <reference types="cypress" />

/**
 * Use Case: UC-01 – User Registration
 *
 * Actor: New visitor
 * Goal: Create a verified FoFa account
 *
 * Main Flow:
 *   1. Visitor navigates to /register
 *   2. Fills in name, email, city, state, password
 *   3. Submits the form
 *   4. System shows "check your email" confirmation
 *   5. (In test mode) email token is verified via API
 *   6. User can now log in
 *
 * Alternative Flows:
 *   A. Duplicate email → show 409 error
 *   B. Password mismatch → inline validation error
 *   C. Missing required fields → HTML5 / inline validation
 */
describe('UC-01: User Registration', () => {
  const unique = Date.now();
  const user = {
    name: 'Test User',
    email: `testuser_${unique}@fofa.dev`,
    password: 'SecurePass99!',
    city: 'Austin',
    state: 'TX',
  };

  beforeEach(() => {
    cy.clearAppState();
    cy.visit('/register');
  });

  it('displays the registration form', () => {
    cy.contains('Join FoFa').should('be.visible');
    cy.get('input[placeholder="Jane Smith"]').should('exist');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[placeholder="Your city"]').should('exist');
    cy.get('select').should('exist');
    cy.get('input[type="password"]').should('have.length', 2);
  });

  it('shows inline error when passwords do not match', () => {
    cy.get('input[placeholder="Jane Smith"]').type(user.name);
    cy.get('input[type="email"]').type(user.email);
    cy.get('input[placeholder="Your city"]').type(user.city);
    cy.get('select').select(user.state);
    cy.get('input[placeholder="At least 8 characters"]').type(user.password);
    cy.get('input[placeholder="Repeat password"]').type('WrongPassword!');
    cy.get('button[type="submit"]').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('shows error for short password', () => {
    cy.get('input[placeholder="Jane Smith"]').type(user.name);
    cy.get('input[type="email"]').type(user.email);
    cy.get('input[placeholder="Your city"]').type(user.city);
    cy.get('select').select(user.state);
    cy.get('input[placeholder="At least 8 characters"]').type('short');
    cy.get('input[placeholder="Repeat password"]').type('short');
    cy.get('button[type="submit"]').click();
    cy.contains('Minimum 8 characters').should('be.visible');
  });

  it('successfully submits registration and shows confirmation', () => {
    cy.intercept('POST', '**/auth/register').as('register');

    cy.get('input[placeholder="Jane Smith"]').type(user.name);
    cy.get('input[type="email"]').type(user.email);
    cy.get('input[placeholder="Your city"]').type(user.city);
    cy.get('select').select(user.state);
    cy.get('input[placeholder="At least 8 characters"]').type(user.password);
    cy.get('input[placeholder="Repeat password"]').type(user.password);
    cy.get('button[type="submit"]').click();

    cy.wait('@register').its('response.statusCode').should('eq', 201);
    cy.contains('Check your email').should('be.visible');
    cy.contains('verification link').should('be.visible');
  });

  it('shows duplicate email error for existing account', () => {
    // Register first
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, user).then(() => {
      cy.visit('/register');
      cy.get('input[placeholder="Jane Smith"]').type('Another User');
      cy.get('input[type="email"]').type(user.email);
      cy.get('input[placeholder="Your city"]').type('Denver');
      cy.get('select').select('CO');
      cy.get('input[placeholder="At least 8 characters"]').type(user.password);
      cy.get('input[placeholder="Repeat password"]').type(user.password);
      cy.get('button[type="submit"]').click();
      cy.contains('already registered', { matchCase: false }).should('be.visible');
    });
  });

  it('navigates to login page from registration link', () => {
    cy.contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});
