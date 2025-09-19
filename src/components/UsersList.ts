import { User, Interview } from '../types/api.js';

export class UsersList {
    private container: HTMLElement;
    private onUserSelectCallback?: (userEmail: string) => void;
    private onDeleteAllSessionsCallback?: (userEmail: string) => void;
    private usersInterviews: Map<string, Interview[]> = new Map();
    private users: User[] = [];

    constructor(containerSelector: string) {
        this.container = document.getElementById(containerSelector)!;
    }

    onUserSelect(callback: (userEmail: string) => void): void {
        this.onUserSelectCallback = callback;
    }

    onDeleteAllSessions(callback: (userEmail: string) => void): void {
        this.onDeleteAllSessionsCallback = callback;
    }

    render(users: User[]): void {
        this.users = users;
        if (users.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <h3>No users found</h3>
                    <p>No users are available.</p>
                </div>
            `;
            return;
        }

        const userCards = users.map(user => this.createModernUserCard(user)).join('');
        this.container.innerHTML = userCards;
        
        // Add click handlers
        this.addClickHandlers();
    }
    
    private createModernUserCard(user: User): string {
        const lastSession = user.last_session ? new Date(user.last_session).toLocaleDateString() : 'Never';
        const firstLetter = user.email.charAt(0).toUpperCase();
        
        return `
            <div class="user-card" data-user-email="${user.email}">
                <div class="user-info">
                    <div class="user-main">
                        <div class="user-avatar">${firstLetter}</div>
                        <div class="user-details">
                            <h3>${user.email.split('@')[0]}</h3>
                            <p>${user.email}</p>
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="delete-all-user-sessions-btn" data-user-email="${user.email}" title="Delete all sessions for this user">
                            <svg class="delete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <div class="confirm-actions" style="display: none;">
                            <button class="confirm-yes" data-user-email="${user.email}" title="Yes, delete all">Yes</button>
                            <button class="confirm-no" data-user-email="${user.email}" title="No, cancel">No</button>
                        </div>
                    </div>
                </div>
                <div class="user-stats">
                    <div class="stat-item">
                        <span class="stat-value">${user.session_count}</span> sessions
                    </div>
                    <div class="stat-item">
                        Last: <span class="stat-value">${lastSession}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    private addClickHandlers(): void {
        this.container.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            
            // Handle user card click (for selection)
            const userCard = target.closest('.user-card');
            if (userCard && !target.closest('.user-actions') && this.onUserSelectCallback) {
                const userEmail = userCard.getAttribute('data-user-email');
                if (userEmail) {
                    console.log('User card clicked:', userEmail);
                    
                    // Remove active class from all cards
                    const allUserCards = this.container.querySelectorAll('.user-card');
                    allUserCards.forEach(c => c.classList.remove('active', 'selected'));
                    
                    // Add active class to clicked card
                    userCard.classList.add('active', 'selected');
                    
                    this.onUserSelectCallback(userEmail);
                }
                return;
            }
            
            // Handle delete all sessions button click
            if (target.closest('.delete-all-user-sessions-btn')) {
                const deleteBtn = target.closest('.delete-all-user-sessions-btn') as HTMLElement;
                const userEmail = deleteBtn.getAttribute('data-user-email');
                if (userEmail) {
                    this.showConfirmDialog(userEmail);
                }
                return;
            }
            
            // Handle confirm yes click
            if (target.closest('.confirm-yes')) {
                const confirmBtn = target.closest('.confirm-yes') as HTMLElement;
                const userEmail = confirmBtn.getAttribute('data-user-email');
                if (userEmail) {
                    await this.deleteAllUserSessions(userEmail);
                }
                return;
            }
            
            // Handle confirm no click
            if (target.closest('.confirm-no')) {
                const confirmBtn = target.closest('.confirm-no') as HTMLElement;
                const userEmail = confirmBtn.getAttribute('data-user-email');
                if (userEmail) {
                    this.hideConfirmDialog(userEmail);
                }
                return;
            }
        });
    }

    private showConfirmDialog(userEmail: string): void {
        const userCard = this.container.querySelector(`[data-user-email="${userEmail}"]`);
        if (userCard) {
            const deleteBtn = userCard.querySelector('.delete-all-user-sessions-btn') as HTMLElement;
            const confirmActions = userCard.querySelector('.confirm-actions') as HTMLElement;
            
            if (deleteBtn && confirmActions) {
                deleteBtn.style.display = 'none';
                confirmActions.style.display = 'flex';
            }
        }
    }

    private hideConfirmDialog(userEmail: string): void {
        const userCard = this.container.querySelector(`[data-user-email="${userEmail}"]`);
        if (userCard) {
            const deleteBtn = userCard.querySelector('.delete-all-user-sessions-btn') as HTMLElement;
            const confirmActions = userCard.querySelector('.confirm-actions') as HTMLElement;
            
            if (deleteBtn && confirmActions) {
                deleteBtn.style.display = 'block';
                confirmActions.style.display = 'none';
            }
        }
    }

    private async deleteAllUserSessions(userEmail: string): Promise<void> {
        try {
            if (this.onDeleteAllSessionsCallback) {
                await this.onDeleteAllSessionsCallback(userEmail);
            }
            console.log('All sessions deleted for user:', userEmail);
        } catch (error) {
            console.error('Error deleting all sessions:', error);
        }
        
        // Hide confirm dialog
        this.hideConfirmDialog(userEmail);
    }

    setUserInterviews(userEmail: string, interviews: Interview[]): void {
        this.usersInterviews.set(userEmail, interviews);
    }

    getUsers(): User[] {
        return this.users;
    }

    showLoading(): void {
        this.container.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading patients...</p>
            </div>
        `;
    }

    showError(message: string): void {
        this.container.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error loading patients</h3>
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
