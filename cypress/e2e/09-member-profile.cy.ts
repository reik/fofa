/// <reference types="cypress" />

/**
 * Use Case: UC-09 – Member Profile & Playdate Request from Profile
 *
 * Actor: Authenticated user
 * Goal: View another member's profile, see their availability, and send a playdate request
 *
 * Main Flow:
 *   1. User clicks a member's avatar on the Dashboard
 *   2. Navigates to /members/:id
 *   3. Sees the member's name, location, bio, and family members
 *   4. Sees the member's weekly availability calendar (view-only mode)
 *   5. Matching slots (overlap with viewer's own availability) are highlighted
 *   6. User clicks a free slot → "Request a Playdate" modal opens
 *   7. User optionally types a message and submits the request
 *   8. Success toast shown
 *   9. User can also click "Send Message" to open a direct conversation
 *
 * Alternative Flows:
 *   A. Member has no free slots → calendar is empty
 *   B. Request already pending → duplicate blocked (409)
 *   C. User tries to request own slot → prevented
 */

const CURRENT_USER = {
  id: 'current-user',
  name: 'Jane Foster',
  email: 'jane@test.com',
  city: 'Sacramento',
  state: 'CA',
  thumbnail: null,
  verified: true,
  created_at: new Date().toISOString(),
};

const TARGET_USER = {
  id: 'target-user',
  name: 'Carlos Rivera',
  email: 'carlos@test.com',
  city: 'Miami',
  state: 'FL',
  thumbnail: null,
  verified: true,
  created_at: new Date().toISOString(),
};

const AUTH_STATE = {
  state: { user: CURRENT_USER, token: 'test-token' },
  version: 0,
};

const today = new Date();
const isoDate = today.toISOString().slice(0, 10);

const targetFreeSlot = {
  id: 'slot-t1',
  user_id: 'target-user',
  date: isoDate,
  start_time: '10:00',
  end_time: '11:00',
  status: 'free',
  note: 'Morning playdate',
};

const myFreeSlot = {
  id: 'slot-m1',
  user_id: 'current-user',
  date: isoDate,
  start_time: '10:00',
  end_time: '11:30',
  status: 'free',
  note: '',
};

function withAuth(win: Window) {
  win.localStorage.setItem('fofa-auth', JSON.stringify(AUTH_STATE));
}

function setupBaseIntercepts() {
  cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });
  cy.intercept('GET', '**/playdates/requests', { statusCode: 200, body: [] });
  cy.intercept('GET', `**/users/${TARGET_USER.id}`, {
    statusCode: 200,
    body: TARGET_USER,
  }).as('getTargetUser');
  cy.intercept('GET', '**/family*', { statusCode: 200, body: [] });
}

describe('UC-09: Member Profile Page', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('GET', `**/playdates/availability/${TARGET_USER.id}`, {
      statusCode: 200,
      body: [targetFreeSlot],
    }).as('getTargetSlots');
    cy.intercept('GET', `**/playdates/availability/${CURRENT_USER.id}`, {
      statusCode: 200,
      body: [myFreeSlot],
    }).as('getMySlots');
    cy.visit(`/members/${TARGET_USER.id}`, { onBeforeLoad: withAuth });
    cy.wait('@getTargetUser');
  });

  it('renders the member name and location', () => {
    cy.contains('Carlos Rivera').should('be.visible');
    cy.contains('Miami, FL').should('be.visible');
  });

  it('shows the Send Message button', () => {
    cy.contains('button', /send message|message/i).should('be.visible');
  });

  it('navigates to messages page when Send Message is clicked', () => {
    cy.intercept('GET', '**/messages*', { statusCode: 200, body: [] });
    cy.contains('button', /send message|message/i).click();
    cy.url().should('include', '/messages');
  });

  it('shows the availability calendar section', () => {
    cy.contains(/availability|schedule/i).should('be.visible');
  });

  it('shows week navigation controls on availability calendar', () => {
    cy.contains('button', /today/i).should('be.visible');
  });
});

