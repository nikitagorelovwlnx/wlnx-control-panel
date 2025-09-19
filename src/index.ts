import { ApiClient } from './api/client.js';
import { PanelsController } from './components/PanelsController.js';

class ControlPanel {
    private apiClient: ApiClient;
    private panelsController: PanelsController;

    constructor() {
        this.apiClient = new ApiClient();
        this.panelsController = new PanelsController(this.apiClient);
        
        this.init();
    }

    private async init(): Promise<void> {
        await this.loadInitialData();
        this.setupEventHandlers();
        
        // Start periodic status checks
        setInterval(() => {
            this.checkSystemStatus();
        }, 30000); // Check every 30 seconds
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
            console.error('Failed to check system status:', error);
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
