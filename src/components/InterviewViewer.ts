import { Interview, ChatMessage, InterviewSummary } from '../types/api.js';

export class InterviewViewer {
    private container: HTMLElement;
    private currentInterview: Interview | null = null;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId)!;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            // Handle tab switching
            if (target.classList.contains('interview-tab')) {
                const tabName = target.getAttribute('data-tab');
                if (tabName) {
                    this.switchTab(tabName);
                }
            }

            // Handle close button
            if (target.classList.contains('interview-close')) {
                this.hide();
            }
        });
    }

    async showInterview(interview: Interview, messages: ChatMessage[], summary: InterviewSummary): Promise<void> {
        this.currentInterview = interview;
        
        const formattedDate = new Date(interview.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        this.container.innerHTML = `
            <div class="interview-viewer-backdrop">
                <div class="interview-viewer-modal">
                    <div class="interview-viewer-header">
                        <div class="interview-info">
                            <h2>Interview #${interview.id}</h2>
                            <div class="interview-meta">
                                <span class="interview-user">👤 ${interview.email}</span>
                                <span class="interview-date">📅 ${formattedDate}</span>
                            </div>
                        </div>
                        <button class="interview-close" title="Close">✕</button>
                    </div>

                    <div class="interview-viewer-tabs">
                        <button class="interview-tab active" data-tab="summary">
                            📋 Summary
                        </button>
                        <button class="interview-tab" data-tab="chat">
                            💬 Chat
                        </button>
                        <button class="interview-tab" data-tab="transcript">
                            📝 Transcript
                        </button>
                    </div>

                    <div class="interview-viewer-content">
                        <div class="interview-tab-content active" data-tab-content="summary">
                            ${this.renderSummaryTab(summary)}
                        </div>
                        <div class="interview-tab-content" data-tab-content="chat">
                            ${this.renderChatTab(messages)}
                        </div>
                        <div class="interview-tab-content" data-tab-content="transcript">
                            ${this.renderTranscriptTab(interview.transcription)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.style.display = 'block';
    }

    private renderSummaryTab(summary: InterviewSummary): string {
        const rating = summary.rating ? '⭐'.repeat(summary.rating) : 'Not rated';
        const duration = summary.duration ? `${Math.round(summary.duration / 60)} minutes` : 'Unknown';

        return `
            <div class="summary-content">
                <div class="summary-grid">
                    <div class="summary-card">
                        <h3>📊 Rating</h3>
                        <div class="rating-display">${rating}</div>
                        ${summary.rating ? `<div class="rating-score">${summary.rating}/5</div>` : ''}
                    </div>
                    <div class="summary-card">
                        <h3>⏱️ Duration</h3>
                        <div class="duration-display">${duration}</div>
                    </div>
                </div>

                <div class="summary-section">
                    <h3>📝 Summary</h3>
                    <div class="summary-text">${this.escapeHtml(summary.summary)}</div>
                </div>

                ${summary.keyPoints && summary.keyPoints.length > 0 ? `
                    <div class="summary-section">
                        <h3>Key Points</h3>
                        <ul class="key-points-list">
                            ${summary.keyPoints.map(point => `<li>${this.escapeHtml(point)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private renderChatTab(messages: ChatMessage[]): string {
        if (messages.length === 0) {
            return '<div class="empty-state">No messages found</div>';
        }

        const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        return `
            <div class="chat-messages-container">
                ${sortedMessages.map(message => this.renderChatMessage(message)).join('')}
            </div>
        `;
    }

    private renderChatMessage(message: ChatMessage): string {
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const senderIcon = message.sender === 'user' ? '👤' : '🤖';
        const senderName = message.senderName || (message.sender === 'user' ? 'Candidate' : 'Interviewer');

        return `
            <div class="chat-message ${message.sender}">
                <div class="message-header">
                    <span class="message-sender">
                        ${senderIcon} ${this.escapeHtml(senderName)}
                    </span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
            </div>
        `;
    }

    private renderTranscriptTab(transcription: string): string {
        if (!transcription || transcription.trim() === '') {
            return '<div class="empty-state">Transcript not available</div>';
        }

        return `
            <div class="transcript-container">
                <div class="transcript-content">
                    ${this.formatTranscript(transcription)}
                </div>
            </div>
        `;
    }

    private formatTranscript(transcript: string): string {
        // Simple formatting for transcript - split by lines and format as conversation
        const lines = transcript.split('\n').filter(line => line.trim() !== '');
        
        return lines.map(line => {
            // Try to detect speaker patterns like "Speaker:" or timestamps
            const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
            if (speakerMatch) {
                const [, speaker, content] = speakerMatch;
                const isUser = speaker.toLowerCase().includes('user') || speaker.toLowerCase().includes('candidate');
                return `
                    <div class="transcript-line ${isUser ? 'user' : 'interviewer'}">
                        <span class="transcript-speaker">${this.escapeHtml(speaker)}:</span>
                        <span class="transcript-text">${this.escapeHtml(content)}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="transcript-line">
                        <span class="transcript-text">${this.escapeHtml(line)}</span>
                    </div>
                `;
            }
        }).join('');
    }

    private switchTab(tabName: string): void {
        // Update tab buttons
        this.container.querySelectorAll('.interview-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        this.container.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update tab content
        this.container.querySelectorAll('.interview-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        this.container.querySelector(`[data-tab-content="${tabName}"]`)?.classList.add('active');
    }

    hide(): void {
        this.container.style.display = 'none';
        this.currentInterview = null;
    }

    isVisible(): boolean {
        return this.container.style.display !== 'none';
    }

    getCurrentInterview(): Interview | null {
        return this.currentInterview;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
