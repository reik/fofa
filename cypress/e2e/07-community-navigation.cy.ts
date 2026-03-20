/// <reference types="cypress" />

/**
 * Use Case: UC-07 – Community Discovery & Navigation
 *
 * Actor: Authenticated user
 * Goal: Discover other foster families and navigate the application
 *
 * Main Flow:
 *   1. User navigates to /community
 *   2. Sees list of community members
 *   3. Searches by name or location
 *   4. Clicks Message on a member card → redirected to /messages
 *
 * Additional Navigation Cases:
 *   - Unauthenticated user → redirected to /login
 *   - Logout via navbar dropdown → redirected to /login
 */
describe('UC-07: Community & Navigation', () => {
  const members = [
    { id: 'u2', name: 'Alice Johnson', city: 'Denver', state: 'CO', thumbnail: null, email: 'alice@test.com', verified: true },
    { id: 'u3', name: 'Carlos Rivera', city: 'Miami', state: 'FL', thumbnail: null, email: 'carlos@test.com', verified: true },
    { id: 'u4', name: 'Sarah Kim', city: 'Boston', state: 'MA', thumbnail: null, email: 'sarah@test.com', verified: true },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: members }).as('searchMembers');
    cy.intercept('GET', '**/users/me', {
      statusCode: 200,
      body: { id: 'current-user', name: 'Jane', email: 'jane@test.com', city: 'LA', state: 'CA', thumbnail: null, verified: true },
    });

    window.localStorage.setItem(
      'fofa-auth',
      JSON.stringify({
        state: {
          user: { id: 'current-user', name: 'Jane', email: 'jane@test.com', city: 'LA', state: 'CA', thumbnail: null },
          token: 'test-token',
        },
        version: 0,
      })
    );

    cy.visit('/community');
    cy.wait('@searchMembers');
  });

  it('shows the community page with all members', () => {
    cy.contains('Community').should('be.visible');
    cy.contains('Alice Johnson').should('be.visible');
    cy.contains('Carlos Rivera').should('be.visible');
    cy.contains('Sarah Kim').should('be.visible');
  });

  it('shows location for each member', () => {
    cy.contains('Denver, CO').should('be.visible');
    cy.contains('Miami, FL').should('be.visible');
  });

  it('filters members via search input', () => {
    cy.intercept('GET', '**/users/search*q=Alice*', {
      statusCode: 200,
      body: [members[0]],
    }).as('searchAlice');

    cy.get('input[placeholder*="Search"]').type('Alice');
    cy.wait('@searchAlice');
    cy.contains('Alice Johnson').should('be.visible');
  });

  it('shows Message button on each member card', () => {
    cy.contains('💬 Message').should('be.visible');
  });

  it('clicking Message navigates to messages page', () => {
    cy.contains('💬 Message').first().click();
    cy.url().should('include', '/messages');
  });

  it('shows empty state when no members found', () => {
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: [] }).as('emptySearch');
    cy.get('input[placeholder*="Search"]').clear().type('zzz-nobody');
    cy.wait('@emptySearch');
    cy.contains('No members found').should('be.visible');
  });
});

describe('UC-07b: Route Protection & Logout', () => {
  it('redirects unauthenticated users from /dashboard to /login', () => {
    cy.clearAppState();
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('redirects unauthenticated users from /family to /login', () => {
    cy.clearAppState();
    cy.visit('/family');
    cy.url().should('include', '/login');
  });

  it('logs out user and redirects to login', () => {
    window.localStorage.setItem(
      'fofa-auth',
      JSON.stringify({
        state: {
          user: { id: 'u1', name: 'Jane', email: 'jane@test.com', city: 'LA', state: 'CA', thumbnail: null },
          token: 'test-token',
        },
        version: 0,
      })
    );

    cy.intercept('GET', '**/announcements*', {
      statusCode: 200,
      body: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
    });
    cy.intercept('GET', '**/family', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });
    cy.intercept('GET', '**/users/me', {
      statusCode: 200,
      body: { id: 'u1', name: 'Jane', email: 'jane@test.com', city: 'LA', state: 'CA', thumbnail: null, verified: true },
    });

    cy.visit('/dashboard');
    cy.contains('Jane').first().click();
    cy.contains('Sign out').click();
    cy.url().should('include', '/login');
  });
});
