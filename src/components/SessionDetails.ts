import { Interview } from '../types/api.js';

export class SessionDetails {
    private summaryContainer: HTMLElement;
    private transcriptContainer: HTMLElement;

    constructor(summaryContainer: HTMLElement, transcriptContainer: HTMLElement) {
        this.summaryContainer = summaryContainer;
        this.transcriptContainer = transcriptContainer;
    }

    showSession(session: Interview): void {
        console.log('SessionDetails.showSession called with:', session);
        this.renderSummary(session);
        this.renderTranscript(session);
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

        const summaryHtml = `
            <div class="session-info">
                <p><strong>📅 Date:</strong> ${formattedDate}</p>
                <p><strong>👤 User:</strong> ${this.escapeHtml(session.email)}</p>
                <p><strong>🆔 Session ID:</strong> #${session.id.substring(0, 12)}</p>
            </div>
            
            <div class="summary-content">
                <h4>📊 Summary</h4>
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
        console.log('Transcription content:', session.transcription);
        
        if (!session.transcription || session.transcription.trim() === '') {
            this.transcriptContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No transcription available for this session.</p>
                </div>
            `;
            return;
        }

        const transcriptHtml = `
            <div class="transcript-content">
                <div class="transcript-text">
                    <pre style="white-space: pre-wrap; font-family: inherit;">${this.escapeHtml(session.transcription)}</pre>
                </div>
            </div>
        `;
        
        console.log('Setting transcript HTML:', transcriptHtml);
        this.transcriptContainer.innerHTML = transcriptHtml;
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
