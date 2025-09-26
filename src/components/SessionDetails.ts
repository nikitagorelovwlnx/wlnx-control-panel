import { Interview } from '../types/api.js';
import { TabsController } from './TabsController.js';
import { WellnessForm } from './WellnessForm.js';

export class SessionDetails {
    private summaryContainer: HTMLElement;
    private transcriptContainer: HTMLElement;
    private wellnessContainer: HTMLElement;
    private tabsController: TabsController;
    private wellnessForm: WellnessForm;

    constructor(detailsContainer: HTMLElement) {
        this.summaryContainer = detailsContainer.querySelector('#summary-content')!;
        this.transcriptContainer = detailsContainer.querySelector('#transcript-content')!;
        this.wellnessContainer = detailsContainer.querySelector('#wellness-content')!;
        
        this.tabsController = new TabsController(detailsContainer);
        this.wellnessForm = new WellnessForm(this.wellnessContainer);
    }

    showSession(session: Interview): void {
        console.log('SessionDetails.showSession called with:', session);
        console.log('Session object keys:', Object.keys(session));
        console.log('Session.transcription:', session.transcription);
        console.log('Session.transcript:', (session as any).transcript);
        console.log('Session.messages:', (session as any).messages);
        console.log('Session.content:', (session as any).content);
        console.log('Full session data:', JSON.stringify(session, null, 2));
        
        this.renderSummary(session);
        this.renderTranscript(session);
        this.renderWellness(session);
        
        // Switch to summary tab by default
        this.tabsController.switchTab('summary');
    }

    private renderSummary(session: Interview): void {
        console.log('Rendering summary for session:', session.id);
        console.log('Summary container:', this.summaryContainer);
        
        const formattedDate = new Date(session.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const userEmail = (session as any).user_id || session.email || 'Unknown user';
        
        const summaryHtml = `
            <div class="summary-container">
                <div class="session-info-card">
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-icon">📅</div>
                            <div class="info-content">
                                <span class="info-label">Date</span>
                                <span class="info-value">${formattedDate}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">👤</div>
                            <div class="info-content">
                                <span class="info-label">User</span>
                                <span class="info-value">${this.escapeHtml(userEmail)}</span>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">🆔</div>
                            <div class="info-content">
                                <span class="info-label">Session ID</span>
                                <span class="info-value">#${session.id.substring(0, 12)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="summary-content-card">
                    <div class="card-header">
                        <h4>📝 Session Summary</h4>
                    </div>
                    <div class="summary-text">
                        <p>${this.escapeHtml(session.summary || 'No summary available.')}</p>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Setting summary HTML:', summaryHtml);
        this.summaryContainer.innerHTML = summaryHtml;
    }

    private renderTranscript(session: Interview): void {
        console.log('Rendering transcript for session:', session.id);
        console.log('Transcript container:', this.transcriptContainer);
        
        // Try different field names
        const transcriptionData = session.transcription || 
                                 (session as any).transcript || 
                                 (session as any).messages || 
                                 (session as any).content ||
                                 (session as any).conversation ||
                                 (session as any).text;
        
        console.log('Found transcription data:', transcriptionData);
        console.log('Transcription type:', typeof transcriptionData);
        console.log('Transcription length:', transcriptionData?.length);
        
        if (!transcriptionData || (typeof transcriptionData === 'string' && transcriptionData.trim() === '')) {
            this.transcriptContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No transcription</h3>
                    <p>No transcription available for this session.</p>
                </div>
            `;
            return;
        }

        // Convert transcription data to string if needed
        let transcriptText = '';
        if (typeof transcriptionData === 'string') {
            transcriptText = transcriptionData;
        } else if (Array.isArray(transcriptionData)) {
            transcriptText = transcriptionData.map(item => {
                if (typeof item === 'string') return item;
                if (item.content) return item.content;
                if (item.text) return item.text;
                return JSON.stringify(item);
            }).join('\n');
        } else {
            transcriptText = JSON.stringify(transcriptionData, null, 2);
        }

        // Format transcript as a dialog
        const dialogHtml = this.formatTranscriptAsDialog(transcriptText);
        
        const transcriptHtml = `
            <div class="transcript-container">
                <div class="transcript-header">
                    <h4>💬 Conversation Transcript</h4>
                    <div class="transcript-meta">
                        <span class="transcript-length">${transcriptText.length} characters</span>
                    </div>
                </div>
                <div class="dialog-content">
                    ${dialogHtml}
                </div>
            </div>
        `;
        
        console.log('Setting transcript HTML:', transcriptHtml);
        console.log('Transcript HTML length:', transcriptHtml.length);
        this.transcriptContainer.innerHTML = transcriptHtml;
        console.log('Transcript container after setting HTML:', this.transcriptContainer.innerHTML);
    }

