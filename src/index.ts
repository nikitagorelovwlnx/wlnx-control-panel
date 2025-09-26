import { ApiClient } from './api/client.js';
import { PanelsController } from './components/PanelsController.js';
import { AppTabController } from './components/AppTabController.js';

export class ControlPanel {
    private apiClient: ApiClient;
    private panelsController: PanelsController;
    private appTabController: AppTabController; // Handles main app tabs (Dashboard/Prompts)

    constructor() {
        console.log('🚀 Initializing WLNX Control Panel...');
        this.apiClient = new ApiClient();
        this.panelsController = new PanelsController(this.apiClient);
        this.appTabController = new AppTabController(this.apiClient); // Self-initializing controller
        console.log('✅ AppTabController created');
        
        this.init();
    }

    private async init(): Promise<void> {
        await this.loadInitialData();
        this.setupEventHandlers();
        
        // Start periodic data refresh - very fast polling for instant updates
        setInterval(() => {
            this.checkSystemStatus();
            this.refreshData();
        }, 500); // Check every 0.5 seconds for instant updates
    }

    private setupEventHandlers(): void {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-btn');
        refreshBtn?.addEventListener('click', () => {
            this.refresh();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC key to close panels
            if (e.key === 'Escape') {
                if (this.panelsController.isDetailsPanelOpen()) {
                    document.getElementById('close-details')?.click();
                } else if (this.panelsController.isSessionsPanelOpen()) {
                    document.getElementById('close-sessions')?.click();
                }
            }
        });
    }

    private async checkSystemStatus(): Promise<void> {
        try {
            const status = await this.apiClient.getSystemStatus();
            
            const serverStatusElement = document.getElementById('server-status-text');
            const botStatusElement = document.getElementById('bot-status-text');
            const serverDot = document.querySelector('#server-status .status-dot');
            const botDot = document.querySelector('#bot-status .status-dot');
            
            if (serverStatusElement) {
                serverStatusElement.textContent = status.server ? 'Online' : 'Offline';
            }
            
            if (serverDot) {
                serverDot.classList.toggle('online', status.server);
                serverDot.classList.toggle('offline', !status.server);
            }
            
            if (botStatusElement) {
                botStatusElement.textContent = status.bot ? 'Online' : 'Offline';
            }
            
            if (botDot) {
                botDot.classList.toggle('online', status.bot);
                botDot.classList.toggle('offline', !status.bot);
            }
        } catch (error) {
            console.debug('Failed to check system status (servers offline):', error);
            
            // Update UI to show servers are offline
            const serverStatusElement = document.getElementById('server-status-text');
            const botStatusElement = document.getElementById('bot-status-text');
            const serverDot = document.querySelector('#server-status .status-dot');
            const botDot = document.querySelector('#bot-status .status-dot');
            
            if (serverStatusElement) {
                serverStatusElement.textContent = 'Offline';
            }
            if (botStatusElement) {
                botStatusElement.textContent = 'Offline';
            }
            if (serverDot) {
                serverDot.classList.remove('online');
                serverDot.classList.add('offline');
            }
            if (botDot) {
                botDot.classList.remove('online');
                botDot.classList.add('offline');
            }
        }
    }

    private async loadInitialData(): Promise<void> {
        await Promise.all([
            this.panelsController.loadUsers(),
            this.checkSystemStatus()
        ]);
    }

    private async refresh(): Promise<void> {
        console.log('Refreshing data...');
        await this.panelsController.refresh();
        await this.checkSystemStatus();
        
        // Refresh prompts configuration if on prompts tab
        if (this.appTabController.getCurrentTab() === 'prompts') {
            console.log('Refreshing prompts configuration...');
            await this.appTabController.refreshPromptsConfiguration();
        }
    }

    private async refreshData(): Promise<void> {
        // Silent refresh without logging to avoid spam in console
        try {
            await this.panelsController.refreshSilently();
            
            // Refresh prompts configuration if on prompts tab
            if (this.appTabController.getCurrentTab() === 'prompts') {
                await this.appTabController.refreshPromptsConfiguration();
            }
        } catch (error) {
            // Silent error handling - don't spam console with errors
            console.debug('Silent refresh failed:', error);
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        new ControlPanel();
        console.log('WLNX Control Panel initialized successfully');
    } catch (error) {
        console.error('Failed to initialize WLNX Control Panel:', error);
    }
});
