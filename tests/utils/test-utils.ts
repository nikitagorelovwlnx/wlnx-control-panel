import { resetMockState } from '../setup';
import { ControlPanel } from '../../src/index';

// Setup DOM for each test
export const setupDOM = () => {
  document.body.innerHTML = `
    <div class="app-container">
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <h1>WLNX Control Panel</h1>
            <p>User sessions management interface</p>
          </div>
          <div class="header-right">
            <div class="status-grid">
              <div class="status-item">
                <div class="status-dot" id="server-status"></div>
                <span>Server</span>
              </div>
              <div class="status-item">
                <div class="status-dot" id="bot-status"></div>
                <span>Bot</span>
              </div>
            </div>
            <button class="refresh-btn" id="refresh-data">Refresh</button>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <!-- App Level Tabs -->
        <div class="app-tabs">
          <button class="app-tab-btn active" data-tab="dashboard">Dashboard</button>
          <button class="app-tab-btn" data-tab="prompts">Prompts Configuration</button>
        </div>

        <!-- Dashboard Tab Content -->
        <div class="app-tab-content active" id="app-tab-dashboard">
          <div class="panels-container" id="panels-container">
          <!-- Panel 1: Users List -->
          <div class="panel users-panel" id="users-panel">
            <div class="panel-header">
              <h2>Users</h2>
              <div class="panel-header-actions">
                <button class="collapse-panel-btn" id="collapse-users" title="Collapse">←</button>
              </div>
            </div>
            <div class="panel-content">
              <div id="users-list" class="users-container">
              </div>
            </div>
          </div>

          <!-- Panel 2: User Sessions -->
          <div class="panel sessions-panel" id="sessions-panel">
            <div class="panel-header">
              <div class="panel-header-left">
                <h2>Sessions</h2>
                <span class="panel-subtitle" id="selected-user-name"></span>
              </div>
              <div class="panel-header-actions">
                <button class="collapse-panel-btn" id="collapse-sessions" title="Collapse">←</button>
                <button class="close-panel-btn" id="close-sessions">✕</button>
              </div>
            </div>
            <div class="panel-content">
              <div id="sessions-list" class="sessions-container">
              </div>
            </div>
          </div>

          <!-- Panel 3: Session Details -->
          <div class="panel details-panel" id="details-panel">
            <div class="panel-header">
              <h2>Session Details</h2>
              <div class="panel-header-actions">
                <button class="collapse-panel-btn" id="collapse-details" title="Collapse">←</button>
                <button class="close-panel-btn" id="close-details">✕</button>
              </div>
            </div>
            <div class="panel-content">
              <div class="details-container">
                <div class="details-tabs">
                  <button class="tab-btn active" data-tab="summary">Summary</button>
                  <button class="tab-btn" data-tab="transcript">Transcript</button>
                  <button class="tab-btn" data-tab="wellness">Wellness</button>
                </div>
                
                <div class="tab-content-container">
                  <div class="tab-content active" id="summary-tab">
                    <div class="tab-body">
                      <div id="summary-content"></div>
                    </div>
                  </div>
                  
                  <div class="tab-content" id="transcript-tab">
                    <div class="tab-body">
                      <div id="transcript-content"></div>
                    </div>
                  </div>
                  
                  <div class="tab-content" id="tab-wellness">
                    <div class="tab-body" id="wellness-content"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Prompts Configuration Tab Content -->
        <div class="app-tab-content" id="app-tab-prompts">
          <div class="prompts-container">
            <div class="prompts-header">
              <h2>Prompts Configuration</h2>
              <p>Configure conversation prompts for each stage of the wellness coaching interview</p>
              <div class="prompts-actions">
                <button class="btn btn-primary" id="save-prompts">Save Configuration</button>
                <button class="btn btn-secondary" id="reload-prompts">Reload from Server</button>
              </div>
            </div>
            
            <div class="prompts-content" id="prompts-content">
              <div class="loading">Loading prompts configuration...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// Clean up after each test
export const cleanup = () => {
  document.body.innerHTML = '';
  resetMockState();
};

// Wait for element to appear
export const waitForElement = (selector: string, timeout = 2000): Promise<Element> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
};

// Wait for element to disappear
export const waitForElementToBeRemoved = (selector: string, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (!element) {
      resolve();
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (!element) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} still exists after ${timeout}ms`));
    }, timeout);
  });
};

// Simulate user click
export const click = (element: Element) => {
  const event = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  element.dispatchEvent(event);
};

// Wait for async operations
export const wait = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Setup app with DOM and initialize control panel
export const setupApp = async () => {
  setupDOM();
  new ControlPanel(); // Initialize control panel
  await wait(100); // Allow initialization
};
