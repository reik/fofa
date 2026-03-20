/// <reference types="cypress" />

/**
 * Use Case: UC-03 – Dashboard & Announcements Feed
 *
 * Actor: Authenticated user
 * Goal: View, create, and interact with announcements
 *
 * Main Flow:
 *   1. User logs in and lands on /dashboard
 *   2. Sees the community feed of announcements
 *   3. Creates a new announcement (text only)
 *   4. Creates an announcement with a photo
 *   5. Reacts to an announcement
 *   6. Comments on an announcement
 *   7. Deletes own announcement
 *
 * Alternative Flows:
 *   A. Empty content → submit button is disabled
 *   B. Feed is empty → empty state shown
 */
describe('UC-03: Dashboard & Announcements', () => {
  const unique = Date.now();
  const user = {
    name: 'Feed Test User',
    email: `feed_${unique}@fofa.dev`,
    password: 'FeedPass99!',
    city: 'Seattle',
    state: 'WA',
  };

  before(() => {
    cy.request('POST', `${Cypress.env('apiUrl')}/auth/register`, user);
  });

  beforeEach(() => {
    cy.clearAppState();
    // Mock login via API stub (assumes verified account or test mode)
    cy.intercept('GET', '**/announcements*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'ann-1',
            userId: 'other-user',
            content: 'This is a community announcement from another user.',
            mediaUrl: null,
            mediaType: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { name: 'Community Member', thumbnail: null },
            commentCount: 3,
            reactions: { like: 2, love: 1 },
            userReaction: null,
          },
          {
            id: 'ann-2',
            userId: 'current-user',
            content: 'My own announcement that I can delete.',
            mediaUrl: null,
            mediaType: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { name: user.name, thumbnail: null },
            commentCount: 0,
            reactions: {},
            userReaction: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 2, pages: 1 },
      },
    }).as('getAnnouncements');

    cy.intercept('GET', '**/users/me', {
      statusCode: 200,
      body: { id: 'current-user', name: user.name, email: user.email, city: user.city, state: user.state, thumbnail: null, verified: true },
    });

    cy.intercept('GET', '**/family', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });

    window.localStorage.setItem(
      'fofa-auth',
      JSON.stringify({
        state: {
          user: { id: 'current-user', name: user.name, email: user.email, city: user.city, state: user.state, thumbnail: null },
          token: 'test-token',
        },
        version: 0,
      })
    );
    cy.visit('/dashboard');
    cy.wait('@getAnnouncements');
  });

  it('renders the dashboard layout with navbar and feed', () => {
    cy.contains('FoFa').should('be.visible');
    cy.contains('Feed').should('be.visible');
    cy.contains('Family').should('be.visible');
    cy.contains('Messages').should('be.visible');
  });

  it('shows announcements in the feed', () => {
    cy.contains('This is a community announcement from another user.').should('be.visible');
    cy.contains('Community Member').should('be.visible');
  });

  it('shows existing reactions on announcement', () => {
    cy.contains('👍 2').should('be.visible');
    cy.contains('❤️ 1').should('be.visible');
  });

  it('shows comment count button', () => {
    cy.contains('3 Comments').should('be.visible');
  });

  it('disables submit when announcement content is empty', () => {
    cy.get('textarea').first().clear();
    cy.contains('Post Announcement').should('be.disabled');
  });

  it('creates a new text announcement', () => {
    const newContent = `Test announcement ${unique}`;

    cy.intercept('POST', '**/announcements', {
      statusCode: 201,
      body: {
        id: 'ann-new',
        userId: 'current-user',
        content: newContent,
        mediaUrl: null,
        mediaType: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: { name: user.name, thumbnail: null },
        commentCount: 0,
        reactions: {},
        userReaction: null,
      },
    }).as('createAnnouncement');

    cy.get('textarea').first().type(newContent);
    cy.contains('Post Announcement').click();
    cy.wait('@createAnnouncement');
    cy.contains('Announcement posted!').should('be.visible');
  });

  it('toggles reaction picker and selects a reaction', () => {
    cy.intercept('POST', '**/announcements/ann-1/reactions', {
      statusCode: 200,
      body: { action: 'added', type: 'love' },
    }).as('react');

    cy.get('button').contains('React').first().click();
    cy.get('button[title="Love"]').click();
    cy.wait('@react');
  });

  it('opens comments section', () => {
    cy.intercept('GET', '**/announcements/ann-1/comments', {
      statusCode: 200,
      body: [
        {
          id: 'c1', announcement_id: 'ann-1', user_id: 'other',
          content: 'Great news!', created_at: new Date().toISOString(),
          author_name: 'Community Member', author_thumbnail: null,
        },
      ],
    }).as('getComments');

    cy.contains('3 Comments').click();
    cy.wait('@getComments');
    cy.contains('Great news!').should('be.visible');
  });

  it('posts a comment', () => {
    cy.intercept('GET', '**/announcements/ann-1/comments', { statusCode: 200, body: [] }).as('getComments');
    cy.intercept('POST', '**/announcements/ann-1/comments', {
      statusCode: 201,
      body: {
        id: 'c2', announcement_id: 'ann-1', user_id: 'current-user',
        content: 'Such wonderful news!', created_at: new Date().toISOString(),
        author_name: user.name, author_thumbnail: null,
      },
    }).as('postComment');

    cy.contains('3 Comments').click();
    cy.wait('@getComments');
    cy.get('textarea[placeholder="Write a comment…"]').type('Such wonderful news!');
    cy.contains('Post').last().click();
    cy.wait('@postComment');
    cy.contains('Such wonderful news!').should('be.visible');
  });

  it('shows delete button only on own announcements', () => {
    // ann-2 belongs to current-user
    cy.get('[aria-label="Delete announcement"]').should('have.length', 1);
  });
});
