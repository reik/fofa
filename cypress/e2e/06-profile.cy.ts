/// <reference types="cypress" />

/**
 * Use Case: UC-06 – Profile Management
 *
 * Actor: Authenticated user
 * Goal: Update personal profile information and photo
 *
 * Main Flow:
 *   1. User navigates to /profile (or via navbar dropdown)
 *   2. Sees current profile data pre-filled in form
 *   3. Updates name, city, state
 *   4. Optionally uploads a new profile photo
 *   5. Clicks Save Changes
 *   6. Success toast shown, navbar reflects updated name
 *
 * Alternative Flows:
 *   A. Empty name → validation error
 *   B. Empty city → validation error
 */
describe('UC-06: Profile Management', () => {
  const currentUser = {
    id: 'current-user', name: 'Jane Foster', email: 'jane@test.com',
    city: 'Los Angeles', state: 'CA', thumbnail: null, verified: true,
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    cy.intercept('GET', '**/users/me', { statusCode: 200, body: currentUser }).as('getMe');

    window.localStorage.setItem(
      'fofa-auth',
      JSON.stringify({
        state: { user: currentUser, token: 'test-token' },
        version: 0,
      })
    );

    cy.visit('/profile');
  });

  it('shows the profile edit form with pre-filled data', () => {
    cy.contains('Edit Profile').should('be.visible');
    cy.get('input').first().should('have.value', currentUser.name);
    cy.contains(currentUser.email).should('be.visible');
  });

  it('shows the current avatar/initials', () => {
    cy.contains('JF').should('be.visible'); // initials
  });

  it('shows change photo link', () => {
    cy.contains('Change profile photo').should('be.visible');
  });

  it('updates profile successfully', () => {
    cy.intercept('PUT', '**/users/me', {
      statusCode: 200,
      body: { ...currentUser, name: 'Jane Updated', city: 'San Francisco' },
    }).as('updateProfile');

    cy.get('input').first().clear().type('Jane Updated');
    cy.get('input[placeholder="Your city"]').clear().type('San Francisco');
    cy.contains('Save Changes').click();

    cy.wait('@updateProfile');
    cy.contains('Profile updated!').should('be.visible');
  });

  it('shows validation error when name is cleared', () => {
    cy.get('input').first().clear();
    cy.contains('Save Changes').click();
    cy.contains('Name is required').should('be.visible');
  });

  it('shows validation error when city is cleared', () => {
    cy.get('input[placeholder="Your city"]').clear();
    cy.contains('Save Changes').click();
    cy.contains('City is required').should('be.visible');
  });

  it('navigates to profile from navbar dropdown', () => {
    cy.visit('/dashboard');
    cy.intercept('GET', '**/announcements*', {
      statusCode: 200,
      body: { data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
    });
    cy.intercept('GET', '**/family', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });

    cy.contains(currentUser.name).click();
    cy.contains('Profile').click();
    cy.url().should('include', '/profile');
  });
});
