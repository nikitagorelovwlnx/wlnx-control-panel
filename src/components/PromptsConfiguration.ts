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
        
        // Try to restore active stage from localStorage immediately
        const savedActiveStage = localStorage.getItem('wlnx-active-prompts-stage');
        if (savedActiveStage) {
            this.activeStageId = savedActiveStage;
            console.log('🔄 Constructor: Restored active stage from localStorage:', savedActiveStage);
        }
        
        // Listen for storage changes from other tabs/windows
        window.addEventListener('storage', (e) => {
            if (e.key === 'wlnx-active-prompts-stage' && e.newValue) {
                console.log('🔄 Storage event: Active stage changed to:', e.newValue);
                this.activeStageId = e.newValue;
            }
        });
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

        // ALWAYS check localStorage first - this is the source of truth
        const savedActiveStage = localStorage.getItem('wlnx-active-prompts-stage');
        console.log('🔄 Render: localStorage contains:', savedActiveStage);
        console.log('🔄 Render: Current activeStageId before validation:', this.activeStageId);
        
        // If localStorage has a valid stage, use it regardless of current activeStageId
        if (savedActiveStage && this.currentConfig.stages.find(s => s.id === savedActiveStage)) {
            if (this.activeStageId !== savedActiveStage) {
                console.log('🔄 Render: Overriding activeStageId with localStorage value:', savedActiveStage);
                this.activeStageId = savedActiveStage;
            }
        }
        
        // Final validation - if still no valid activeStageId, use default
        if (!this.activeStageId || !this.currentConfig.stages.find(s => s.id === this.activeStageId)) {
            if (this.currentConfig.stages.length > 0) {
                this.activeStageId = this.currentConfig.stages[0].id;
                console.log('🔄 Render: Set default active stage:', this.activeStageId);
            }
        } else {
            console.log('🔄 Render: Using final active stage:', this.activeStageId);
        }
        
        // Always save current active stage to localStorage to ensure persistence
        if (this.activeStageId) {
            localStorage.setItem('wlnx-active-prompts-stage', this.activeStageId);
            console.log('💾 Render: Saved active stage to localStorage:', this.activeStageId);
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
                ${this.currentConfig.stages.map(stage => `
                    <div class="stage-content ${stage.id === this.activeStageId ? 'active' : ''}" 
                         data-stage="${stage.id}">
                        <div class="stage-header">
                            <div class="stage-actions">
                                <button class="btn btn-primary" id="save-${stage.id}">Save Stage</button>
                                <button class="btn btn-danger" id="restore-${stage.id}">Restore Defaults</button>
                                <div class="restore-confirm-actions" style="display: none;" id="confirm-${stage.id}">
                                    <button class="confirm-yes" data-stage-id="${stage.id}" title="Yes, restore defaults">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                    <button class="confirm-no" data-stage-id="${stage.id}" title="No, cancel">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                </div>
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
            
            const restoreBtn = document.getElementById(`restore-${stage.id}`);
            if (restoreBtn) {
                restoreBtn.addEventListener('click', () => {
                    this.showRestoreConfirmDialog(stage.id);
                });
            }
        });

        // Textarea change handlers
        document.querySelectorAll('.prompt-textarea').forEach(textarea => {
            // Handle both 'change' (when losing focus) and 'input' (while typing)
            const updateHandler = (e: Event) => {
                const target = e.target as HTMLTextAreaElement;
                const promptId = target.getAttribute('data-prompt-id');
                if (promptId) {
                    this.updatePromptContent(promptId, target.value);
                }
            };
            
            textarea.addEventListener('change', updateHandler);
            textarea.addEventListener('input', updateHandler);
        });

        // Restore confirmation handlers
        document.querySelectorAll('.confirm-yes, .confirm-no').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const button = target.closest('button') as HTMLButtonElement;
                const stageId = button.getAttribute('data-stage-id');
                
                if (stageId) {
                    if (button.classList.contains('confirm-yes')) {
                        this.restoreStageDefaults(stageId);
                    } else {
                        this.hideRestoreConfirmDialog(stageId);
                    }
                }
            });
        });
    }

    private showStage(stageId: string): void {
        console.log('🎯 showStage called with:', stageId);
        this.activeStageId = stageId;
        
        // Save active stage to localStorage
        localStorage.setItem('wlnx-active-prompts-stage', stageId);
        console.log('💾 showStage: Saved to localStorage:', stageId);
        
        // Verify it was saved
        const verified = localStorage.getItem('wlnx-active-prompts-stage');
        console.log('✅ showStage: Verified localStorage contains:', verified);
        
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

    private syncPromptsFromTextareas(): void {
        if (!this.currentConfig) return;

        // Get all textarea elements and update corresponding prompts
        const textareas = document.querySelectorAll('.prompt-textarea') as NodeListOf<HTMLTextAreaElement>;
        
        textareas.forEach(textarea => {
            const promptId = textarea.getAttribute('data-prompt-id');
            if (promptId) {
                const currentValue = textarea.value;
                const prompt = this.currentConfig!.prompts.find(p => p.id === promptId);
                if (prompt) {
                    prompt.content = currentValue;
                    console.log(`📝 Updated prompt ${promptId} with content length:`, currentValue.length);
                }
            }
        });
    }


    public async saveStageConfiguration(stageId: string): Promise<void> {
        if (!this.currentConfig) return;

        try {
            // Show saving indicator
            this.showSaving(stageId);
            
            // Update all prompt contents from current textarea values BEFORE saving
            this.syncPromptsFromTextareas();
            
            // Get prompts for this stage
            const stagePrompts = this.currentConfig.prompts.filter(p => p.stageId === stageId);
            
            console.log('💾 Saving prompts for stage:', stageId, stagePrompts);
            
            // Save to server
            await this.apiClient.updateStagePrompts(stageId, stagePrompts);
            
            this.showSuccess(`${this.getStageName(stageId)} prompts saved successfully!`);
        } catch (error) {
            console.error('Failed to save stage configuration:', error);
            this.showError(`Failed to save ${this.getStageName(stageId)} prompts`);
        }
    }

    private showRestoreConfirmDialog(stageId: string): void {
        const restoreBtn = document.getElementById(`restore-${stageId}`);
        const confirmActions = document.getElementById(`confirm-${stageId}`);
        
        if (restoreBtn && confirmActions) {
            restoreBtn.style.display = 'none';
            confirmActions.style.display = 'flex';
        }
    }

    private hideRestoreConfirmDialog(stageId: string): void {
        const restoreBtn = document.getElementById(`restore-${stageId}`);
        const confirmActions = document.getElementById(`confirm-${stageId}`);
        
        if (restoreBtn && confirmActions) {
            restoreBtn.style.display = 'block';
            confirmActions.style.display = 'none';
        }
    }

    public async restoreStageDefaults(stageId: string): Promise<void> {
        if (!this.currentConfig) return;

        try {
            // Hide confirmation dialog
            this.hideRestoreConfirmDialog(stageId);

            // Show saving indicator on restore button
            const restoreBtn = document.getElementById(`restore-${stageId}`) as HTMLButtonElement;
            if (restoreBtn) {
                restoreBtn.disabled = true;
                restoreBtn.textContent = 'Restoring...';
            }

            // Get stage name and prompts for this stage
            const stageName = this.getStageName(stageId);
            const stagePrompts = this.currentConfig.prompts.filter(p => p.stageId === stageId);
            
            // Clear prompt contents (set to empty string, which will be saved as null)
            stagePrompts.forEach(prompt => {
                prompt.content = '';
            });

            console.log('🔄 Restoring defaults for stage:', stageId, 'Clearing', stagePrompts.length, 'prompts');

            // Save cleared prompts to server
            await this.apiClient.updateStagePrompts(stageId, stagePrompts);

            // Reload configuration from server to get actual defaults
            console.log('🔄 Reloading configuration to get defaults...');
            await this.reloadConfiguration();

            this.showSuccess(`${stageName} prompts restored to defaults and saved!`);
        } catch (error) {
            console.error('Failed to restore stage defaults:', error);
            this.showError(`Failed to restore ${this.getStageName(stageId)} defaults`);
        } finally {
            // Reset restore button
            const restoreBtn = document.getElementById(`restore-${stageId}`) as HTMLButtonElement;
            if (restoreBtn) {
                restoreBtn.disabled = false;
                restoreBtn.textContent = 'Restore Defaults';
            }
        }
    }

    private getStageName(stageId: string): string {
        const stage = this.currentConfig?.stages.find(s => s.id === stageId);
        return stage?.name || stageId;
    }

    public async reloadConfiguration(): Promise<void> {
        try {
            console.log('🔄 Reloading configuration from server');
            
            // Save current active stage to restore after reload - check localStorage first
            const savedActiveStage = localStorage.getItem('wlnx-active-prompts-stage');
            const currentActiveStage = savedActiveStage || this.activeStageId;
            console.log('🔄 reloadConfiguration: Current active stage from localStorage:', savedActiveStage);
            console.log('🔄 reloadConfiguration: Current active stage from instance:', this.activeStageId);
            console.log('🔄 reloadConfiguration: Will use active stage:', currentActiveStage);
            
            this.showLoading();
            await this.loadConfiguration();
            
            // Force restore the active stage - don't let render() override it
            if (currentActiveStage && this.currentConfig?.stages.find(s => s.id === currentActiveStage)) {
                this.activeStageId = currentActiveStage;
                localStorage.setItem('wlnx-active-prompts-stage', currentActiveStage);
                console.log('🔄 reloadConfiguration: Restored active stage:', currentActiveStage);
            } else if (this.currentConfig && this.currentConfig.stages.length > 0) {
                // Fallback to first stage if saved stage is not found
                this.activeStageId = this.currentConfig.stages[0].id;
                localStorage.setItem('wlnx-active-prompts-stage', this.activeStageId);
                console.log('🔄 reloadConfiguration: Fallback to first stage:', this.activeStageId);
            }
            
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
