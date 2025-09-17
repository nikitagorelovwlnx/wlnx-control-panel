import { ApiClient } from './api/client.js';
import { UsersList } from './components/UsersList.js';
import { InterviewViewer } from './components/InterviewViewer.js';

class ControlPanel {
    private apiClient: ApiClient;
    private usersList: UsersList;
    private interviewViewer: InterviewViewer;

    constructor() {
        this.apiClient = new ApiClient();
        this.usersList = new UsersList('users-list');
        this.interviewViewer = new InterviewViewer('interview-viewer');
        
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
        // Refresh users button
        const refreshButton = document.getElementById('refresh-users');
        refreshButton?.addEventListener('click', () => {
            this.loadUsers();
        });

        // User selection handler for loading their interviews
        this.usersList.onUserSelect(async (userEmail) => {
            await this.loadUserInterviews(userEmail);
        });

        // Interview viewer integration
        document.addEventListener('interviewSelected', async (e: any) => {
            const interviewId = e.detail.interviewId;
            await this.openInterviewViewer(interviewId);
        });
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
    }

    private async loadUsers(): Promise<void> {
        try {
            this.usersList.showLoading();
            const users = await this.apiClient.getUsers();
            this.usersList.render(users);
        } catch (error) {
            console.error('Error loading users:', error);
            this.usersList.showError(error instanceof Error ? error.message : 'Unknown error');
        }
    }


    private async loadUserInterviews(userEmail: string): Promise<void> {
        try {
            const interviews = await this.apiClient.getInterviews(userEmail);
            this.usersList.setUserInterviews(userEmail, interviews);
        } catch (error) {
            console.error('Error loading user interviews:', error);
        }
    }

    private async openInterviewViewer(interviewId: string): Promise<void> {
        try {
            // Get all required data for the interview viewer
            const interviews = await this.apiClient.getInterviews();
            const interview = interviews.find(i => i.id === interviewId);
            
            if (!interview) {
                console.error('Interview not found:', interviewId);
                return;
            }

            const [messages, summary] = await Promise.all([
                this.apiClient.getInterviewMessages(interviewId),
                this.apiClient.getInterviewSummary(interviewId)
            ]);

            await this.interviewViewer.showInterview(interview, messages, summary);
        } catch (error) {
            console.error('Error opening interview viewer:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ControlPanel();
});
