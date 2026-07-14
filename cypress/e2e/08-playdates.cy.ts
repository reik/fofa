/// <reference types="cypress" />

/**
 * Use Case: UC-08 – Playdate Scheduling
 *
 * Actor: Authenticated user
 * Goal: Manage availability slots and handle playdate requests
 *
 * Main Flow:
 *   1. User navigates to /playdates
 *   2. Sees their weekly availability calendar
 *   3. Clicks a free time slot → Add Slot modal opens
 *   4. Sets date, start/end time, status (free/busy), optional note → saves
 *   5. Slot appears on calendar
 *   6. User edits an existing slot
 *   7. User deletes a slot after confirmation
 *   8. User toggles to month view
 *   9. User sees incoming Playdate Requests in the right panel
 *  10. User accepts / declines a request
 *
 * Alternative Flows:
 *   A. No slots → calendar shows empty grid
 *   B. No requests → sidebar shows empty state
 */

const AUTH_STATE = {
  state: {
    user: {
      id: 'current-user',
      name: 'Jane Foster',
      email: 'jane@test.com',
      city: 'Sacramento',
      state: 'CA',
      thumbnail: null,
    },
    token: 'test-token',
  },
  version: 0,
};

const today = new Date();
const isoDate = today.toISOString().slice(0, 10); // YYYY-MM-DD

const freeSlot = {
  id: 'slot-1',
  user_id: 'current-user',
  date: isoDate,
  start_time: '10:00',
  end_time: '11:00',
  status: 'free',
  note: 'Available in the morning',
};

const busySlot = {
  id: 'slot-2',
  user_id: 'current-user',
  date: isoDate,
  start_time: '14:00',
  end_time: '15:00',
  status: 'busy',
  note: 'Doctor appointment',
};

const pendingRequest = {
  id: 'req-1',
  requester_id: 'other-user',
  owner_id: 'current-user',
  slot_id: 'slot-1',
  status: 'pending',
  message: 'Would love to set up a playdate!',
  created_at: new Date().toISOString(),
  requester_name: 'Bob Smith',
  requester_thumbnail: null,
  slot_date: isoDate,
  slot_start: '10:00',
  slot_end: '11:00',
};

function withAuth(win: Window) {
  win.localStorage.setItem('fofa-auth', JSON.stringify(AUTH_STATE));
}

function setupBaseIntercepts() {
  cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });
  cy.intercept('GET', '**/playdates/requests', { statusCode: 200, body: [] }).as('getRequests');
}

describe('UC-08: Playdate Scheduling – Calendar', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('GET', '**/playdates/availability/current-user', {
      statusCode: 200,
      body: [freeSlot, busySlot],
    }).as('getSlots');
    cy.visit('/playdates', { onBeforeLoad: withAuth });
    cy.wait('@getSlots');
  });

  it('renders the Playdates heading and week calendar', () => {
    cy.contains('Playdates').should('be.visible');
    cy.get('[aria-label*="week"]', { timeout: 5000 }).should('exist')
      .then(() => {
        cy.log('Week grid rendered');
      });
  });

  it('shows week navigation controls', () => {
    cy.contains('button', /today/i).should('be.visible');
    cy.contains('button', /week/i).should('be.visible');
    cy.contains('button', /month/i).should('be.visible');
  });

  it('renders free and busy slot chips on the calendar', () => {
    cy.contains('free', { matchCase: false }).should('exist');
    cy.contains('busy', { matchCase: false }).should('exist');
  });

  it('switches to month view when Month button is clicked', () => {
    cy.contains('button', /month/i).click();
    // Month calendar renders day numbers 1–31
    cy.get('[aria-label*="month"], [data-testid*="month"]').should('exist')
      .then(() => cy.log('Month view rendered'));
    cy.contains('button', /week/i).click(); // restore
  });

  it('navigates to next week', () => {
    cy.contains('button', '›').click();
    // Just assert no crash — date in heading updates
    cy.contains('button', '›').should('be.visible');
  });

  it('navigates back to current week via Today', () => {
    cy.contains('button', '›').click();
    cy.contains('button', /today/i).click();
    cy.contains('button', /today/i).should('be.visible');
  });
});

