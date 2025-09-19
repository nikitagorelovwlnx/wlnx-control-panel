import { ControlPanel } from '../../src/index';
import { setupDOM, cleanup, waitForElement, click, wait } from '../utils/test-utils';

describe('Error Handling - Functional Tests', () => {
  beforeEach(async () => {
    setupDOM();
    new ControlPanel(); // Initialize control panel
    await wait(100); // Allow initialization
  });

  afterEach(() => {
    cleanup();
  });

  test('should handle session deletion failure gracefully', async () => {
    // Load Alice's sessions first
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Override fetch to simulate deletion failure
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Deletion failed' }),
      } as Response)
    );

    const deleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn') as HTMLElement;
    click(deleteBtn);
    await wait(50);
    
    const yesBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for the operation to complete
    await wait(300);
    
    // Session should still be in the DOM (deletion failed)
    const sessionCard = document.querySelector('[data-session-id="session-alice-1"]');
    expect(sessionCard).toBeTruthy();
    
    // Confirm dialog should be hidden
    const confirmActions = document.querySelector('[data-session-id="session-alice-1"] .confirm-actions') as HTMLElement;
    expect(confirmActions.style.display).toBe('none');
  });

  test('should handle session not found error', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    // Override fetch to simulate session not found
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Session not found' }),
      } as Response)
    );

    const deleteBtn = document.querySelector('[data-session-id="session-alice-1"] .delete-btn') as HTMLElement;
    click(deleteBtn);
    await wait(50);
    
    const yesBtn = document.querySelector('[data-session-id="session-alice-1"] .confirm-yes') as HTMLElement;
    click(yesBtn);
    
    // Wait for the operation to complete
    await wait(300);
    
    // Session should still be in the DOM (deletion failed)
    const sessionCard = document.querySelector('[data-session-id="session-alice-1"]');
    expect(sessionCard).toBeTruthy();
  });

  test('should display users correctly with normal API response', async () => {
    // Should load users normally
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const userCards = document.querySelectorAll('.user-card');
    expect(userCards).toHaveLength(3);
    
    // Check that all expected users are present
    expect(document.querySelector('[data-user-email="alice@example.com"]')).toBeTruthy();
    expect(document.querySelector('[data-user-email="bob@example.com"]')).toBeTruthy();
    expect(document.querySelector('[data-user-email="charlie@example.com"]')).toBeTruthy();
  });
});
