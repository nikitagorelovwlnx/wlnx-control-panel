import { PromptsConfiguration, ConversationStage, Prompt } from '../types/api.js';
import { ApiClient } from '../api/client.js';

export class PromptsConfigurationComponent {
    private container: HTMLElement;
    private apiClient: ApiClient;
    private currentConfig: PromptsConfiguration | null = null;

    constructor(container: HTMLElement, apiClient: ApiClient) {
        this.container = container;
        this.apiClient = apiClient;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🔄 PromptsConfiguration: Loading configuration...');
            await this.loadConfiguration();
            console.log('✅ PromptsConfiguration: Configuration loaded, rendering...');
            this.render();
            console.log('✅ PromptsConfiguration: Render complete');
        } catch (error) {
            console.error('❌ Failed to initialize prompts configuration:', error);
            this.showError('Failed to load prompts configuration');
        }
    }

    private async loadConfiguration(): Promise<void> {
        this.currentConfig = await this.apiClient.getPromptsConfiguration();
        console.log('📊 PromptsConfiguration: Loaded config:', {
            stages: this.currentConfig?.stages?.length || 0,
            prompts: this.currentConfig?.prompts?.length || 0,
            data: this.currentConfig
        });
    }


    private render(): void {
        if (!this.currentConfig) {
            this.showError('No configuration available');
            return;
        }

        const html = `
            <div class="prompts-stages">
                ${this.currentConfig.stages.map(stage => this.renderStage(stage)).join('')}
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    private renderStage(stage: ConversationStage): string {
        const stagePrompts = this.currentConfig!.prompts.filter(p => p.stageId === stage.id);
        
        return `
            <div class="prompts-stage" data-stage-id="${stage.id}">
                <div class="stage-header">
                    <h3>${stage.name}</h3>
                    <p class="stage-description">${stage.description}</p>
                    <div class="stage-meta">
                        <span class="prompt-count">${stagePrompts.length} prompts</span>
                    </div>
                </div>
                <div class="stage-prompts">
                    ${stagePrompts.map(prompt => this.renderPrompt(prompt)).join('')}
                </div>
            </div>
        `;
    }

    private renderPrompt(prompt: Prompt): string {
        return `
            <div class="prompt-item ${prompt.isActive ? 'active' : 'inactive'}" data-prompt-id="${prompt.id}">
                <div class="prompt-header">
                    <div class="prompt-controls">
                        <label class="toggle-switch">
                            <input type="checkbox" ${prompt.isActive ? 'checked' : ''} 
                                   onchange="window.promptsConfig.togglePrompt('${prompt.id}')">
                            <span class="toggle-slider"></span>
                        </label>
                        <span class="prompt-order">#${prompt.order}</span>
                    </div>
                    <div class="prompt-description">${prompt.description || 'No description'}</div>
                </div>
                <div class="prompt-content">
                    <textarea 
                        class="prompt-textarea" 
                        data-prompt-id="${prompt.id}"
                        placeholder="Enter prompt text..."
                        onchange="window.promptsConfig.updatePromptContent('${prompt.id}', this.value)"
                    >${prompt.content}</textarea>
                </div>
            </div>
        `;
    }

    private attachEventListeners(): void {
        // Make this component globally accessible for inline event handlers
        (window as any).promptsConfig = this;
    }

    public togglePrompt(promptId: string): void {
        if (!this.currentConfig) return;

        const prompt = this.currentConfig.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.isActive = !prompt.isActive;
            this.updatePromptDisplay(promptId);
        }
    }

    public updatePromptContent(promptId: string, content: string): void {
        if (!this.currentConfig) return;

        const prompt = this.currentConfig.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.content = content;
        }
    }

    private updatePromptDisplay(promptId: string): void {
        const promptElement = this.container.querySelector(`[data-prompt-id="${promptId}"]`);
        if (promptElement) {
            const prompt = this.currentConfig!.prompts.find(p => p.id === promptId);
            if (prompt) {
                promptElement.classList.toggle('active', prompt.isActive);
                promptElement.classList.toggle('inactive', !prompt.isActive);
            }
        }
    }

    public async saveConfiguration(): Promise<void> {
        if (!this.currentConfig) return;

        try {
            // Show saving indicator
            this.showSaving();
            
            // Update timestamp before saving
            this.currentConfig.lastUpdated = new Date().toISOString();
            
            // Save to server
            await this.apiClient.updatePromptsConfiguration(this.currentConfig);
            
            this.showSuccess('Configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.showError('Failed to save configuration');
        }
    }

    public async reloadConfiguration(): Promise<void> {
        try {
            this.showLoading();
            
            // Clear localStorage to force reload from server
            localStorage.removeItem('wlnx-prompts-config');
            console.log('🔄 Cleared local modifications, reloading from server');
            
            await this.loadConfiguration();
            this.render();
            this.showSuccess('Configuration reloaded from server');
        } catch (error) {
            console.error('Failed to reload configuration:', error);
            this.showError('Failed to reload configuration');
        }
    }

    private showLoading(): void {
        this.container.innerHTML = '<div class="loading">Loading prompts configuration...</div>';
    }

    private showSaving(): void {
        const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
    }

    private showSuccess(message: string): void {
        this.showMessage(message, 'success');
        
        const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Configuration';
        }
    }

    private showError(message: string): void {
        this.showMessage(message, 'error');
        this.container.innerHTML = `<div class="error-message">${message}</div>`;
        
        const saveBtn = document.getElementById('save-prompts') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Configuration';
        }
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        // Create and show a temporary message
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}
