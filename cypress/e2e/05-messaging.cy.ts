/// <reference types="cypress" />

/**
 * Use Case: UC-05 – Direct Messaging
 *
 * Actor: Authenticated user
 * Goal: Send and receive direct messages with other community members
 *
 * Main Flow:
 *   1. User navigates to /messages
 *   2. Sees list of existing conversations
 *   3. Clicks on a conversation to open chat thread
 *   4. Types and sends a message
 *   5. Message appears in the chat thread
 *
 * Alternative Flows:
 *   A. No conversations → empty state with search prompt
 *   B. User searches for a member to start new conversation
 *   C. Send button disabled when input is empty
 */
describe('UC-05: Direct Messaging', () => {
  const partner = {
    id: 'partner-1', name: 'Bob Smith', thumbnail: null,
    city: 'Portland', state: 'OR', email: 'bob@test.com',
  };

  const conversations = [
    {
      id: 'msg-1', partner_id: 'partner-1', partner_name: 'Bob Smith',
      partner_thumbnail: null, content: 'Hey there!',
      created_at: new Date().toISOString(), unread_count: 2,
    },
  ];

  const messages = [
    {
      id: 'm1', sender_id: 'partner-1', receiver_id: 'current-user',
      content: 'Hey there!', read: false,
      created_at: new Date(Date.now() - 60000).toISOString(),
      sender_name: 'Bob Smith', sender_thumbnail: null,
    },
    {
      id: 'm2', sender_id: 'current-user', receiver_id: 'partner-1',
      content: 'Hi Bob!', read: true,
      created_at: new Date().toISOString(),
      sender_name: 'Jane', sender_thumbnail: null,
    },
  ];

  beforeEach(() => {
    cy.intercept('GET', '**/messages', { statusCode: 200, body: conversations }).as('getConversations');
    cy.intercept('GET', '**/messages/partner-1*', { statusCode: 200, body: messages }).as('getMessages');
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 2 } });
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

    cy.visit('/messages');
    cy.wait('@getConversations');
  });

  it('displays the messages page heading', () => {
    cy.contains('Messages').should('be.visible');
  });

  it('shows existing conversations in sidebar', () => {
    cy.contains('Bob Smith').should('be.visible');
    cy.contains('Hey there!').should('be.visible');
  });

  it('shows unread badge on conversation', () => {
    cy.contains('2').should('be.visible');
  });

  it('opens chat thread on conversation click', () => {
    cy.contains('Bob Smith').click();
    cy.wait('@getMessages');
    cy.contains('Hey there!').should('be.visible');
    cy.contains('Hi Bob!').should('be.visible');
  });

  it('disables send button when message is empty', () => {
    cy.contains('Bob Smith').click();
    cy.wait('@getMessages');
    cy.get('button').contains('Send').should('be.disabled');
  });

  it('sends a message successfully', () => {
    const sentMsg = {
      id: 'm3', sender_id: 'current-user', receiver_id: 'partner-1',
      content: 'How are you doing?', read: false,
      created_at: new Date().toISOString(),
      sender_name: 'Jane', sender_thumbnail: null,
    };
    cy.intercept('POST', '**/messages', { statusCode: 201, body: sentMsg }).as('sendMessage');

    cy.contains('Bob Smith').click();
    cy.wait('@getMessages');
    cy.get('input[placeholder="Type a message…"]').type('How are you doing?');
    cy.contains('Send').click();
    cy.wait('@sendMessage');
    cy.contains('How are you doing?').should('be.visible');
  });

  it('shows empty state when no conversations exist', () => {
    cy.intercept('GET', '**/messages', { statusCode: 200, body: [] }).as('emptyConversations');
    cy.visit('/messages');
    cy.wait('@emptyConversations');
    cy.contains('No conversations yet').should('be.visible');
  });

  it('can search for members to start a conversation', () => {
    cy.intercept('GET', '**/users/search*', {
      statusCode: 200,
      body: [partner],
    }).as('search');

    cy.get('input[placeholder="Search members…"]').type('Bob');
    cy.wait('@search');
    cy.contains('Bob Smith').should('be.visible');
    cy.contains('Portland, OR').should('be.visible');
  });
});
