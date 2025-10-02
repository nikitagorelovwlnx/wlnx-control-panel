import { Coach } from '../types/api.js';
import { ApiClient } from '../api/client.js';

export class CoachConfiguration {
    private container: HTMLElement;
    private apiClient: ApiClient;
    private coaches: Coach[] = [];
    private activeCoachId: string = '';

    constructor(container: HTMLElement, apiClient: ApiClient) {
        this.container = container;
        this.apiClient = apiClient;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🔄 CoachConfiguration: Loading coaches...');
            await this.loadCoaches();
            console.log('✅ CoachConfiguration: Coaches loaded, rendering...');
            this.render();
            console.log('✅ CoachConfiguration: Render complete');
        } catch (error) {
            console.error('❌ Failed to initialize coach configuration:', error);
            this.showError('Failed to load coach configuration');
        }
    }

    private async loadCoaches(): Promise<void> {
        this.coaches = await this.apiClient.getCoaches();
        console.log('📊 CoachConfiguration: Loaded coaches:', {
            count: this.coaches.length,
            coaches: this.coaches.map(c => ({ id: c.id, name: c.name, promptLength: c.coach_prompt_content?.length || 0 }))
        });
        
        // Log full coach data for debugging
        this.coaches.forEach(coach => {
            console.log('🔍 Coach details:', {
                id: coach.id,
                name: coach.name,
                coach_prompt_content: coach.coach_prompt_content,
                promptLength: coach.coach_prompt_content?.length || 0
            });
        });

        // Set first coach as active if none selected
        if (this.coaches.length > 0 && !this.activeCoachId) {
            this.activeCoachId = this.coaches[0].id;
            console.log('🎯 Set active coach ID:', this.activeCoachId);
        }
    }

    private render(): void {
        if (!this.coaches || this.coaches.length === 0) {
            this.showError('No coaches available');
            return;
        }

        const activeCoach = this.coaches.find(c => c.id === this.activeCoachId) || this.coaches[0];
        if (!activeCoach) {
            this.showError('No active coach found');
            return;
        }
        
        console.log('🎯 Rendering coach:', {
            activeCoachId: this.activeCoachId,
            activeCoach: activeCoach,
            activeCoachKeys: Object.keys(activeCoach),
            promptValue: activeCoach.coach_prompt_content,
            promptType: typeof activeCoach.coach_prompt_content,
            promptLength: activeCoach.coach_prompt_content?.length || 0
        });

        const html = `
            <div class="coach-configuration">
                <div class="coach-header">
                    <h3>Coach Configuration</h3>
                    <p>Configure the main coaching assistant prompt</p>
                </div>
                
                <div class="coach-selector">
                    <label for="coach-select">Select Coach:</label>
                    <select id="coach-select" class="coach-select">
                        ${this.coaches.map(coach => `
                            <option value="${coach.id}" ${coach.id === this.activeCoachId ? 'selected' : ''}>
                                ${coach.name}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="coach-details">
                    <div class="coach-info">
                        <h4>${activeCoach.name}</h4>
                        ${activeCoach.description ? `<p class="coach-description">${activeCoach.description}</p>` : ''}
                    </div>
                    
                    <div class="coach-prompt-section">
                        <label for="coach-prompt">Coach Prompt:</label>
                        <textarea 
                            id="coach-prompt" 
                            class="coach-prompt-textarea"
                            placeholder="Enter the main coaching prompt..."
                            rows="12"
                        ></textarea>
                        <div class="prompt-info">
                            <span class="char-count">${(activeCoach.coach_prompt_content || '').length} characters</span>
                        </div>
                    </div>
                    
                    <div class="coach-actions">
                        <button class="btn btn-primary" id="save-coach">Save Coach</button>
                        <button class="btn btn-secondary" id="reset-coach">Reset to Default</button>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        // Set textarea content immediately after DOM update
        const textarea = document.getElementById('coach-prompt') as HTMLTextAreaElement;
        console.log('🔍 Attempting to set textarea content:', {
            textareaExists: !!textarea,
            promptExists: !!activeCoach.coach_prompt_content,
            coach_prompt_content: activeCoach.coach_prompt_content,
            promptLength: activeCoach.coach_prompt_content?.length || 0,
            promptTruthy: !!activeCoach.coach_prompt_content,
            promptEmpty: activeCoach.coach_prompt_content === '',
            promptUndefined: activeCoach.coach_prompt_content === undefined,
            promptNull: activeCoach.coach_prompt_content === null
        });
        
        if (textarea) {
            if (activeCoach.coach_prompt_content) {
            // Try multiple methods to set the value
            textarea.value = activeCoach.coach_prompt_content;
            textarea.textContent = activeCoach.coach_prompt_content;
            textarea.innerHTML = activeCoach.coach_prompt_content;
            
            console.log('✅ Successfully set textarea content:', {
                textareaValue: textarea.value,
                textareaValueLength: textarea.value.length,
                textContent: textarea.textContent,
                innerHTML: textarea.innerHTML
            });
            
            // Also try setting via requestAnimationFrame
            requestAnimationFrame(() => {
                textarea.value = activeCoach.coach_prompt_content;
                console.log('🔄 Set via requestAnimationFrame:', textarea.value.length);
            });
            
            // Update character count
            const charCount = document.querySelector('.char-count');
            if (charCount) {
                charCount.textContent = `${textarea.value.length} characters`;
            }
            } else {
                console.warn('⚠️ No prompt content to set:', {
                    prompt: activeCoach.coach_prompt_content,
                    promptType: typeof activeCoach.coach_prompt_content
                });
            }
        } else {
            console.error('❌ Textarea element not found after setting innerHTML');
        }
        
        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // Coach selection
        const coachSelect = document.getElementById('coach-select') as HTMLSelectElement;
        if (coachSelect) {
            coachSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.activeCoachId = target.value;
                this.render();
            });
        }

        // Prompt textarea
        const promptTextarea = document.getElementById('coach-prompt') as HTMLTextAreaElement;
        if (promptTextarea) {
            // Update character count on input
            promptTextarea.addEventListener('input', (e) => {
                const target = e.target as HTMLTextAreaElement;
                const charCount = document.querySelector('.char-count');
                if (charCount) {
                    const value = target.value || '';
                    charCount.textContent = `${value.length} characters`;
                }
            });

            // Update coach data on change
            promptTextarea.addEventListener('change', (e) => {
                const target = e.target as HTMLTextAreaElement;
                const activeCoach = this.coaches.find(c => c.id === this.activeCoachId);
                if (activeCoach) {
                    activeCoach.coach_prompt_content = target.value;
                }
            });
        }

        // Save button
        const saveBtn = document.getElementById('save-coach');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveCoach();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('reset-coach');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetCoach();
            });
        }
    }

    private async saveCoach(): Promise<void> {
        const activeCoach = this.coaches.find(c => c.id === this.activeCoachId);
        if (!activeCoach) return;

        try {
            // Show saving state
            this.showSaving();
            
            // Get current prompt from textarea
            const promptTextarea = document.getElementById('coach-prompt') as HTMLTextAreaElement;
            const currentPrompt = promptTextarea?.value || activeCoach.coach_prompt_content;
            
            console.log('💾 Saving coach:', activeCoach.id, 'with prompt length:', currentPrompt.length);
            
            // Save to server
            await this.apiClient.updateCoach(activeCoach.id, currentPrompt);
            
            // Update local data
            activeCoach.coach_prompt_content = currentPrompt;
            activeCoach.updatedAt = new Date().toISOString();
            
            this.showSuccess('Coach configuration saved successfully!');
        } catch (error) {
            console.error('Failed to save coach configuration:', error);
            this.showError('Failed to save coach configuration');
        }
    }

    private resetCoach(): void {
        const activeCoach = this.coaches.find(c => c.id === this.activeCoachId);
        if (!activeCoach) return;

        // Reset to default prompt
        const defaultPrompt = 'You are Anna, a professional wellness coach. You help people with nutrition, fitness, and overall health. Be empathetic, supportive, and provide practical advice. Always maintain a warm and encouraging tone.';
        
        activeCoach.coach_prompt_content = defaultPrompt;
        
        // Update textarea
        const promptTextarea = document.getElementById('coach-prompt') as HTMLTextAreaElement;
        if (promptTextarea) {
            promptTextarea.value = defaultPrompt;
            
            // Update character count
            const charCount = document.querySelector('.char-count');
            if (charCount) {
                charCount.textContent = `${(defaultPrompt || '').length} characters`;
            }
        }
        
        this.showSuccess('Coach prompt reset to default');
    }

    public async reloadConfiguration(): Promise<void> {
        try {
            console.log('🔄 Reloading coach configuration from server');
            this.showLoading();
            await this.loadCoaches();
            this.render();
            this.showSuccess('Coach configuration reloaded from server');
        } catch (error) {
            console.error('Failed to reload coach configuration:', error);
            this.showError('Failed to reload coach configuration');
        }
    }

    private showLoading(): void {
        this.container.innerHTML = '<div class="loading">Loading coach configuration...</div>';
    }

    private showSaving(): void {
        const saveBtn = document.getElementById('save-coach') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }
    }

    private showSuccess(message: string): void {
        this.showMessage(message, 'success');
        
        // Reset save button
        const saveBtn = document.getElementById('save-coach') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Coach';
        }
    }

    private showError(message: string): void {
        this.showMessage(message, 'error');
        
        // Reset save button
        const saveBtn = document.getElementById('save-coach') as HTMLButtonElement;
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Coach';
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