    private renderWellness(session: Interview): void {
        console.log('Rendering wellness data for session:', session.id);
        console.log('Wellness data:', session.wellness_data);
        
        this.wellnessForm.render(session.wellness_data);
    }

    updateContent(session: Interview, changes: {summary?: boolean, transcript?: boolean, wellness?: boolean}): void {
        console.log('Updating content with changes:', changes);
        
        // Update only the changed content without switching tabs
        if (changes.summary) {
            this.showUpdateAnimation('tab-summary');
            this.showTabUpdateIndicator('summary');
            this.renderSummary(session);
        }
        
        if (changes.transcript) {
            this.showUpdateAnimation('tab-transcript');
            this.showTabUpdateIndicator('transcript');
            this.renderTranscript(session);
        }
        
        if (changes.wellness) {
            this.showUpdateAnimation('tab-wellness');
            this.showTabUpdateIndicator('wellness');
            this.renderWellness(session);
        }
    }

    private showUpdateAnimation(tabId: string): void {
        const tabElement = document.getElementById(tabId);
        if (tabElement) {
            tabElement.classList.add('updating');
            setTimeout(() => {
                tabElement.classList.remove('updating');
            }, 600); // Match animation duration
        }
    }

    private showTabUpdateIndicator(tabName: string): void {
        const tabBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabBtn && !tabBtn.classList.contains('active')) {
            // Only show indicator if tab is not currently active
            tabBtn.classList.add('has-updates');
            
            // Remove indicator after 5 seconds
            setTimeout(() => {
                tabBtn.classList.remove('has-updates');
            }, 5000);
        }
    }

    showLoading(): void {
        this.summaryContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading session details...</p>
            </div>
        `;
        
        this.transcriptContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading transcript...</p>
            </div>
        `;
    }

    showError(message: string): void {
        const errorHtml = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error loading session</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
        
        this.summaryContainer.innerHTML = errorHtml;
        this.transcriptContainer.innerHTML = '';
    }

    clear(): void {
        this.summaryContainer.innerHTML = '';
        this.transcriptContainer.innerHTML = '';
    }

    private formatTranscriptAsDialog(transcript: string): string {
        if (!transcript) return '<div class="no-transcript">No transcript available</div>';
        
        // Parse structured transcript with sender tags [SYSTEM], [USER], [ASSISTANT]
        const messageBlocks = transcript.split('\n\n').filter(block => block.trim());
        let dialogHtml = '';
        
        for (const block of messageBlocks) {
            const trimmedBlock = block.trim();
            if (!trimmedBlock) continue;
            
            let messageType = 'system';
            let senderName = 'System';
            let avatar = '📝';
            let content = trimmedBlock;
            
            // Parse message type based on tags
            if (trimmedBlock.startsWith('[SYSTEM]')) {
                messageType = 'system';
                senderName = 'System';
                avatar = '📝';
                content = trimmedBlock.replace('[SYSTEM] ', '');
            } else if (trimmedBlock.startsWith('[USER]')) {
                messageType = 'user';
                senderName = 'User';
                avatar = '👤';
                content = trimmedBlock.replace('[USER] ', '');
            } else if (trimmedBlock.startsWith('[ASSISTANT]')) {
                messageType = 'assistant';
                senderName = 'Anna';
                avatar = '🤖';
                content = trimmedBlock.replace('[ASSISTANT] ', '');
            }
            
            // Format message with proper styling
            dialogHtml += `
                <div class="dialog-message ${messageType}-message">
                    <div class="speaker-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="speaker-name">${senderName}</div>
                        <div class="message-text">${this.escapeHtml(content)}</div>
                    </div>
                </div>
            `;
        }
        
        return dialogHtml || '<div class="no-transcript">Unable to parse transcript</div>';
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
