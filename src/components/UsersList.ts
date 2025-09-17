import { User, Interview } from '../types/api.js';

export class UsersList {
    private container: HTMLElement;
    private onUserSelectCallback?: (userEmail: string) => void;
    private usersInterviews: Map<string, Interview[]> = new Map();

    constructor(containerId: string) {
        this.container = document.getElementById(containerId)!;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.container.addEventListener('click', (e) => {
            const userCard = (e.target as HTMLElement).closest('.user-card');
            if (userCard && this.onUserSelectCallback) {
                const userEmail = userCard.getAttribute('data-user-email');
                if (userEmail) {
                    this.onUserSelectCallback(userEmail);
                }
            }

            // Handle interview items click
            const interviewItem = (e.target as HTMLElement).closest('.interview-item');
            if (interviewItem) {
                e.stopPropagation();
                const interviewId = interviewItem.getAttribute('data-interview-id');
                if (interviewId) {
                    // Dispatch custom event for interview selection
                    const event = new CustomEvent('interviewSelected', {
                        detail: { interviewId }
                    });
                    document.dispatchEvent(event);
                }
            }

            // Handle expand/collapse toggle
            const toggleBtn = (e.target as HTMLElement).closest('.interviews-toggle');
            if (toggleBtn) {
                e.stopPropagation();
                const userCard = toggleBtn.closest('.user-card');
                const interviewsList = userCard?.querySelector('.interviews-list');
                const isExpanded = userCard?.classList.contains('expanded');

                if (isExpanded) {
                    userCard?.classList.remove('expanded');
                    if (interviewsList) {
                        (interviewsList as HTMLElement).style.maxHeight = '0';
                    }
                    toggleBtn.textContent = '▼';
                } else {
                    userCard?.classList.add('expanded');
                    if (interviewsList) {
                        (interviewsList as HTMLElement).style.maxHeight = '300px';
                    }
                    toggleBtn.textContent = '▲';
                }
            }
        });
    }

    render(users: User[]): void {
        if (users.length === 0) {
            this.container.innerHTML = '<div class="empty-state">No users found</div>';
            return;
        }

        const userCards = users.map(user => this.createUserCard(user)).join('');
        this.container.innerHTML = userCards;
    }

    setUserInterviews(userEmail: string, interviews: Interview[]): void {
        this.usersInterviews.set(userEmail, interviews);
        this.updateUserCard(userEmail);
    }

    private updateUserCard(userEmail: string): void {
        const userCard = this.container.querySelector(`[data-user-email="${userEmail}"]`);
        const interviews = this.usersInterviews.get(userEmail) || [];
        
        if (userCard) {
            const interviewsList = userCard.querySelector('.interviews-list');
            if (interviewsList) {
                interviewsList.innerHTML = this.createInterviewsList(interviews);
            }
        }
    }

    private createUserCard(user: User): string {
        const lastInterview = user.last_interview 
            ? new Date(user.last_interview).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Never';
        
        const firstInterview = user.first_interview 
            ? new Date(user.first_interview).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
            : 'Never';

        const status = user.interview_count > 0 ? 'active' : 'inactive';
        const statusText = status === 'active' ? 'Active' : 'Inactive';

        const interviews = this.usersInterviews.get(user.email) || [];

        return `
            <div class="user-card modern-card" data-user-email="${this.escapeHtml(user.email)}">
                <div class="user-card-header">
                    <div class="user-avatar">
                        <span class="user-initial">${this.escapeHtml(user.email.charAt(0).toUpperCase())}</span>
                    </div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(user.email.split('@')[0])}</div>
                        <div class="user-email">${this.escapeHtml(user.email)}</div>
                        <div class="user-status ${status}">
                            <span class="status-dot"></span>
                            ${statusText}
                        </div>
                    </div>
                    <div class="user-actions">
                        <button class="interviews-toggle" title="Show interviews">▼</button>
                    </div>
                </div>
                
                <div class="user-stats">
                    <div class="stat-item">
                        <span class="stat-value">${user.interview_count}</span>
                        <span class="stat-label">Interviews</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${lastInterview !== 'Never' ? this.getTimeAgo(user.last_interview) : 'Never'}</span>
                        <span class="stat-label">Latest</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${firstInterview !== 'Never' ? this.getTimeAgo(user.first_interview) : 'Never'}</span>
                        <span class="stat-label">First</span>
                    </div>
                </div>

                <div class="interviews-list">
                    ${this.createInterviewsList(interviews)}
                </div>
            </div>
        `;
    }

    private createInterviewsList(interviews: Interview[]): string {
        if (interviews.length === 0) {
            return '<div class="interviews-loading">Loading interviews...</div>';
        }

        return interviews.map(interview => {
            const date = new Date(interview.created_at).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            const summary = interview.summary.length > 100 
                ? interview.summary.substring(0, 100) + '...'
                : interview.summary;

            return `
                <div class="interview-item" data-interview-id="${interview.id}">
                    <div class="interview-header">
                        <span class="interview-date">${date}</span>
                        <span class="interview-id">#${interview.id}</span>
                    </div>
                    <div class="interview-summary">${this.escapeHtml(summary)}</div>
                    <div class="interview-actions">
                        <button class="btn-view-interview">👁️ View</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    private getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)}m ago`;
        return `${Math.floor(diffDays / 365)}y ago`;
    }

    onUserSelect(callback: (userEmail: string) => void): void {
        this.onUserSelectCallback = callback;
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
