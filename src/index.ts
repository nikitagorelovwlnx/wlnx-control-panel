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
        await this.checkSystemStatus();
        await this.loadInitialData();
        this.startStatusPolling();
    }

    private startStatusPolling(): void {
        // Check status every 5 seconds
        setInterval(async () => {
            await this.checkSystemStatus();
        }, 5000);
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

    private async checkSystemStatus(): Promise<void> {
        const serverDot = document.getElementById('server-status');
        const serverText = document.getElementById('server-status-text');
        const botDot = document.getElementById('bot-status');
        const botText = document.getElementById('bot-status-text');
        
        try {
            const status = await this.apiClient.getSystemStatus();
            
            // Update server status
            if (status.server) {
                serverDot?.classList.remove('offline');
                serverDot?.classList.add('online');
                if (serverText) serverText.textContent = 'Server: Connected';
            } else {
                serverDot?.classList.remove('online');
                serverDot?.classList.add('offline');
                if (serverText) serverText.textContent = 'Server: Disconnected';
            }
            
            // Update bot status
            if (status.bot) {
                botDot?.classList.remove('offline');
                botDot?.classList.add('online');
                if (botText) botText.textContent = 'Bot: Running';
            } else {
                botDot?.classList.remove('online');
                botDot?.classList.add('offline');
                if (botText) botText.textContent = 'Bot: Stopped';
            }
        } catch (error) {
            // If system status check fails, mark both as offline
            serverDot?.classList.remove('online');
            serverDot?.classList.add('offline');
            botDot?.classList.remove('online');
            botDot?.classList.add('offline');
            if (serverText) serverText.textContent = 'Server: Error';
            if (botText) botText.textContent = 'Bot: Error';
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
                title: `Interview ${interview.id}`,
                userId: interview.email
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
