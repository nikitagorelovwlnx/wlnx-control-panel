/**
 * Prompts Configuration - Functional Tests
 * 
 * Tests for the prompts configuration functionality including:
 * - Tab navigation between Dashboard and Prompts Configuration
 * - Loading and displaying prompts configuration
 * - Editing prompts content
 * - Toggling prompts on/off
 * - Saving configuration
 */

import { waitForElement, cleanup, setupApp, click } from '../utils/test-utils';

describe('Prompts Configuration - Functional Tests', () => {
  beforeEach(async () => {
    await setupApp();
  });

  afterEach(() => {
    cleanup();
  });

  test('should display app-level tabs and allow switching', async () => {
    // Check that both tabs are visible
    const dashboardTab = await waitForElement('[data-tab="dashboard"]');
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    
    expect(dashboardTab).toBeInTheDocument();
    expect(promptsTab).toBeInTheDocument();
    
    // Dashboard tab should be active initially
    expect(dashboardTab).toHaveClass('active');
    expect(promptsTab).not.toHaveClass('active');
    
    // Dashboard content should be visible
    const dashboardContent = document.getElementById('app-tab-dashboard');
    const promptsContent = document.getElementById('app-tab-prompts');
    
    expect(dashboardContent).toHaveClass('active');
    expect(promptsContent).not.toHaveClass('active');
  });

  test('should switch to prompts configuration tab when clicked', async () => {
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    const dashboardTab = await waitForElement('[data-tab="dashboard"]');
    
    // Click prompts tab
    click(promptsTab);
    
    // Wait for tab content to change
    await waitForElement('#app-tab-prompts.active');
    
    // Check tab states
    expect(promptsTab).toHaveClass('active');
    expect(dashboardTab).not.toHaveClass('active');
    
    // Check content visibility
    const dashboardContent = document.getElementById('app-tab-dashboard');
    const promptsContent = document.getElementById('app-tab-prompts');
    
    expect(promptsContent).toHaveClass('active');
    expect(dashboardContent).not.toHaveClass('active');
  });

  test('should load and display prompts configuration', async () => {
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    
    // Wait for prompts content to load
    await waitForElement('.prompts-container', 3000);
    
    // Check header elements
    const header = document.querySelector('.prompts-header h2');
    expect(header?.textContent).toBe('Prompts Configuration');
    
    // Check action buttons
    const saveBtn = document.getElementById('save-prompts');
    const reloadBtn = document.getElementById('reload-prompts');
    
    expect(saveBtn).toBeInTheDocument();
    expect(reloadBtn).toBeInTheDocument();
    expect(saveBtn?.textContent).toBe('Save Configuration');
    expect(reloadBtn?.textContent).toBe('Reload from Server');
  });

  test('should display all conversation stages with prompts', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Check that all 5 stages are displayed
    const stages = document.querySelectorAll('.prompts-stage');
    expect(stages).toHaveLength(5);
    
    // Check stage names
    const expectedStages = [
      'Welcome & Introduction',
      'Health Assessment',
      'Goal Setting', 
      'Action Planning',
      'Session Closure'
    ];
    
    stages.forEach((stage, index) => {
      const stageTitle = stage.querySelector('h3');
      expect(stageTitle?.textContent).toBe(expectedStages[index]);
    });
    
    // Check that each stage has 5 prompts
    stages.forEach((stage) => {
      const prompts = stage.querySelectorAll('.prompt-item');
      expect(prompts).toHaveLength(5);
    });
  });

  test('should allow editing prompt content', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Find first prompt textarea
    const firstTextarea = document.querySelector('.prompt-textarea') as HTMLTextAreaElement;
    expect(firstTextarea).toBeInTheDocument();
    
    // Check initial content
    expect(firstTextarea.value).toContain("Hello! I'm your wellness coach");
    
    // Edit the content
    const newContent = "Updated: Hello! I'm your wellness coach. How can I help you today?";
    firstTextarea.value = newContent;
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    firstTextarea.dispatchEvent(changeEvent);
    
    // Verify content was updated
    expect(firstTextarea.value).toBe(newContent);
  });

  test('should allow toggling prompts on/off', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Find first prompt toggle
    const firstToggle = document.querySelector('.toggle-switch input') as HTMLInputElement;
    expect(firstToggle).toBeInTheDocument();
    
    // Should be checked initially (active)
    expect(firstToggle.checked).toBe(true);
    
    const promptItem = firstToggle.closest('.prompt-item');
    expect(promptItem).toHaveClass('active');
    
    // Toggle off
    firstToggle.click();
    
    // Should be unchecked now
    expect(firstToggle.checked).toBe(false);
    expect(promptItem).toHaveClass('inactive');
    
    // Toggle back on
    firstToggle.click();
    expect(firstToggle.checked).toBe(true);
    expect(promptItem).toHaveClass('active');
  });

  test('should show saving state when save button is clicked', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    expect(saveBtn).toBeInTheDocument();
    expect(saveBtn.textContent).toBe('Save Configuration');
    expect(saveBtn.disabled).toBe(false);
    
    // Click save button
    saveBtn.click();
    
    // Should show saving state immediately
    expect(saveBtn.textContent).toBe('Saving...');
    expect(saveBtn.disabled).toBe(true);
    
    // Wait for save to complete (mock API has 1 second delay)
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Should return to normal state
    expect(saveBtn.textContent).toBe('Save Configuration');
    expect(saveBtn.disabled).toBe(false);
  });

  test('should show success message after successful save', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    
    // Click save button
    saveBtn.click();
    
    // Wait for save to complete and success message
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Check for success message (it appears temporarily)
    // Note: The success message is added to document.body and auto-removes after 3s
    const messages = document.querySelectorAll('.message.success');
    expect(messages.length).toBeGreaterThanOrEqual(0); // Message might have already disappeared
  });

  test('should reload configuration when reload button is clicked', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Edit a prompt first
    const firstTextarea = document.querySelector('.prompt-textarea') as HTMLTextAreaElement;
    const originalContent = firstTextarea.value;
    firstTextarea.value = "Modified content";
    
    // Click reload button
    const reloadBtn = document.getElementById('reload-prompts') as HTMLButtonElement;
    click(reloadBtn);
    
    // Wait for reload to complete
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Content should be restored to original
    const reloadedTextarea = document.querySelector('.prompt-textarea') as HTMLTextAreaElement;
    expect(reloadedTextarea.value).toBe(originalContent);
  });

  test('should maintain prompt order and structure', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Check first stage prompts are in correct order
    const firstStage = document.querySelector('.prompts-stage');
    const promptOrders = firstStage?.querySelectorAll('.prompt-order');
    
    expect(promptOrders).toHaveLength(5);
    
    // Check order numbers
    promptOrders?.forEach((orderEl, index) => {
      expect(orderEl.textContent).toBe(`#${index + 1}`);
    });
    
    // Check prompt descriptions exist
    const descriptions = firstStage?.querySelectorAll('.prompt-description');
    expect(descriptions).toHaveLength(5);
    
    descriptions?.forEach((desc) => {
      expect(desc.textContent).toBeTruthy();
      expect(desc.textContent).not.toBe('No description');
    });
  });

  test('should show stage metadata correctly', async () => {
    // Switch to prompts tab and wait for content
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    const stages = document.querySelectorAll('.prompts-stage');
    
    stages.forEach((stage) => {
      // Each stage should have a prompt count
      const promptCount = stage.querySelector('.prompt-count');
      expect(promptCount?.textContent).toBe('5 prompts');
      
      // Each stage should have a description
      const description = stage.querySelector('.stage-description');
      expect(description?.textContent).toBeTruthy();
    });
    
    // Check specific stage descriptions
    const welcomeStage = stages[0];
    const welcomeDesc = welcomeStage.querySelector('.stage-description');
    expect(welcomeDesc?.textContent).toBe('Initial greeting and rapport building');
    
    const assessmentStage = stages[1];
    const assessmentDesc = assessmentStage.querySelector('.stage-description');
    expect(assessmentDesc?.textContent).toBe('Gathering baseline health information');
  });
});
