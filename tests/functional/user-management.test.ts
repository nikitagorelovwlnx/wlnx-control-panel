import { ControlPanel } from '../../src/index';
import { setupDOM, cleanup, waitForElement, click, wait } from '../utils/test-utils';

describe('User Management - Functional Tests', () => {
  beforeEach(async () => {
    setupDOM();
    new ControlPanel(); // Initialize control panel
    await wait(100); // Allow initialization
  });

  afterEach(() => {
    cleanup();
  });

  test('should load and display users list', async () => {
    // Wait for users to be loaded and displayed
    await waitForElement('[data-user-email="alice@example.com"]');
    
    // Check that all users are displayed
    const userCards = document.querySelectorAll('.user-card');
    expect(userCards).toHaveLength(3);
    
    // Check user details
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]');
    expect(aliceCard?.textContent).toContain('alice');
    expect(aliceCard?.textContent).toContain('3 sessions');
    
    const bobCard = document.querySelector('[data-user-email="bob@example.com"]');
    expect(bobCard?.textContent).toContain('bob');
    expect(bobCard?.textContent).toContain('2 sessions');
    
    const charlieCard = document.querySelector('[data-user-email="charlie@example.com"]');
    expect(charlieCard?.textContent).toContain('charlie');
    expect(charlieCard?.textContent).toContain('1 sessions');
  });

  test('should show loading state initially', async () => {
    // On initialization, should show loading state
    const loadingElement = document.querySelector('.loading');
    if (loadingElement) {
      expect(loadingElement.textContent).toContain('Loading');
    }
    
    // Then users should load
    await waitForElement('[data-user-email="alice@example.com"]');
  });

  test('should display user avatars with correct initials', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const aliceAvatar = document.querySelector('[data-user-email="alice@example.com"] .user-avatar');
    const bobAvatar = document.querySelector('[data-user-email="bob@example.com"] .user-avatar');
    const charlieAvatar = document.querySelector('[data-user-email="charlie@example.com"] .user-avatar');
    
    expect(aliceAvatar?.textContent).toBe('A');
    expect(bobAvatar?.textContent).toBe('B');
    expect(charlieAvatar?.textContent).toBe('C');
  });

  test('should display delete all sessions button on each user card', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const deleteButtons = document.querySelectorAll('.delete-all-user-sessions-btn');
    expect(deleteButtons).toHaveLength(3);
    
    // Check that each button has the correct user email
    const aliceDeleteBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn');
    const bobDeleteBtn = document.querySelector('[data-user-email="bob@example.com"] .delete-all-user-sessions-btn');
    const charlieDeleteBtn = document.querySelector('[data-user-email="charlie@example.com"] .delete-all-user-sessions-btn');
    
    expect(aliceDeleteBtn?.getAttribute('data-user-email')).toBe('alice@example.com');
    expect(bobDeleteBtn?.getAttribute('data-user-email')).toBe('bob@example.com'); 
    expect(charlieDeleteBtn?.getAttribute('data-user-email')).toBe('charlie@example.com');
  });

  test('should show confirm dialog when delete all button is clicked', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const deleteBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    expect(deleteBtn).toBeTruthy();
    
    // Initially confirm actions should be hidden
    const confirmActions = document.querySelector('[data-user-email="alice@example.com"] .confirm-actions') as HTMLElement;
    expect(confirmActions.style.display).toBe('none');
    
    // Click delete button
    click(deleteBtn);
    await wait(50);
    
    // Confirm actions should now be visible
    expect(confirmActions.style.display).toBe('flex');
    expect(deleteBtn.style.display).toBe('none');
    
    // Should have Yes and No buttons
    const yesBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-yes');
    const noBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-no');
    
    expect(yesBtn).toBeTruthy();
    expect(noBtn).toBeTruthy();
  });

  test('should hide confirm dialog when No is clicked', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const deleteBtn = document.querySelector('[data-user-email="alice@example.com"] .delete-all-user-sessions-btn') as HTMLElement;
    const confirmActions = document.querySelector('[data-user-email="alice@example.com"] .confirm-actions') as HTMLElement;
    
    // Show confirm dialog
    click(deleteBtn);
    await wait(50);
    expect(confirmActions.style.display).toBe('flex');
    
    // Click No button
    const noBtn = document.querySelector('[data-user-email="alice@example.com"] .confirm-no') as HTMLElement;
    click(noBtn);
    await wait(50);
    
    // Confirm dialog should be hidden
    expect(confirmActions.style.display).toBe('none');
    expect(deleteBtn.style.display).toBe('block');
  });
});
