/// <reference types="cypress" />

/**
 * Use Case: UC-04 – Family Member Management
 *
 * Actor: Authenticated user
 * Goal: Add, edit, and remove family members from their profile
 *
 * Main Flow:
 *   1. User navigates to /family
 *   2. Clicks "Add Member"
 *   3. Fills in name and age, optionally uploads a photo
 *   4. Saves — member card appears on the page
 *   5. User clicks Edit on a card
 *   6. Updates name/age — changes reflected
 *   7. User clicks Remove — member disappears after confirmation
 *
 * Alternative Flows:
 *   A. Missing required fields → button stays disabled
 *   B. Cancel edit → no changes made
 */
describe('UC-04: Family Member Management', () => {
  const existingMember = {
    id: 'fm-1', user_id: 'current-user',
    name: 'Alice', age: 8, thumbnail: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    cy.intercept('GET', '**/family', { statusCode: 200, body: [existingMember] }).as('getFamily');
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

    cy.visit('/family');
    cy.wait('@getFamily');
  });

  it('displays the family page heading and member count', () => {
    cy.contains('My Family').should('be.visible');
    cy.contains('1 family member').should('be.visible');
  });

  it('shows existing family member card', () => {
    cy.contains('Alice').should('be.visible');
    cy.contains('Age 8').should('be.visible');
  });

  it('opens the Add Member modal', () => {
    cy.contains('+ Add Member').click();
    cy.contains('Add Family Member').should('be.visible');
    cy.get('input[placeholder="Family member\'s name"]').should('be.visible');
    cy.get('input[type="number"]').should('be.visible');
  });

  it('disables save when name is empty', () => {
    cy.contains('+ Add Member').click();
    cy.get('input[type="number"]').type('5');
    cy.contains('Add Member').last().should('be.disabled');
  });

  it('disables save when age is empty', () => {
    cy.contains('+ Add Member').click();
    cy.get('input[placeholder="Family member\'s name"]').type('Bob');
    cy.contains('Add Member').last().should('be.disabled');
  });

  it('successfully adds a family member', () => {
    const newMember = { id: 'fm-2', user_id: 'current-user', name: 'Bob', age: 5, thumbnail: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };

    cy.intercept('POST', '**/family', { statusCode: 201, body: newMember }).as('addMember');

    cy.contains('+ Add Member').click();
    cy.get('input[placeholder="Family member\'s name"]').type('Bob');
    cy.get('input[placeholder="Age"]').type('5');
    cy.contains('Add Member').last().click();
    cy.wait('@addMember');
    cy.contains('Family member added!').should('be.visible');
  });

  it('closes modal when Cancel is clicked', () => {
    cy.contains('+ Add Member').click();
    cy.contains('Add Family Member').should('be.visible');
    cy.contains('Cancel').click();
    cy.contains('Add Family Member').should('not.exist');
  });

  it('opens edit modal for existing member', () => {
    cy.contains('Edit').click();
    cy.contains('Edit Alice').should('be.visible');
  });

  it('saves edits to a family member', () => {
    const updatedMember = { ...existingMember, name: 'Alice Updated', age: 9 };
    cy.intercept('PUT', '**/family/fm-1', { statusCode: 200, body: updatedMember }).as('updateMember');

    cy.contains('Edit').click();
    cy.get('input[placeholder="Family member\'s name"]').clear().type('Alice Updated');
    cy.get('input[placeholder="Age"]').clear().type('9');
    cy.contains('Save Changes').click();
    cy.wait('@updateMember');
    cy.contains('Member updated!').should('be.visible');
  });

  it('removes a family member after confirmation', () => {
    cy.intercept('DELETE', '**/family/fm-1', { statusCode: 200, body: { message: 'Member removed' } }).as('deleteMember');

    cy.on('window:confirm', () => true);
    cy.contains('Remove').click();
    cy.wait('@deleteMember');
    cy.contains('fm-1 removed', { matchCase: false });
  });
});
