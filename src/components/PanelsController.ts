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
    private pollingInterval: number | null = null;
    private readonly POLLING_INTERVAL_MS = 5000; // 5 seconds

    constructor(apiClient: ApiClient) {
        this.apiClient = apiClient;
        
        // Get panel elements
        this.sessionsPanel = document.getElementById('sessions-panel')!;
        this.detailsPanel = document.getElementById('details-panel')!;
        
        // Initialize components
        const usersContainer = document.getElementById('users-list')!;
        const sessionsContainer = document.getElementById('sessions-list')!;
        const detailsContainer = document.querySelector('.details-container')!;
        this.sessionDetails = new SessionDetails(detailsContainer as HTMLElement);
        this.sessionsList = new SessionsList(sessionsContainer);
        this.usersList = new UsersList(usersContainer.id);
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

        // Collapse buttons
        document.getElementById('collapse-users')?.addEventListener('click', () => {
            this.togglePanelCollapse('users-panel');
        });

        document.getElementById('collapse-sessions')?.addEventListener('click', () => {
            this.togglePanelCollapse('sessions-panel');
        });

        document.getElementById('collapse-summary')?.addEventListener('click', () => {
            this.toggleSectionCollapse('summary-section');
        });

        document.getElementById('collapse-transcript')?.addEventListener('click', () => {
            this.toggleSectionCollapse('transcript-section');
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
            console.log('Sessions loaded for', userEmail, ':', sessions);
            console.log('Number of sessions:', sessions.length);
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
            console.log('About to show session details for:', this.currentSession);
            this.sessionDetails.showSession(this.currentSession);
            
            // Start polling for updates
            this.startPolling();
            
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
        
        // Stop polling when details panel is closed
        this.stopPolling();
        
        // If no sessions panel open, hide resizers
        if (!this.isSessionsPanelOpen()) {
            this.panelResizer.hideResizers();
        }
        
        // Update resizers for current layout
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

    private togglePanelCollapse(panelId: string): void {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const isCollapsed = panel.classList.contains('collapsed');
        const collapseBtn = panel.querySelector('.collapse-panel-btn') as HTMLButtonElement;
        
        if (isCollapsed) {
            // Expand
            panel.classList.remove('collapsed');
            if (collapseBtn) {
                collapseBtn.textContent = panelId === 'users-panel' || panelId === 'sessions-panel' ? '←' : '↑';
                collapseBtn.title = 'Collapse';
            }
        } else {
            // Collapse
            panel.classList.add('collapsed');
            if (collapseBtn) {
                collapseBtn.textContent = panelId === 'users-panel' || panelId === 'sessions-panel' ? '→' : '↓';
                collapseBtn.title = 'Expand';
            }
        }
    }

    private toggleSectionCollapse(sectionId: string): void {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const isCollapsed = section.classList.contains('collapsed');
        const collapseBtn = section.querySelector('.collapse-panel-btn') as HTMLButtonElement;
        
        if (isCollapsed) {
            // Expand
            section.classList.remove('collapsed');
            if (collapseBtn) {
                collapseBtn.textContent = '↑';
                collapseBtn.title = 'Collapse';
            }
        } else {
            // Collapse
            section.classList.add('collapsed');
            if (collapseBtn) {
                collapseBtn.textContent = '↓';
                collapseBtn.title = 'Expand';
            }
        }
    }

    private startPolling(): void {
        // Stop any existing polling
        this.stopPolling();
        
        if (!this.currentSession) return;
        
        console.log('Starting polling for session updates');
        
        // Show polling indicator
        const indicator = document.getElementById('polling-indicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
        
        this.pollingInterval = window.setInterval(async () => {
            await this.pollForUpdates();
        }, this.POLLING_INTERVAL_MS);
    }

    private stopPolling(): void {
        if (this.pollingInterval) {
            console.log('Stopping polling for session updates');
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            
            // Hide polling indicator
            const indicator = document.getElementById('polling-indicator');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }

    private async pollForUpdates(): Promise<void> {
        if (!this.currentSession) {
            this.stopPolling();
            return;
        }

        try {
            // Fetch updated session data
            const sessions = this.currentUser ? 
                await this.apiClient.getInterviews(this.currentUser.email) : 
                await this.apiClient.getInterviews();
                
            const updatedSession = sessions.find(s => s.id === this.currentSession!.id);
            
            if (!updatedSession) {
                console.log('Session no longer exists, stopping polling');
                this.stopPolling();
                return;
            }

            // Check if summary or transcription has changed
            const summaryChanged = updatedSession.summary !== this.currentSession.summary;
            const transcriptionChanged = updatedSession.transcription !== this.currentSession.transcription;
            
            if (summaryChanged || transcriptionChanged) {
                console.log('Session updates detected:', {
                    summaryChanged,
                    transcriptionChanged
                });
                
                // Show update indicator
                this.showUpdateIndicator();
                
                // Update current session
                this.currentSession = updatedSession;
                
                // Update the UI
                this.sessionDetails.showSession(this.currentSession);
                
                // Hide update indicator after a brief moment
                setTimeout(() => this.hideUpdateIndicator(), 2000);
            }
            
        } catch (error) {
            console.error('Polling error:', error);
            // Don't stop polling on temporary errors, but log them
        }
    }

    private showUpdateIndicator(): void {
        const indicator = document.getElementById('selected-session-id');
        if (indicator) {
            indicator.style.background = 'var(--success)';
            indicator.style.color = 'white';
            indicator.style.transition = 'all 0.3s ease';
        }
    }

    private hideUpdateIndicator(): void {
        const indicator = document.getElementById('selected-session-id');
        if (indicator) {
            indicator.style.background = '';
            indicator.style.color = '';
        }
    }
}
