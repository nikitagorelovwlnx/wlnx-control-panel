import { User } from '../types/api.js';

export class UsersList {
    private container: HTMLElement;

    constructor(containerId: string) {
        this.container = document.getElementById(containerId)!;
    }

    render(users: User[]): void {
        if (users.length === 0) {
            this.container.innerHTML = '<div class="empty-state">No users found</div>';
            return;
        }

        const userCards = users.map(user => this.createUserCard(user)).join('');
        this.container.innerHTML = userCards;
    }

    private createUserCard(user: User): string {
        const lastInterview = user.last_interview 
            ? new Date(user.last_interview).toLocaleDateString() 
            : 'Never';
        
        const firstInterview = user.first_interview 
            ? new Date(user.first_interview).toLocaleDateString() 
            : 'Never';

        const status = user.interview_count > 0 ? 'active' : 'inactive';

        return `
            <div class="user-card" data-user-email="${this.escapeHtml(user.email)}">
                <div class="user-name">${this.escapeHtml(user.email.split('@')[0])}</div>
                <div class="user-email">${this.escapeHtml(user.email)}</div>
                <div class="user-status ${status}">${status}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
                    Interviews: ${user.interview_count}<br>
                    Last interview: ${lastInterview}<br>
                    First interview: ${firstInterview}
                </div>
            </div>
        `;
    }

    showLoading(): void {
        this.container.innerHTML = '<div class="loading">Loading users...</div>';
    }

    showError(message: string): void {
        this.container.innerHTML = `<div class="error">Error loading users: ${this.escapeHtml(message)}</div>`;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
