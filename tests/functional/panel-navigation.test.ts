import { ControlPanel } from '../../src/index';
import { setupDOM, cleanup, waitForElement, click, wait } from '../utils/test-utils';

describe('Panel Navigation - Functional Tests', () => {
  beforeEach(async () => {
    setupDOM();
    new ControlPanel(); // Initialize control panel
    await wait(100); // Allow initialization
  });

  afterEach(() => {
    cleanup();
  });

  test('should show only users panel initially', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const usersPanel = document.getElementById('users-panel');
    const sessionsPanel = document.getElementById('sessions-panel');
    const detailsPanel = document.getElementById('details-panel');
    
    // Users panel should be visible (no active class needed for first panel)
    expect(usersPanel?.classList.contains('collapsed')).toBe(false);
    
    // Other panels should not be active
    expect(sessionsPanel?.classList.contains('active')).toBe(false);
    expect(detailsPanel?.classList.contains('active')).toBe(false);
  });

  test('should activate sessions panel when user is selected', async () => {
    await waitForElement('[data-user-email="alice@example.com"]');
    
    const sessionsPanel = document.getElementById('sessions-panel');
    expect(sessionsPanel?.classList.contains('active')).toBe(false);
    
    // Click on Alice
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await wait(200);
    
    // Sessions panel should now be active
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    
    // User should be highlighted as selected
    expect(aliceCard.classList.contains('active')).toBe(true);
  });

  test('should activate details panel when session is selected', async () => {
    // Load Alice's sessions
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    const detailsPanel = document.getElementById('details-panel');
    expect(detailsPanel?.classList.contains('active')).toBe(false);
    
    // Click on a session
    const sessionCard = document.querySelector('[data-session-id="session-alice-1"]') as HTMLElement;
    click(sessionCard);
    
    await wait(200);
    
    // Details panel should now be active
    expect(detailsPanel?.classList.contains('active')).toBe(true);
    
    // Session should be highlighted as selected
    expect(sessionCard.classList.contains('active')).toBe(true);
  });

  test('should close sessions panel when close button is clicked', async () => {
    // Open sessions panel
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await wait(200);
    const sessionsPanel = document.getElementById('sessions-panel');
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    
    // Click close button
    const closeButton = document.getElementById('close-sessions') as HTMLElement;
    click(closeButton);
    
    await wait(200);
    
    // Sessions panel should no longer be active
    expect(sessionsPanel?.classList.contains('active')).toBe(false);
    
    // User should no longer be selected
    expect(aliceCard.classList.contains('active')).toBe(false);
  });

  test('should close details panel when close button is clicked', async () => {
    // Open sessions and details panels
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    const sessionCard = document.querySelector('[data-session-id="session-alice-1"]') as HTMLElement;
    click(sessionCard);
    
    await wait(200);
    const detailsPanel = document.getElementById('details-panel');
    expect(detailsPanel?.classList.contains('active')).toBe(true);
    
    // Click close button
    const closeButton = document.getElementById('close-details') as HTMLElement;
    click(closeButton);
    
    await wait(200);
    
    // Details panel should no longer be active
    expect(detailsPanel?.classList.contains('active')).toBe(false);
    
    // Session should no longer be selected
    expect(sessionCard.classList.contains('active')).toBe(false);
  });

  test('should switch between users while keeping sessions panel open', async () => {
    // Select Alice
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    
    const sessionsPanel = document.getElementById('sessions-panel');
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    expect(aliceCard.classList.contains('active')).toBe(true);
    
    // Switch to Bob
    const bobCard = document.querySelector('[data-user-email="bob@example.com"]') as HTMLElement;
    click(bobCard);
    
    await waitForElement('[data-session-id="session-bob-1"]');
    
    // Sessions panel should still be active
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    
    // Alice should no longer be selected, Bob should be selected
    expect(aliceCard.classList.contains('active')).toBe(false);
    expect(bobCard.classList.contains('active')).toBe(true);
    
    // Should show Bob's sessions
    expect(document.querySelector('[data-session-id="session-bob-1"]')).toBeTruthy();
    expect(document.querySelector('[data-session-id="session-alice-1"]')).toBeNull();
  });

  test('should switch between sessions while keeping details panel open', async () => {
    // Load Alice's sessions and select first one
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    const session1Card = document.querySelector('[data-session-id="session-alice-1"]') as HTMLElement;
    click(session1Card);
    
    await wait(200);
    const detailsPanel = document.getElementById('details-panel');
    expect(detailsPanel?.classList.contains('active')).toBe(true);
    expect(session1Card.classList.contains('active')).toBe(true);
    
    // Switch to second session
    const session2Card = document.querySelector('[data-session-id="session-alice-2"]') as HTMLElement;
    click(session2Card);
    
    await wait(200);
    
    // Details panel should still be active
    expect(detailsPanel?.classList.contains('active')).toBe(true);
    
    // First session should no longer be selected, second should be selected
    expect(session1Card.classList.contains('active')).toBe(false);
    expect(session2Card.classList.contains('active')).toBe(true);
  });

  test('should collapse panels when collapse button is clicked', async () => {
    // Load sessions panel
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await wait(200);
    const sessionsPanel = document.getElementById('sessions-panel');
    expect(sessionsPanel?.classList.contains('collapsed')).toBe(false);
    
    // Click collapse button
    const collapseButton = document.getElementById('collapse-sessions') as HTMLElement;
    click(collapseButton);
    
    await wait(200);
    
    // Sessions panel should be collapsed
    expect(sessionsPanel?.classList.contains('collapsed')).toBe(true);
  });

  test('should maintain panel state when switching users', async () => {
    // Select Alice and open details panel
    await waitForElement('[data-user-email="alice@example.com"]');
    const aliceCard = document.querySelector('[data-user-email="alice@example.com"]') as HTMLElement;
    click(aliceCard);
    
    await waitForElement('[data-session-id="session-alice-1"]');
    const sessionCard = document.querySelector('[data-session-id="session-alice-1"]') as HTMLElement;
    click(sessionCard);
    
    await wait(200);
    const sessionsPanel = document.getElementById('sessions-panel');
    const detailsPanel = document.getElementById('details-panel');
    
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    expect(detailsPanel?.classList.contains('active')).toBe(true);
    
    // Switch to Bob
    const bobCard = document.querySelector('[data-user-email="bob@example.com"]') as HTMLElement;
    click(bobCard);
    
    await waitForElement('[data-session-id="session-bob-1"]');
    
    // Sessions panel should still be active, but details panel should close
    expect(sessionsPanel?.classList.contains('active')).toBe(true);
    expect(detailsPanel?.classList.contains('active')).toBe(false);
  });
});
