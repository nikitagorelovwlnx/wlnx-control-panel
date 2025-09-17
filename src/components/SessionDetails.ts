import { Interview } from '../types/api.js';

export class SessionDetails {
    private summaryContainer: HTMLElement;
    private transcriptContainer: HTMLElement;

    constructor(summaryContainer: HTMLElement, transcriptContainer: HTMLElement) {
        this.summaryContainer = summaryContainer;
        this.transcriptContainer = transcriptContainer;
    }

    showSession(session: Interview): void {
        this.renderSummary(session);
        this.renderTranscript(session);
    }

    private renderSummary(session: Interview): void {
        const formattedDate = new Date(session.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.summaryContainer.innerHTML = `
            <div class="session-info">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">📅 Date</span>
                        <span class="info-value">${formattedDate}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">👤 User</span>
                        <span class="info-value">${this.escapeHtml(session.email)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">🆔 Session ID</span>
                        <span class="info-value">#${session.id.substring(0, 12)}</span>
                    </div>
                </div>
            </div>
            
            <div class="summary-content">
                <h4>📊 Summary</h4>
                <div class="summary-text">
                    ${this.formatText(session.summary)}
                </div>
            </div>
        `;
    }

    private renderTranscript(session: Interview): void {
        if (!session.transcription || session.transcription.trim() === '') {
            this.transcriptContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <p>No transcription available for this session.</p>
                </div>
            `;
            return;
        }

        this.transcriptContainer.innerHTML = `
            <div class="transcript-content">
                ${this.formatTranscript(session.transcription)}
            </div>
        `;
    }

    private formatTranscript(transcription: string): string {
        // Basic formatting for transcripts
        // Split by common patterns and format as dialogue
        const lines = transcription.split('\n').filter(line => line.trim() !== '');
        
        return lines.map(line => {
            const trimmedLine = line.trim();
            
            // Check if line looks like a speaker label
            if (trimmedLine.match(/^(Coach|Client|User|Interviewer|Candidate):/i)) {
                const [speaker, ...content] = trimmedLine.split(':');
                return `
                    <div class="transcript-exchange">
                        <div class="speaker-label">${this.escapeHtml(speaker.trim())}:</div>
                        <div class="speaker-content">${this.escapeHtml(content.join(':').trim())}</div>
                    </div>
                `;
            }
            
            // Regular text
            return `<div class="transcript-text">${this.escapeHtml(trimmedLine)}</div>`;
        }).join('');
    }

    private formatText(text: string): string {
        // Basic text formatting - preserve line breaks and add paragraphs
        return text.split('\n\n').map(paragraph => 
            `<p>${this.escapeHtml(paragraph.trim())}</p>`
        ).join('');
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