describe('UC-08: Playdate Scheduling – Add Slot', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('GET', '**/playdates/availability/current-user', {
      statusCode: 200,
      body: [],
    }).as('getSlots');
    cy.visit('/playdates', { onBeforeLoad: withAuth });
    cy.wait('@getSlots');
  });

  it('opens Add Slot modal when a calendar cell is clicked', () => {
    // Click the first clickable cell in the week grid
    cy.get('[role="gridcell"]').first().click({ force: true });
    // Modal should appear
    cy.contains(/add slot|new slot/i, { timeout: 5000 }).should('be.visible');
  });

  it('successfully creates a free slot', () => {
    const newSlot = { ...freeSlot, id: 'slot-new' };
    cy.intercept('POST', '**/playdates/availability', {
      statusCode: 201,
      body: newSlot,
    }).as('addSlot');

    cy.contains('button', /\+ add slot|add slot/i).click({ force: true });
    cy.get('input[type="date"]').first().clear().type(isoDate);
    cy.contains(/save|add/i, { timeout: 3000 });
    // Select free status (default or explicit radio/select)
    cy.get('select[name="status"], [aria-label*="status"]').then(($el) => {
      if ($el.length) cy.wrap($el).select('free');
    });
    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@addSlot');
    cy.contains(/slot saved|slot added|availability saved/i).should('be.visible');
  });
});

describe('UC-08: Playdate Scheduling – Manage Existing Slot', () => {
  beforeEach(() => {
    setupBaseIntercepts();
    cy.intercept('GET', '**/playdates/availability/current-user', {
      statusCode: 200,
      body: [freeSlot],
    }).as('getSlots');
    cy.visit('/playdates', { onBeforeLoad: withAuth });
    cy.wait('@getSlots');
  });

  it('opens edit modal when a slot is clicked', () => {
    // Click the slot chip on the calendar
    cy.contains(/10.?00.*11.?00|free/i).first().click({ force: true });
    cy.contains(/edit slot|save/i, { timeout: 5000 }).should('be.visible');
  });

  it('updates a slot successfully', () => {
    const updated = { ...freeSlot, note: 'Updated note' };
    cy.intercept('PUT', `**/playdates/availability/${freeSlot.id}`, {
      statusCode: 200,
      body: updated,
    }).as('updateSlot');

    cy.contains(/10.?00.*11.?00|free/i).first().click({ force: true });
    cy.get('textarea, input[name="note"]').then(($el) => {
      if ($el.length) cy.wrap($el).last().clear().type('Updated note');
    });
    cy.get('button[type="submit"]').click({ force: true });
    cy.wait('@updateSlot');
    cy.contains(/saved|updated/i).should('be.visible');
  });

  it('deletes a slot after confirmation', () => {
    cy.intercept('DELETE', `**/playdates/availability/${freeSlot.id}`, {
      statusCode: 200,
      body: { message: 'Deleted' },
    }).as('deleteSlot');

    cy.on('window:confirm', () => true);
    cy.contains(/10.?00.*11.?00|free/i).first().click({ force: true });
    cy.contains('button', /delete/i).click({ force: true });
    cy.wait('@deleteSlot');
  });
});

describe('UC-08: Playdate Scheduling – Requests Panel', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/messages/unread/count', { statusCode: 200, body: { count: 0 } });
    cy.intercept('GET', '**/playdates/availability/current-user', {
      statusCode: 200,
      body: [freeSlot],
    }).as('getSlots');
    cy.intercept('GET', '**/playdates/requests', {
      statusCode: 200,
      body: [pendingRequest],
    }).as('getRequests');
    cy.visit('/playdates', { onBeforeLoad: withAuth });
    cy.wait('@getSlots');
    cy.wait('@getRequests');
  });

  it('shows Playdate Requests panel on the right', () => {
    cy.contains(/playdate requests/i).should('be.visible');
  });

  it('displays pending incoming request with requester name', () => {
    cy.contains('Bob Smith').should('be.visible');
    cy.contains('Would love to set up a playdate!').should('be.visible');
  });

  it('shows Accept and Decline buttons on incoming request', () => {
    cy.contains('button', /accept/i).should('be.visible');
    cy.contains('button', /decline/i).should('be.visible');
  });

  it('accepts a playdate request', () => {
    cy.intercept('PUT', `**/playdates/requests/${pendingRequest.id}/respond`, {
      statusCode: 200,
      body: { ...pendingRequest, status: 'accepted' },
    }).as('respond');

    cy.contains('button', /accept/i).first().click();
    cy.wait('@respond').its('request.body').should('deep.equal', { status: 'accepted' });
  });

  it('declines a playdate request', () => {
    cy.intercept('PUT', `**/playdates/requests/${pendingRequest.id}/respond`, {
      statusCode: 200,
      body: { ...pendingRequest, status: 'declined' },
    }).as('respond');

    cy.contains('button', /decline/i).first().click();
    cy.wait('@respond').its('request.body').should('deep.equal', { status: 'declined' });
  });

  it('shows empty state when no requests exist', () => {
    cy.intercept('GET', '**/playdates/requests', { statusCode: 200, body: [] }).as('emptyRequests');
    cy.visit('/playdates', { onBeforeLoad: withAuth });
    cy.wait('@emptyRequests');
    cy.contains(/no (pending )?requests|no playdate requests/i).should('be.visible');
  });
});
