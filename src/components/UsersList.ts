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
        const lastActivity = user.lastActivity 
            ? new Date(user.lastActivity).toLocaleDateString() 
            : 'Never';

        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-name">${this.escapeHtml(user.name)}</div>
                <div class="user-email">${this.escapeHtml(user.email)}</div>
                <div class="user-status ${user.status}">${user.status}</div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 0.5rem;">
                    Last activity: ${lastActivity}
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
