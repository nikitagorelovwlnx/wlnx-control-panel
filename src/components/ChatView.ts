import { ChatMessage } from '../types/api.js';

export class ChatView {
    private container: HTMLElement;
    private selectElement: HTMLSelectElement;

    constructor(containerId: string, selectId: string) {
        this.container = document.getElementById(containerId)!;
        this.selectElement = document.getElementById(selectId) as HTMLSelectElement;
    }

    render(messages: ChatMessage[]): void {
        if (messages.length === 0) {
            this.container.innerHTML = '<div class="empty-state">No messages found</div>';
            return;
        }

        const messageElements = messages
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            .map(message => this.createMessageElement(message))
            .join('');

        this.container.innerHTML = messageElements;
        this.scrollToBottom();
    }

    private createMessageElement(message: ChatMessage): string {
        const time = new Date(message.timestamp).toLocaleTimeString();
        const senderName = message.senderName || message.sender;

        return `
            <div class="chat-message ${message.sender}">
                <div class="message-sender">${this.escapeHtml(senderName)}</div>
                <div class="message-content">${this.escapeHtml(message.content)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }

    populateInterviewSelect(interviews: Array<{ id: string; title: string; userId: string }>): void {
        const options = interviews.map(interview => 
            `<option value="${interview.id}">${this.escapeHtml(interview.title || `Interview ${interview.id}`)}</option>`
        ).join('');
        
        this.selectElement.innerHTML = '<option value="">Select an interview...</option>' + options;
    }

    onInterviewSelect(callback: (interviewId: string) => void): void {
        this.selectElement.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            if (target.value) {
                callback(target.value);
            }
        });
    }

    showLoading(): void {
        this.container.innerHTML = '<div class="loading">Loading messages...</div>';
    }

    showError(message: string): void {
        this.container.innerHTML = `<div class="error">Error loading messages: ${this.escapeHtml(message)}</div>`;
    }

    showEmptyState(): void {
        this.container.innerHTML = '<div class="empty-state">Select an interview to view messages</div>';
    }

    private scrollToBottom(): void {
        this.container.scrollTop = this.container.scrollHeight;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
