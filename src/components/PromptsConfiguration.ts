import { PromptsConfiguration } from '../types/api.js';
import { ApiClient } from '../api/client.js';

export class PromptsConfigurationComponent {
    private container: HTMLElement;
    private apiClient: ApiClient;
    private currentConfig: PromptsConfiguration | null = null;
    private activeStageId: string = '';

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

        // Set first stage as active if none selected
        if (!this.activeStageId && this.currentConfig.stages.length > 0) {
            this.activeStageId = this.currentConfig.stages[0].id;
        }

        const html = `
            <div class="prompts-tabs">
                ${this.currentConfig.stages.map(stage => `
                    <button class="stage-tab-btn ${stage.id === this.activeStageId ? 'active' : ''}" 
                            data-stage="${stage.id}">
                        ${stage.name}
                    </button>
                `).join('')}
            </div>
            
            <div class="prompts-tab-content">
                ${this.currentConfig.stages.map(stage => `
                    <div class="stage-content ${stage.id === this.activeStageId ? 'active' : ''}" 
                         data-stage="${stage.id}">
                        <div class="stage-header">
                            <div class="stage-actions">
                                <button class="btn btn-primary" id="save-${stage.id}">Save Stage</button>
                                <button class="btn btn-secondary" id="reload-${stage.id}">Reload from Server</button>
                            </div>
                        </div>
                        
                        <div class="stage-prompts">
                            ${this.renderStagePrompts(stage.id)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    private renderStagePrompts(stageId: string): string {
        const stagePrompts = this.currentConfig!.prompts.filter(p => p.stageId === stageId);
        
        return stagePrompts.map(prompt => `
            <div class="prompt-item" data-prompt-id="${prompt.id}">
                <div class="prompt-header">
                    <span class="prompt-order">#${prompt.order}</span>
                    <div class="prompt-description">${prompt.description || 'No description'}</div>
                </div>
                <div class="prompt-content">
                    <textarea 
                        class="prompt-textarea" 
                        data-prompt-id="${prompt.id}"
                        placeholder="Enter prompt text..."
                    >${prompt.content}</textarea>
                </div>
            </div>
        `).join('');
    }



    private attachEventListeners(): void {
        // Stage tab navigation
        document.querySelectorAll('.stage-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const stageId = (e.target as HTMLElement).getAttribute('data-stage');
                if (stageId) {
                    this.showStage(stageId);
                }
            });
        });

        // Save and Reload buttons for each stage
        this.currentConfig?.stages.forEach(stage => {
            const saveBtn = document.getElementById(`save-${stage.id}`);
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveStageConfiguration(stage.id);
                });
            }
            
            const reloadBtn = document.getElementById(`reload-${stage.id}`);
            if (reloadBtn) {
                reloadBtn.addEventListener('click', () => {
                    this.reloadConfiguration();
                });
            }
        });

        // Textarea change handlers
        document.querySelectorAll('.prompt-textarea').forEach(textarea => {
            textarea.addEventListener('change', (e) => {
                const target = e.target as HTMLTextAreaElement;
                const promptId = target.getAttribute('data-prompt-id');
                if (promptId) {
                    this.updatePromptContent(promptId, target.value);
                }
            });
        });
    }

    private showStage(stageId: string): void {
        this.activeStageId = stageId;
        
        // Update tab buttons
        document.querySelectorAll('.stage-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-stage') === stageId);
        });

        // Update tab content
        document.querySelectorAll('.stage-content').forEach(content => {
            content.classList.toggle('active', content.getAttribute('data-stage') === stageId);
        });
    }


    public updatePromptContent(promptId: string, content: string): void {
        if (!this.currentConfig) return;

        const prompt = this.currentConfig.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.content = content;
        }
    }


    public async saveStageConfiguration(stageId: string): Promise<void> {
        if (!this.currentConfig) return;

        try {
            // Show saving indicator
            this.showSaving(stageId);
            
            // Get prompts for this stage
            const stagePrompts = this.currentConfig.prompts.filter(p => p.stageId === stageId);
            
            // Save to server
            await this.apiClient.updateStagePrompts(stageId, stagePrompts);
            
            this.showSuccess(`${this.getStageName(stageId)} prompts saved successfully!`);
        } catch (error) {
            console.error('Failed to save stage configuration:', error);
            this.showError(`Failed to save ${this.getStageName(stageId)} prompts`);
        }
    }

    private getStageName(stageId: string): string {
        const stage = this.currentConfig?.stages.find(s => s.id === stageId);
        return stage?.name || stageId;
    }

    public async reloadConfiguration(): Promise<void> {
        try {
            this.showLoading();
            
            console.log('🔄 Reloading configuration from server');
            
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

    private showSaving(stageId: string): void {
        const saveBtn = document.getElementById(`save-${stageId}`) as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
    }

    private showSuccess(message: string): void {
        this.showMessage(message, 'success');
        
        // Reset all save buttons
        this.currentConfig?.stages.forEach(stage => {
            const saveBtn = document.getElementById(`save-${stage.id}`) as HTMLButtonElement;
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Stage';
            }
        });
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
