import { InterviewSummary } from '../types/api.js';

export class SummaryView {
    private container: HTMLElement;
    private selectElement: HTMLSelectElement;

    constructor(containerId: string, selectId: string) {
        this.container = document.getElementById(containerId)!;
        this.selectElement = document.getElementById(selectId) as HTMLSelectElement;
    }

    render(summary: InterviewSummary): void {
        const rating = summary.rating 
            ? `<div class="summary-section">
                 <h3>Rating</h3>
                 <div class="summary-content">
                   ${'⭐'.repeat(summary.rating)} (${summary.rating}/5)
                 </div>
               </div>`
            : '';

        const duration = summary.duration
            ? `<div class="summary-section">
                 <h3>Duration</h3>
                 <div class="summary-content">${Math.round(summary.duration / 60)} minutes</div>
               </div>`
            : '';

        const keyPoints = summary.keyPoints && summary.keyPoints.length > 0
            ? `<div class="summary-section">
                 <h3>Key Points</h3>
                 <div class="summary-content">
                   <ul style="margin-left: 1.5rem;">
                     ${summary.keyPoints.map(point => `<li>${this.escapeHtml(point)}</li>`).join('')}
                   </ul>
                 </div>
               </div>`
            : '';

        const createdAt = new Date(summary.createdAt).toLocaleDateString();

        this.container.innerHTML = `
            <div class="summary-section">
                <h3>Summary</h3>
                <div class="summary-content">${this.escapeHtml(summary.summary)}</div>
            </div>
            ${keyPoints}
            ${rating}
            ${duration}
            <div class="summary-section">
                <h3>Created</h3>
                <div class="summary-content">${createdAt}</div>
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
        this.container.innerHTML = '<div class="loading">Loading summary...</div>';
    }

    showError(message: string): void {
        this.container.innerHTML = `<div class="error">Error loading summary: ${this.escapeHtml(message)}</div>`;
    }

    showEmptyState(): void {
        this.container.innerHTML = '<div class="empty-state">Select an interview to view summary</div>';
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
