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
        // Restore last active tab or default to dashboard  
        const savedTab = localStorage.getItem('activeTab') || 'dashboard';
        this.showTab(savedTab);
    }

    private setupEventListeners(): void {
        // Tab navigation  
        const tabButtons = document.querySelectorAll('.app-tab-btn');
        console.log('🔄 Found tab buttons:', tabButtons.length);
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = (e.target as HTMLElement).getAttribute('data-tab');
                console.log('📱 Tab clicked:', tabId);
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
        console.log('🔄 Showing tab:', tabId);
        
        // Update tab buttons
        document.querySelectorAll('.app-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        // Update tab content
        console.log('🔄 Updating tab content for:', tabId);
        
        // Handle tab visibility
        const dashboardTab = document.getElementById('app-tab-dashboard');
        const promptsTab = document.getElementById('app-tab-prompts');
        const panelsContainer = document.getElementById('panels-container');
        
        // Hide all tabs first
        if (dashboardTab) {
            dashboardTab.style.display = 'none';
            dashboardTab.classList.remove('active');
        }
        if (promptsTab) {
            promptsTab.style.display = 'none';
            promptsTab.classList.remove('active');
        }
        
        // Show selected tab
        if (tabId === 'dashboard') {
            if (dashboardTab) {
                dashboardTab.style.display = 'flex';
                dashboardTab.classList.add('active');
            }
            if (panelsContainer) {
                panelsContainer.style.display = 'flex';
            }
        } else if (tabId === 'prompts') {
            if (promptsTab) {
                promptsTab.style.display = 'flex';
                promptsTab.classList.add('active');
            }
            if (panelsContainer) {
                panelsContainer.style.display = 'none';
            }
        }
        
        document.querySelectorAll('.app-tab-content').forEach(content => {
            const contentTabId = content.id.replace('app-tab-', '');
            const isActive = contentTabId === tabId;
            
            if (isActive) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
            
            console.log(`  - ${content.id}: active=${isActive}, classes="${content.className}"`);
        });

        // Initialize prompts configuration if needed
        if (tabId === 'prompts') {
            console.log('🎯 Prompts tab selected...');
            
            // Check element visibility after CSS changes
            setTimeout(() => {
                const promptsTab = document.getElementById('app-tab-prompts');
                if (promptsTab) {
                    const rect = promptsTab.getBoundingClientRect();
                    console.log(`app-tab-prompts dimensions: ${rect.width}x${rect.height}`);
                    
                    if (rect.width === 0 || rect.height === 0) {
                        console.log('🔧 Element still has zero dimensions, applying fix...');
                        // Apply the minimal fix that worked
                        let parent = promptsTab.parentElement;
                        let level = 0;
                        while (parent && level < 5) {
                            const parentRect = parent.getBoundingClientRect();
                            if (parentRect.width === 0 || parentRect.height === 0) {
                                parent.style.setProperty('display', 'flex', 'important');
                                parent.style.setProperty('width', '100%', 'important');
                                parent.style.setProperty('height', '100%', 'important');
                                parent.style.setProperty('min-height', '500px', 'important');
                                console.log(`Fixed parent level ${level}: ${parent.tagName}#${parent.id}`);
                            }
                            parent = parent.parentElement;
                            level++;
                        }
                    }
                }
            }, 100);
            
            // Only initialize if we don't have a prompts config yet
            if (!this.promptsConfig) {
                console.log('🔄 First time on prompts tab, initializing...');
                this.initializePromptsConfig();
            } else {
                console.log('🔄 Prompts config already exists, keeping current state');
            }
        }

        this.currentTab = tabId;
        // Save active tab to localStorage
        localStorage.setItem('activeTab', tabId);
    }

    private async initializePromptsConfig(): Promise<void> {
        console.log('🔄 Initializing prompts configuration...');
        console.log('🔍 Looking for element with ID: prompts-content');
        
        // Check all elements with 'prompts' in ID
        const allPromptsElements = document.querySelectorAll('[id*="prompts"]');
        console.log('🔍 All elements with "prompts" in ID:', allPromptsElements);
        allPromptsElements.forEach(el => {
            console.log(`  - ${el.id}:`, el);
        });
        
        const container = document.getElementById('prompts-content');
        if (!container) {
            console.error('❌ Prompts content container not found!');
            console.log('🔍 Checking if app-tab-prompts exists:', document.getElementById('app-tab-prompts'));
            return;
        }

        try {
            this.promptsConfig = new PromptsConfigurationComponent(container, this.apiClient);
            console.log('✅ PromptsConfigurationComponent created, calling initialize...');
            await this.promptsConfig.initialize();
            console.log('✅ Prompts configuration initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize prompts configuration:', error);
        }
    }


    private async savePrompts(): Promise<void> {
        // This method is no longer used - individual stage save buttons handle saving
        console.log('Global save prompts called - use individual stage save buttons instead');
    }

    private async reloadPrompts(): Promise<void> {
        if (this.promptsConfig) {
            await this.promptsConfig.reloadConfiguration();
        }
    }

    public getCurrentTab(): string {
        return this.currentTab;
    }

    public async refreshPromptsConfiguration(): Promise<void> {
        if (this.promptsConfig) {
            console.log('🔄 Refreshing existing prompts configuration...');
            await this.promptsConfig.reloadConfiguration();
        } else {
            console.log('🔄 No existing prompts config, initializing...');
            await this.initializePromptsConfig();
        }
    }
}
