import { User, Interview } from '../types/api.js';

export class UsersList {
    private container: HTMLElement;
    private onUserSelectCallback?: (userEmail: string) => void;
    private usersInterviews: Map<string, Interview[]> = new Map();

    constructor(containerSelector: string) {
        this.container = document.getElementById(containerSelector)!;
    }

    onUserSelect(callback: (userEmail: string) => void): void {
        this.onUserSelectCallback = callback;
    }

    render(users: User[]): void {
        if (users.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No patients found</h3>
                    <p>No wellness coaching patients are available.</p>
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
                    <div class="user-avatar">${firstLetter}</div>
                    <div class="user-details">
                        <h3>${user.email.split('@')[0]}</h3>
                        <p>${user.email}</p>
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
        const userCards = this.container.querySelectorAll('.user-card');
        userCards.forEach(card => {
            card.addEventListener('click', () => {
                const userEmail = card.getAttribute('data-user-email');
                if (userEmail && this.onUserSelectCallback) {
                    console.log('User card clicked:', userEmail);
                    this.onUserSelectCallback(userEmail);
                }
            });
        });
    }

    setUserInterviews(userEmail: string, interviews: Interview[]): void {
        this.usersInterviews.set(userEmail, interviews);
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