describe('UC-09: Member Profile – Playdate Request', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('GET', `**/playdates/availability/${TARGET_USER.id}`, {
      statusCode: 200,
      body: [targetFreeSlot],
    }).as('getTargetSlots');
    cy.intercept('GET', `**/playdates/availability/${CURRENT_USER.id}`, {
      statusCode: 200,
      body: [myFreeSlot],
    }).as('getMySlots');
    cy.visit(`/members/${TARGET_USER.id}`, { onBeforeLoad: withAuth });
    cy.wait('@getTargetUser');
    cy.wait('@getTargetSlots');
    cy.wait('@getMySlots');
  });

  it('renders a free slot on the target member calendar', () => {
    cy.contains(/free|10.*11/i).should('be.visible');
  });

  it('opens Request a Playdate modal when a free slot is clicked', () => {
    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.contains(/request a playdate/i, { timeout: 5000 }).should('be.visible');
  });

  it('shows matching time banner when slot overlaps with viewer availability', () => {
    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.contains(/matching|your availability|overlap/i, { timeout: 5000 }).should('be.visible');
  });

  it('submits a playdate request with a message', () => {
    cy.intercept('POST', '**/playdates/requests', {
      statusCode: 201,
      body: {
        id: 'req-new',
        requester_id: CURRENT_USER.id,
        owner_id: TARGET_USER.id,
        slot_id: targetFreeSlot.id,
        status: 'pending',
        message: 'Would love to meet up!',
        created_at: new Date().toISOString(),
      },
    }).as('createRequest');

    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.get('textarea', { timeout: 5000 }).type("Would love to meet up!");
    cy.contains('button', /send request|request playdate|submit/i).click();
    cy.wait('@createRequest');
    cy.contains(/request sent|sent|success/i).should('be.visible');
  });

  it('can submit a request without a message', () => {
    cy.intercept('POST', '**/playdates/requests', {
      statusCode: 201,
      body: {
        id: 'req-new2',
        requester_id: CURRENT_USER.id,
        owner_id: TARGET_USER.id,
        slot_id: targetFreeSlot.id,
        status: 'pending',
        message: '',
        created_at: new Date().toISOString(),
      },
    }).as('createRequest');

    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.contains('button', /send request|request playdate|submit/i).click();
    cy.wait('@createRequest');
    cy.contains(/request sent|sent|success/i).should('be.visible');
  });

  it('closes the modal when Cancel is clicked', () => {
    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.contains(/request a playdate/i, { timeout: 5000 }).should('be.visible');
    cy.contains('button', /cancel/i).click();
    cy.contains(/request a playdate/i).should('not.exist');
  });

  it('shows error when request already exists (409)', () => {
    cy.intercept('POST', '**/playdates/requests', {
      statusCode: 409,
      body: { error: 'A pending request already exists for this slot' },
    }).as('duplicateRequest');

    cy.contains(/free|10.*11/i).first().click({ force: true });
    cy.contains('button', /send request|request playdate|submit/i).click();
    cy.wait('@duplicateRequest');
    cy.contains(/already|pending|exists/i).should('be.visible');
  });
});

describe('UC-09: Member Profile – Navigation from Dashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });
    cy.intercept('GET', '**/playdates/requests', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/announcements*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'ann-1',
            userId: TARGET_USER.id,
            content: 'Hello from Carlos!',
            mediaUrl: null,
            mediaType: null,
            createdAt: new Date().toISOString(),
            author: { name: TARGET_USER.name, thumbnail: null },
            commentCount: 0,
            reactions: {},
            userReaction: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pages: 1 },
      },
    }).as('getAnnouncements');
    cy.intercept('GET', '**/family', { statusCode: 200, body: [] });
    cy.intercept('GET', '**/users/search*', { statusCode: 200, body: [] });
    cy.intercept('GET', `**/users/${TARGET_USER.id}`, { statusCode: 200, body: TARGET_USER });
    cy.intercept('GET', `**/playdates/availability/${TARGET_USER.id}`, { statusCode: 200, body: [] });
    cy.intercept('GET', `**/playdates/availability/${CURRENT_USER.id}`, { statusCode: 200, body: [] });
    cy.intercept('GET', '**/family*', { statusCode: 200, body: [] });
    cy.visit('/dashboard', { onBeforeLoad: withAuth });
    cy.wait('@getAnnouncements');
  });

  it('navigates to member profile by clicking author avatar/name', () => {
    cy.contains('Carlos Rivera').click({ force: true });
    cy.url().should('include', `/members/${TARGET_USER.id}`);
  });
});
