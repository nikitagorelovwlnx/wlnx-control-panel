import { ApiClient } from './api/client.js';
import { UsersList } from './components/UsersList.js';
import { ChatView } from './components/ChatView.js';
import { SummaryView } from './components/SummaryView.js';

class ControlPanel {
    private apiClient: ApiClient;
    private usersList: UsersList;
    private chatView: ChatView;
    private summaryView: SummaryView;
    private currentTab: string = 'users';

    constructor() {
        this.apiClient = new ApiClient();
        this.usersList = new UsersList('users-list');
        this.chatView = new ChatView('chat-messages', 'interview-select');
        this.summaryView = new SummaryView('summary-content', 'summary-select');
        
        this.init();
    }

    private async init(): Promise<void> {
        this.setupEventListeners();
        await this.checkApiConnection();
        await this.loadInitialData();
    }

    private setupEventListeners(): void {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const tab = target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Refresh users button
        const refreshButton = document.getElementById('refresh-users');
        refreshButton?.addEventListener('click', () => {
            this.loadUsers();
        });

        // Interview selection handlers
        this.chatView.onInterviewSelect((interviewId) => {
            this.loadInterviewMessages(interviewId);
        });

        this.summaryView.onInterviewSelect((interviewId) => {
            this.loadInterviewSummary(interviewId);
        });
    }

    private switchTab(tabName: string): void {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`)?.classList.add('active');

        this.currentTab = tabName;

        // Load data for the active tab
        if (tabName === 'users') {
            this.loadUsers();
        } else if (tabName === 'interviews') {
            this.loadInterviews();
        } else if (tabName === 'summaries') {
            this.loadInterviews(); // Same data for dropdowns
        }
    }

    private async checkApiConnection(): Promise<void> {
        const statusDot = document.getElementById('api-status');
        const statusText = document.getElementById('api-status-text');
        
        try {
            const isConnected = await this.apiClient.checkConnection();
            if (isConnected) {
                statusDot?.classList.remove('offline');
                statusDot?.classList.add('online');
                if (statusText) statusText.textContent = 'Connected';
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            statusDot?.classList.remove('online');
            statusDot?.classList.add('offline');
            if (statusText) statusText.textContent = 'Disconnected';
            console.warn('API connection failed:', error);
        }
    }

    private async loadInitialData(): Promise<void> {
        await this.loadUsers();
        await this.loadInterviews();
    }

    private async loadUsers(): Promise<void> {
        if (this.currentTab !== 'users') return;
        
        try {
            this.usersList.showLoading();
            const users = await this.apiClient.getUsers();
            this.usersList.render(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.usersList.showError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private async loadInterviews(): Promise<void> {
        try {
            const interviews = await this.apiClient.getInterviews();
            const interviewData = interviews.map(interview => ({
                id: interview.id,
                title: interview.title || `Interview ${interview.id}`,
                userId: interview.userId
            }));
            
            this.chatView.populateInterviewSelect(interviewData);
            this.summaryView.populateInterviewSelect(interviewData);
        } catch (error) {
            console.error('Error loading interviews:', error);
            // Don't show error UI for interviews since they're used in dropdowns
        }
    }

    private async loadInterviewMessages(interviewId: string): Promise<void> {
        try {
            this.chatView.showLoading();
            const messages = await this.apiClient.getInterviewMessages(interviewId);
            this.chatView.render(messages);
        } catch (error) {
            console.error('Error loading interview messages:', error);
            this.chatView.showError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private async loadInterviewSummary(interviewId: string): Promise<void> {
        try {
            this.summaryView.showLoading();
            const summary = await this.apiClient.getInterviewSummary(interviewId);
            this.summaryView.render(summary);
        } catch (error) {
            console.error('Error loading interview summary:', error);
            this.summaryView.showError(error instanceof Error ? error.message : 'Unknown error');
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ControlPanel();
});
