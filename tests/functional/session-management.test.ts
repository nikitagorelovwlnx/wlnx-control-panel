import { ControlPanel } from '../../src/index';
import { setupDOM, cleanup, waitForElement, waitForElementToBeRemoved, click, wait } from '../utils/test-utils';

describe('Session Management - Functional Tests', () => {
  beforeEach(async () => {
    setupDOM();
    new ControlPanel(); // Initialize control panel
    await wait(100); // Allow initialization
  });

  afterEach(() => {
    cleanup();
  });

  test('should open sessions panel when user is selected', async () => {
    // Wait for users to load
    await waitForElement('[data-user-email="alice@example.com"]');
    
    // Initially sessions panel should not be active
    const sessionsPanel = document.getElementById('sessions-panel');
    expect(sessionsPanel?.classList.contains('active')).toBe(false);
    
    // Click on Alice's card
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    // Wait for sessions panel to become active
    await wait(200);
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    
    // Check that user name is displayed in sessions panel header (only username part)
    const selectedUserName = document.getElementById('selected-user-name');
    expect(selectedUserName?.textContent).toContain('alice');
  });

  test('should load and display user sessions', async () => {
    // Load users and select Alice
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    // Wait for sessions to load
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Check that all Alice's sessions are displayed
    const sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // Check session details
    const session1 = document.querySelector('[data-session-id="session-alice-1"]');
    expect(session1?.textContent).toContain('Initial wellness consultation');
    
    const session2 = document.querySelector('[data-session-id="session-alice-2"]');
    expect(session2?.textContent).toContain('Follow-up session on exercise');
    
    const session3 = document.querySelector('[data-session-id="session-alice-3"]');
    expect(session3?.textContent).toContain('Discussion about work-life balance');
  });

  test('should show delete button on each session card', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Check that each session has a delete button
    const deleteButtons = document.querySelectorAll('.delete-btn');
    expect(deleteButtons).toHaveLength(3);
    
    // Check that buttons have correct session IDs
    const session1DeleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn');
    const session2DeleteBtn = document.querySelector('[data-session-id="session-alice-2"] .delete-btn');
    const session3DeleteBtn = document.querySelector('[data-session-id="session-alice-3"] .delete-btn');
    
    expect(session1DeleteBtn?.getAttribute('data-session-id')).toBe('session-alice-1');
    expect(session2DeleteBtn?.getAttribute('data-session-id')).toBe('session-alice-2');
    expect(session3DeleteBtn?.getAttribute('data-session-id')).toBe('session-alice-3');
  });

  test('should show confirm dialog when session delete button is clicked', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    const deleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn') as HTMLElement;
    const confirmActions = document.querySelector('[data-session-id="session-alice-1"] .confirm-actions') as HTMLElement;
    
    // Initially confirm actions should be hidden
    expect(confirmActions.style.display).toBe('none');
    
    // Click delete button
    click(deleteBtn);
    await wait(50);
    
    // Confirm actions should now be visible
    expect(confirmActions.style.display).toBe('flex');
    expect(deleteBtn.style.display).toBe('none');
    
    // Should have Yes and No buttons
    const yesBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-yes');
    const noBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-no');
    
    expect(yesBtn).toBeTruthy();
    expect(noBtn).toBeTruthy();
  });

  test('should hide confirm dialog when No is clicked', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    const deleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn') as HTMLElement;
    const confirmActions = document.querySelector('[data-session-id="session-alice-1"] .confirm-actions') as HTMLElement;
    
    // Show confirm dialog
    click(deleteBtn);
    await wait(50);
    expect(confirmActions.style.display).toBe('flex');
    
    // Click No button
    const noBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-no') as HTMLElement;
    click(noBtn);
    await wait(50);
    
    // Confirm dialog should be hidden
    expect(confirmActions.style.display).toBe('none');
    expect(deleteBtn.style.display).toBe('block');
  });

  test('should delete session when Yes is clicked', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Initially should have 3 sessions
    let sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // Click delete button and confirm
    const deleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn') as HTMLElement;
    click(deleteBtn);
    await wait(50);
    
    const yesBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for session to be removed from DOM
    await waitForElementToBeRemoved('[data-session-id="session-alice-1"]');
    
    // Should now have 2 sessions
    sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(2);
    
    // Check that the correct session was removed
    expect(document.querySelector('[data-session-id="session-alice-1"]')).toBeNull();
    expect(document.querySelector('[data-session-id="session-alice-2"]')).toBeTruthy();
    expect(document.querySelector('[data-session-id="session-alice-3"]')).toBeTruthy();
  });

  test('should switch between different users sessions', async () => {
    // Load users and select Alice
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    // Wait for Alice's sessions
    await waitForElement('[data-session-id="session-alice-1"]');
    let sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // Switch to Bob
    const bobCard = document.querySelector('[data-user-email="bob@example.com"]') as HTMLElement;
    click(bobCard);
    
    // Wait for Bob's sessions to load
    await waitForElement('[data-session-id="session-bob-1"]');
    sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(2);
    
    // Check that we have Bob's sessions
    expect(document.querySelector('[data-session-id="session-bob-1"]')).toBeTruthy();
    expect(document.querySelector('[data-session-id="session-bob-2"]')).toBeTruthy();
    
    // Alice's sessions should no longer be visible
    expect(document.querySelector('[data-session-id="session-alice-1"]')).toBeNull();
    
    // Check header shows Bob's username
    const selectedUserName = document.getElementById('selected-user-name');
    expect(selectedUserName?.textContent).toContain('bob');
  });
});
