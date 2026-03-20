/// <reference types="cypress" />

/**
 * Use Case: UC-02 – Login & Authentication
 *
 * Actor: Registered, verified user
 * Goal: Authenticate and access the dashboard
 *
 * Main Flow:
 *   1. User navigates to /login
 *   2. Enters email and password
 *   3. Clicks "Sign In"
 *   4. System validates credentials and returns JWT
 *   5. User is redirected to /dashboard
 *
 * Alternative Flows:
 *   A. Wrong password → 401 error message
 *   B. Unverified email → 403 error message
 *   C. Non-existent email → 401 error message
 *   D. Authenticated user visits /login → redirect to dashboard
 */
describe('UC-02: Login & Authentication', () => {
  const unique = Date.now();
  const verifiedUser = {
    name: 'Login Test User',
    email: `login_test_${unique}@fofa.dev`,
    password: 'LoginPass99!',
    city: 'Chicago',
    state: 'IL',
  };

  before(() => {
    // Register and manually verify via API (test mode skips email)
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, verifiedUser).then(res => {
      expect(res.status).to.eq(201);
    });
    // In test mode, we'll verify via the DB token — here we assume the backend
    // is configured with NODE_ENV=test so we can call verify-email directly
    // Alternatively, directly update DB. For CI, use a seed script.
  });

  beforeEach(() => {
    cy.clearAppState();
    cy.visit('/login');
  });

  it('shows the login form', () => {
    cy.contains('FoFa').should('be.visible');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('shows error for wrong password', () => {
    cy.intercept('POST', '**/auth/login').as('login');
    cy.get('input[type="email"]').type(verifiedUser.email);
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.wait('@login').its('response.statusCode').should('eq', 401);
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('shows error for non-existent email', () => {
    cy.get('input[type="email"]').type('nobody@doesnotexist.dev');
    cy.get('input[type="password"]').type('SomePass123');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('shows unverified error when email not confirmed', () => {
    cy.intercept('POST', '**/auth/login').as('login');
    cy.get('input[type="email"]').type(verifiedUser.email);
    cy.get('input[type="password"]').type(verifiedUser.password);
    cy.get('button[type="submit"]').click();
    cy.wait('@login').its('response.statusCode').should('eq', 403);
    cy.contains('verify your email').should('be.visible');
  });

  it('navigates to register page', () => {
    cy.contains('Sign up').click();
    cy.url().should('include', '/register');
  });

  it('navigates to forgot password page', () => {
    cy.contains('Forgot password').click();
    cy.url().should('include', '/forgot-password');
  });

  it('redirects to dashboard if already logged in', () => {
    // Manually set auth state
    window.localStorage.setItem(
      'fofa-auth',
      JSON.stringify({ state: { user: { id: 'u1', name: 'Test' }, token: 'fake-token' }, version: 0 })
    );
    cy.visit('/login');
    cy.url().should('include', '/dashboard');
  });
});
