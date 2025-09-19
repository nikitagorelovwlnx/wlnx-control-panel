import { ControlPanel } from '../../src/index';
import { setupDOM, cleanup, waitForElement, click, wait } from '../utils/test-utils';

describe('Delete All Sessions - Functional Tests', () => {
  beforeEach(async () => {
    setupDOM();
    new ControlPanel(); // Initialize control panel
    await wait(100); // Allow initialization
  });

  afterEach(() => {
    cleanup();
  });

  test('should delete all user sessions when confirmed', async () => {
    // Load users and select Alice
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    // Wait for Alice's sessions to load
    await waitForElement('[data-session-id="session-alice-1"]');
    let sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // Click delete all sessions button on Alice's card
    const deleteAllBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    click(deleteAllBtn);
    await wait(50);
    
    // Click Yes to confirm
    const yesBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for sessions panel to update
    await wait(300);
    
    // Sessions should be cleared - should show empty state
    const emptyState = document.querySelector('.empty-state');
    expect(emptyState?.textContent).toContain('No sessions yet');
    
    // No session cards should remain
    sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(0);
  });

  test('should not delete sessions when cancelled', async () => {
    // Load users and select Alice
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    // Wait for Alice's sessions to load
    await waitForElement('[data-session-id="session-alice-1"]');
    let sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // Click delete all sessions button on Alice's card
    const deleteAllBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    click(deleteAllBtn);
    await wait(50);
    
    // Click No to cancel
    const noBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-no') as HTMLElement;
    click(noBtn);
    await wait(50);
    
    // Sessions should still be there
    sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
    
    // All Alice's sessions should still exist
    expect(document.querySelector('[data-session-id="session-alice-1"]')).toBeTruthy();
    expect(document.querySelector('[data-session-id="session-alice-2"]')).toBeTruthy();
    expect(document.querySelector('[data-session-id="session-alice-3"]')).toBeTruthy();
  });

  test('should refresh user data after deleting all sessions', async () => {
    // Load users - Alice initially has 3 sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    let aliceCard = document.querySelector('[data-user-email="alice@example.com"]');
    expect(aliceCard?.textContent).toContain('3 sessions');
    
    // Select Alice and load her sessions
    click(aliceCard as HTMLElement);
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Delete all Alice's sessions
    const deleteAllBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    click(deleteAllBtn);
    await wait(50);
    
    const yesBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for refresh
    await wait(500);
    
    // Alice's session count should be updated in users list
    aliceCard = document.querySelector('[data-user-email="alice@example.com"]');
    expect(aliceCard?.textContent).toContain('0 sessions');
  });

  test('should work for different users independently', async () => {
    // Load users
    await waitForElement('[data-user-email="alice@example.com"]');
    
    // Delete all sessions for Bob (who has 2 sessions)
    const bobCard = document.querySelector('[data-user-email="bob@example.com"]');
    expect(bobCard?.textContent).toContain('2 sessions');
    
    const bobDeleteAllBtn = document.querySelector('[data-user-email="bob@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    click(bobDeleteAllBtn);
    await wait(50);
    
    const bobYesBtn = document.querySelector('[data-user-email="bob@example.com"] .confirm-yes') as HTMLElement;
    click(bobYesBtn);
    await wait(300);
    
    // Bob should now have 0 sessions
    const updatedBobCard = document.querySelector('[data-user-email="bob@example.com"]');
    expect(updatedBobCard?.textContent).toContain('0 sessions');
    
    // Alice should still have her 3 sessions
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]');
    expect(aliceCard?.textContent).toContain('3 sessions');
    
    // Verify by loading Alice's sessions
    click(aliceCard as HTMLElement);
    await waitForElement('[data-session-id="session-alice-1"]');
    
    const sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(3);
  });

  test('should handle users with single session', async () => {
    // Load users - Charlie has 1 session
    await waitForElement('[data-user-email="charlie@example.com"]');
    const charlieCard = document.querySelector('[data-user-email="charlie@example.com"]');
    expect(charlieCard?.textContent).toContain('1 sessions');
    
    // Select Charlie and load his session
    click(charlieCard as HTMLElement);
    await waitForElement('[data-session-id="session-charlie-1"]');
    
    let sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(1);
    
    // Delete all Charlie's sessions (just 1)
    const deleteAllBtn = document.querySelector('[data-user-email="charlie@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    click(deleteAllBtn);
    await wait(50);
    
    const yesBtn = document.querySelector('[data-user-email="charlie@example.com"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for deletion
    await wait(300);
    
    // Should show empty state
    const emptyState = document.querySelector('.empty-state');
    expect(emptyState?.textContent).toContain('No sessions yet');
    
    // No sessions should remain
    sessionCards = document.querySelectorAll('.session-card');
    expect(sessionCards).toHaveLength(0);
  });
});
