import { PromptsConfigurationComponent } from './PromptsConfiguration.js';
import { ApiClient } from '../api/client.js';

export class AppTabController {
    private currentTab: string = 'dashboard';
    private promptsConfig: PromptsConfigurationComponent | null = null;
    private apiClient: ApiClient;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        this.initialize();
    }

    private initialize(): void {
        this.setupEventListeners();
        this.showTab('dashboard');
    }

    private setupEventListeners(): void {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.app-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = (e.target as HTMLElement).getAttribute('data-tab');
                if (tabId) {
                    this.showTab(tabId);
                }
            });
        });

        // Prompts configuration actions
        document.getElementById('save-prompts')?.addEventListener('click', () => {
            this.savePrompts();
        });

        document.getElementById('reload-prompts')?.addEventListener('click', () => {
            this.reloadPrompts();
        });
    }

    private showTab(tabId: string): void {
        // Update tab buttons
        document.querySelectorAll('.app-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        // Update tab content
        document.querySelectorAll('.app-tab-content').forEach(content => {
            const contentTabId = content.id.replace('app-tab-', '');
            content.classList.toggle('active', contentTabId === tabId);
        });

        // Initialize prompts configuration if needed
        if (tabId === 'prompts' && !this.promptsConfig) {
            this.initializePromptsConfig();
        }

        this.currentTab = tabId;
    }

    private async initializePromptsConfig(): Promise<void> {
        const container = document.getElementById('prompts-content');
        if (!container) return;

        this.promptsConfig = new PromptsConfigurationComponent(container, this.apiClient);
        await this.promptsConfig.initialize();
    }

    private async savePrompts(): Promise<void> {
        if (this.promptsConfig) {
            await this.promptsConfig.saveConfiguration();
        }
    }

    private async reloadPrompts(): Promise<void> {
        if (this.promptsConfig) {
            await this.promptsConfig.reloadConfiguration();
        }
    }

    public getCurrentTab(): string {
        return this.currentTab;
    }
}
