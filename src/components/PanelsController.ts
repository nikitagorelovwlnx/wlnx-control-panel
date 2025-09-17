import { User, Interview } from '../types/api.js';
import { UsersList } from './UsersList.js';
import { SessionsList } from './SessionsList.js';
import { SessionDetails } from './SessionDetails.js';
import { PanelResizer } from './PanelResizer.js';
import { ApiClient } from '../api/client.js';

export class PanelsController {
    private sessionsPanel: HTMLElement;
    private detailsPanel: HTMLElement;
    
    private usersList: UsersList;
    private sessionsList: SessionsList;
    private sessionDetails: SessionDetails;
    private panelResizer: PanelResizer;
    
    private apiClient: ApiClient;
    private currentUser: User | null = null;
    private currentSession: Interview | null = null;

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        
        // Get panel elements
        this.sessionsPanel = document.getElementById('sessions-panel')!;
        this.detailsPanel = document.getElementById('details-panel')!;
        
        // Initialize components
        const usersContainer = document.getElementById('users-list')!;
        const sessionsContainer = document.getElementById('sessions-list')!;
        const summaryContainer = document.getElementById('summary-content')!;
        const transcriptContainer = document.getElementById('transcript-content')!;
        
        this.usersList = new UsersList(usersContainer.id);
        this.sessionsList = new SessionsList(sessionsContainer);
        this.sessionDetails = new SessionDetails(summaryContainer, transcriptContainer);
        this.panelResizer = new PanelResizer(document.getElementById('panels-container')!);
        
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // User selection handler
        this.usersList.onUserSelect((userEmail: string) => {
            this.openUserSessions(userEmail);
        });
        
        // Session selection handler  
        this.sessionsList.onSessionSelect((sessionId: string) => {
            this.openSessionDetails(sessionId);
        });
        
        // Close buttons
        document.getElementById('close-sessions')?.addEventListener('click', () => {
            this.closeSessionsPanel();
        });
        
        document.getElementById('close-details')?.addEventListener('click', () => {
            this.closeDetailsPanel();
        });
    }

    async loadUsers(): Promise<void> {
        try {
            this.usersList.showLoading();
            const users = await this.apiClient.getUsers();
            
            if (users.length === 0) {
                this.usersList.showError('No users found');
                return;
            }
            
            // Load interviews for each user if available in user data
            for (const user of users) {
                if (user.sessions && user.sessions.length > 0) {
                    this.usersList.setUserInterviews(user.email, user.sessions);
                } else {
                    // Try to load interviews separately if not included
                    try {
                        const interviews = await this.apiClient.getInterviews(user.email);
                        this.usersList.setUserInterviews(user.email, interviews);
                    } catch (error) {
                        console.warn(`Failed to load interviews for ${user.email}:`, error);
                    }
                }
            }
            
            this.usersList.render(users);
        } catch (error) {
            console.error('Failed to load users:', error);
            this.usersList.showError(error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private async openUserSessions(userEmail: string): Promise<void> {
        try {
            // Find user data
            const users = await this.apiClient.getUsers();
            this.currentUser = users.find(u => u.email === userEmail) || null;
            
            if (!this.currentUser) {
                throw new Error('User not found');
            }
            
            // Update panel header
            const userNameElement = document.getElementById('selected-user-name');
            if (userNameElement) {
                userNameElement.textContent = userEmail.split('@')[0];
            }
            
            // Show sessions panel
            this.sessionsPanel.classList.add('active');
            
            // Show resizers
            this.panelResizer.showResizers();
            
            // Load sessions
            this.sessionsList.showLoading();
            const sessions = await this.apiClient.getInterviews(userEmail);
            this.sessionsList.showSessions(sessions, userEmail);
            
        } catch (error) {
            console.error('Failed to open user sessions:', error);
            this.sessionsList.showError(error instanceof Error ? error.message : 'Failed to load sessions');
        }
    }

    private async openSessionDetails(sessionId: string): Promise<void> {
        try {
            // Get session data
            const sessions = this.currentUser ? 
                await this.apiClient.getInterviews(this.currentUser.email) : 
                await this.apiClient.getInterviews();
                
            this.currentSession = sessions.find(s => s.id === sessionId) || null;
            
            if (!this.currentSession) {
                throw new Error('Session not found');
            }
            
            // Update panel header
            const sessionIdElement = document.getElementById('selected-session-id');
            if (sessionIdElement) {
                sessionIdElement.textContent = `#${sessionId.substring(0, 8)}`;
            }
            
            // Show details panel
            this.detailsPanel.classList.add('active');
            
            // Update resizers
            this.panelResizer.showResizers();
            
            // Load session details
            this.sessionDetails.showLoading();
            this.sessionDetails.showSession(this.currentSession);
            
        } catch (error) {
            console.error('Failed to open session details:', error);
            this.sessionDetails.showError(error instanceof Error ? error.message : 'Failed to load session');
        }
    }

    private closeSessionsPanel(): void {
        this.sessionsPanel.classList.remove('active');
        this.currentUser = null;
        
        // Reset panel sizes and hide resizers
        this.panelResizer.resetPanelSizes();
        
        // Also close details panel if open
        this.closeDetailsPanel();
    }

    private closeDetailsPanel(): void {
        this.detailsPanel.classList.remove('active');
        this.currentSession = null;
        this.sessionDetails.clear();
        
        // Update resizers visibility
        this.panelResizer.showResizers();
    }

    // Public methods for external control
    public async refresh(): Promise<void> {
        // Close all secondary panels
        this.closeSessionsPanel();
        
        // Reload users
        await this.loadUsers();
    }

    public isSessionsPanelOpen(): boolean {
        return this.sessionsPanel.classList.contains('active');
    }

    public isDetailsPanelOpen(): boolean {
        return this.detailsPanel.classList.contains('active');
    }
}
