import { Interview } from '../types/api.js';

export class SessionsList {
    private container: HTMLElement;
    private onSessionSelectCallback?: (sessionId: string) => void;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    showSessions(sessions: Interview[], _userEmail: string): void {
        if (sessions.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No sessions yet</h3>
                    <p>This user hasn't completed any wellness sessions.</p>
                </div>
            `;
            return;
        }

        const sessionsHtml = sessions.map(session => this.createSessionCard(session)).join('');
        this.container.innerHTML = sessionsHtml;

        // Add click handlers
        this.container.addEventListener('click', (e) => {
            const sessionCard = (e.target as HTMLElement).closest('.session-card');
            if (sessionCard && this.onSessionSelectCallback) {
                const sessionId = sessionCard.getAttribute('data-session-id');
                if (sessionId) {
                    this.onSessionSelectCallback(sessionId);
                }
            }
        });
    }

    private createSessionCard(session: Interview): string {
        const date = new Date(session.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const summary = session.summary.length > 150 
            ? session.summary.substring(0, 150) + '...'
            : session.summary;

        return `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <span class="session-date">${date}</span>
                    <span class="session-id">#${session.id.substring(0, 8)}</span>
                </div>
                <div class="session-summary">${this.escapeHtml(summary)}</div>
            </div>
        `;
    }

    onSessionSelect(callback: (sessionId: string) => void): void {
        this.onSessionSelectCallback = callback;
    }

    showLoading(): void {
        this.container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading sessions...</p>
            </div>
        `;
    }

    showError(message: string): void {
        this.container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error loading sessions</h3>
                <p>${this.escapeHtml(message)}</p>
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
