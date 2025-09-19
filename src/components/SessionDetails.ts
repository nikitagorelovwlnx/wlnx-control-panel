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
            <div class="session-info">
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>User:</strong> ${this.escapeHtml(userEmail)}</p>
                <p><strong>Session ID:</strong> #${session.id.substring(0, 12)}</p>
            </div>
            
            <div class="summary-content">
                <h4>Summary</h4>
                <div class="summary-text">
                    <p>${this.escapeHtml(session.summary || 'No summary available.')}</p>
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

        const transcriptHtml = `
            <div class="transcript-content">
                <div class="transcript-text">
                    <pre style="white-space: pre-wrap; font-family: inherit; font-size: 14px; line-height: 1.5; color: #1a1a1a;">${this.escapeHtml(transcriptText)}</pre>
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

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
