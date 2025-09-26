import { Interview } from '../types/api.js';
import { ApiClient } from '../api/client.js';

export class SessionsList {
    private container: HTMLElement;
    private onSessionSelectCallback?: (sessionId: string) => void;
    private onSessionDeleteCallback?: (sessionId: string) => void;
    private apiClient: ApiClient;
    private currentUserEmail: string = '';
    private deletingSession: Set<string> = new Set();

    constructor(container: HTMLElement, apiClient: ApiClient) {
        this.container = container;
        this.apiClient = apiClient;
    }

    showSessions(sessions: Interview[], userEmail: string): void {
        this.currentUserEmail = userEmail;
        if (sessions.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <h3>No sessions yet</h3>
                    <p>This user hasn't completed any sessions.</p>
                </div>
            `;
            return;
        }

        const sessionsHtml = sessions.map(session => this.createSessionCard(session)).join('');
        this.container.innerHTML = sessionsHtml;

        // Add click handlers
        this.addEventHandlers();
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
                    <div class="session-actions">
                        <button class="session-delete-btn" data-session-id="${session.id}" title="Delete session">
                            <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <div class="confirm-actions" style="display: none;">
                            <button class="confirm-yes" data-session-id="${session.id}" title="Yes, delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </button>
                            <button class="confirm-no" data-session-id="${session.id}" title="No, cancel">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="session-summary">${this.escapeHtml(summary)}</div>
            </div>
        `;
    }

    onSessionSelect(callback: (sessionId: string) => void): void {
        this.onSessionSelectCallback = callback;
    }

    onSessionDelete(callback: (sessionId: string) => void): void {
        this.onSessionDeleteCallback = callback;
    }

    async deleteAllUserSessions(): Promise<void> {
        if (!this.currentUserEmail) {
            console.error('No user email available for bulk deletion');
            return;
        }

        const confirmation = confirm(`Delete ALL sessions for ${this.currentUserEmail}?`);
        if (!confirmation) {
            return;
        }

        try {
            const result = await this.apiClient.deleteAllUserSessions(this.currentUserEmail);
            if (result.success) {
                // Clear all session cards from DOM
                this.container.innerHTML = `
                    <div class="empty-state">
                        <h3>All sessions deleted</h3>
                        <p>All sessions for this user have been successfully deleted.</p>
                    </div>
                `;
                
                console.log(`Successfully deleted ${result.deletedCount} sessions`);
            } else {
                console.error('Failed to delete all sessions');
            }
        } catch (error) {
            console.error('Error deleting all sessions:', error);
        }
    }

    private addEventHandlers(): void {
        this.container.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            
            // Handle session card click (for selection)
            const sessionCard = target.closest('.session-card');
            if (sessionCard && !target.closest('.session-actions') && this.onSessionSelectCallback) {
                const sessionId = sessionCard.getAttribute('data-session-id');
                if (sessionId) {
                    console.log('Session clicked:', sessionId);
                    
                    // Remove active class from all session cards
                    const allSessionCards = this.container.querySelectorAll('.session-card');
                    allSessionCards.forEach(card => card.classList.remove('active', 'selected'));
                    
                    // Add active class to clicked card
                    sessionCard.classList.add('active', 'selected');
                    this.onSessionSelectCallback(sessionId);
                }
                return;
            }
            
            // Handle delete session button click
            if (target.closest('.session-delete-btn')) {
                const deleteBtn = target.closest('.session-delete-btn') as HTMLElement;
                const sessionId = deleteBtn.getAttribute('data-session-id');
                if (sessionId) {
                    this.showConfirmDialog(sessionId);
                }
                return;
            }
            
            // Handle confirm yes click
            if (target.closest('.confirm-yes')) {
                const confirmBtn = target.closest('.confirm-yes') as HTMLElement;
                const sessionId = confirmBtn.getAttribute('data-session-id');
                if (sessionId) {
                    await this.deleteSession(sessionId);
                }
                return;
            }
            
            // Handle confirm no click
            if (target.closest('.confirm-no')) {
                const confirmBtn = target.closest('.confirm-no') as HTMLElement;
                const sessionId = confirmBtn.getAttribute('data-session-id');
                if (sessionId) {
                    this.hideConfirmDialog(sessionId);
                }
                return;
            }
        });
    }

    private showConfirmDialog(sessionId: string): void {
        const sessionCard = this.container.querySelector(`[data-session-id="${sessionId}"]`);
        if (sessionCard) {
            const deleteBtn = sessionCard.querySelector('.session-delete-btn') as HTMLElement;
            const confirmActions = sessionCard.querySelector('.confirm-actions') as HTMLElement;
            
            if (deleteBtn && confirmActions) {
                deleteBtn.style.display = 'none';
                confirmActions.style.display = 'flex';
            }
        }
    }

    private hideConfirmDialog(sessionId: string): void {
        const sessionCard = this.container.querySelector(`[data-session-id="${sessionId}"]`);
        if (sessionCard) {
            const deleteBtn = sessionCard.querySelector('.session-delete-btn') as HTMLElement;
            const confirmActions = sessionCard.querySelector('.confirm-actions') as HTMLElement;
            
            if (deleteBtn && confirmActions) {
                deleteBtn.style.display = 'block';
                confirmActions.style.display = 'none';
            }
        }
    }

    private async deleteSession(sessionId: string): Promise<void> {
        // Prevent multiple deletion attempts
        if (this.deletingSession.has(sessionId)) {
            console.log('Session deletion already in progress:', sessionId);
            return;
        }

        this.deletingSession.add(sessionId);

        try {
            const success = await this.apiClient.deleteSession(sessionId, this.currentUserEmail);
            if (success) {
                // Remove session card from DOM
                const sessionCard = this.container.querySelector(`[data-session-id="${sessionId}"]`);
                if (sessionCard) {
                    sessionCard.remove();
                }
                
                // Call callback if provided
                if (this.onSessionDeleteCallback) {
                    this.onSessionDeleteCallback(sessionId);
                }
                
                console.log('Session deleted successfully:', sessionId);
            } else {
                console.error('Failed to delete session');
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        } finally {
            // Remove from deletion set and hide confirm dialog
            this.deletingSession.delete(sessionId);
            this.hideConfirmDialog(sessionId);
        }
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
