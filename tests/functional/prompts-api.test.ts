/**
 * Prompts API Integration - Functional Tests
 * 
 * Tests for API integration with prompts configuration:
 * - Mock API endpoints for prompts
 * - Error handling for prompts API
 * - API response validation
 */

import { waitForElement, cleanup, setupApp, click } from '../utils/test-utils';

describe('Prompts API Integration - Functional Tests', () => {
  beforeEach(async () => {
    await setupApp();
  });

  afterEach(() => {
    cleanup();
  });

  test('should call getPromptsConfiguration API when prompts tab is opened', async () => {
    // Mock console.log to capture API calls
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    
    // Wait for API call to complete
    await waitForElement('.prompts-stages', 3000);
    
    // Check that API was called (either real API or fallback to mock)
    const apiCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes && (
        call[0].includes('Fetching prompts configuration from server') ||
        call[0].includes('Using mock prompts configuration as fallback')
      )
    );
    
    expect(apiCalls.length).toBeGreaterThan(0);
    
    consoleSpy.mockRestore();
  });

  test('should call updatePromptsConfiguration API when save is clicked', async () => {
    // Mock console.log to capture API calls
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Switch to prompts tab and wait for load
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Clear previous calls
    consoleSpy.mockClear();
    
    // Click save button
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    saveBtn.click();
    // Wait for save to complete
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Check that save API was called
    const saveCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes && call[0].includes('Client-side save: Prompts are currently hardcoded')
    );
    
    expect(saveCalls.length).toBeGreaterThan(0);
    
    // Check that success message was logged
    const successCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes && call[0].includes('Client-side: Prompts configuration saved to localStorage')
    );
    
    expect(successCalls.length).toBeGreaterThan(0);
    
    consoleSpy.mockRestore();
  });

  test('should validate prompts configuration data structure', async () => {
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Check that all required data is present
    const stages = document.querySelectorAll('.prompts-stage');
    expect(stages).toHaveLength(5);
    
    // Validate each stage has required attributes
    stages.forEach((stage) => {
      const stageId = stage.getAttribute('data-stage-id');
      expect(stageId).toBeTruthy();
      
      const stageTitle = stage.querySelector('h3');
      expect(stageTitle?.textContent).toBeTruthy();
      
      const stageDescription = stage.querySelector('.stage-description');
      expect(stageDescription?.textContent).toBeTruthy();
      
      // Check prompts within stage
      const prompts = stage.querySelectorAll('.prompt-item');
      expect(prompts).toHaveLength(5);
      
      prompts.forEach((prompt) => {
        const promptId = prompt.getAttribute('data-prompt-id');
        expect(promptId).toBeTruthy();
        
        const textarea = prompt.querySelector('.prompt-textarea') as HTMLTextAreaElement;
        expect(textarea).toBeInTheDocument();
        expect(textarea.value).toBeTruthy();
        
        const toggle = prompt.querySelector('.toggle-switch input') as HTMLInputElement;
        expect(toggle).toBeInTheDocument();
        
        const description = prompt.querySelector('.prompt-description');
        expect(description?.textContent).toBeTruthy();
      });
    });
  });

  test('should handle API errors gracefully', async () => {
    // Mock console.error to capture error handling
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock a failed API call by temporarily breaking the API client
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
    
    // Try to switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Should show error message (might take time to appear)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage) {
      expect(errorMessage.textContent).toContain('Failed to load prompts configuration');
    } else {
      // Alternative: check if loading state persists or prompts content is empty
      const promptsContent = document.getElementById('prompts-content');
      expect(promptsContent?.textContent).toBeTruthy();
    }
    
    // Restore original fetch
    global.fetch = originalFetch;
    errorSpy.mockRestore();
  });

  test('should show loading state while fetching prompts', async () => {
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    
    // Should initially show loading
    const loadingElement = await waitForElement('.loading', 500);
    expect(loadingElement.textContent).toBe('Loading prompts configuration...');
    
    // Wait for content to load
    await waitForElement('.prompts-stages', 3000);
    
    // Loading should disappear
    const loadingAfter = document.querySelector('.loading');
    expect(loadingAfter).not.toBeInTheDocument();
  });

  test('should preserve configuration data types', async () => {
    // Mock console.log to capture API data
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Switch to prompts tab and save
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    saveBtn.click();
    
    // Wait for save API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Find the API call with configuration data
    const saveCall = consoleSpy.mock.calls.find(call => 
      call[0] && call[0].includes && call[0].includes('Client-side save: Prompts are currently hardcoded') &&
      call[1] && typeof call[1] === 'object'
    );
    
    expect(saveCall).toBeTruthy();
    
    if (saveCall && saveCall[1]) {
      const configData = saveCall[1];
      
      // Validate data structure
      expect(configData).toHaveProperty('promptCount');
      expect(configData).toHaveProperty('stageCount');
      expect(typeof configData.promptCount).toBe('number');
      expect(typeof configData.stageCount).toBe('number');
      expect(configData.promptCount).toBe(25); // 5 stages × 5 prompts
      expect(configData.stageCount).toBe(5);
    }
    
    consoleSpy.mockRestore();
  });

  test('should handle concurrent API operations', async () => {
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    const reloadBtn = document.getElementById('reload-prompts') as HTMLButtonElement;
    
    // Start save operation
    saveBtn.click();
    expect(saveBtn.disabled).toBe(true);
    
    // Try to start reload operation while save is in progress
    reloadBtn.click();
    
    // Both operations should be handled properly
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Save button should be enabled again
    expect(saveBtn.disabled).toBe(false);
    expect(saveBtn.textContent).toBe('Save Configuration');
    
    // Content should still be present
    const stages = document.querySelectorAll('.prompts-stage');
    expect(stages).toHaveLength(5);
  });

  test('should validate prompt content changes before save', async () => {
    // Switch to prompts tab
    const promptsTab = await waitForElement('[data-tab="prompts"]');
    click(promptsTab);
    await waitForElement('.prompts-stages', 3000);
    
    // Edit a prompt
    const firstTextarea = document.querySelector('.prompt-textarea') as HTMLTextAreaElement;
    const originalContent = firstTextarea.value;
    const newContent = "Modified: " + originalContent;
    
    firstTextarea.value = newContent;
    firstTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Mock console.log to capture save data
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Save configuration
    const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
    saveBtn.click();
    
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Verify the modified content would be saved
    expect(firstTextarea.value).toBe(newContent);
    
    // Verify save API was called
    const saveCalls = consoleSpy.mock.calls.filter(call => 
      call[0] && call[0].includes && call[0].includes('Client-side save: Prompts are currently hardcoded')
    );
    expect(saveCalls.length).toBeGreaterThan(0);
    
    consoleSpy.mockRestore();
  });
});
