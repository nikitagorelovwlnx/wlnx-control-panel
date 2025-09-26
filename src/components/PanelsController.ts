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
    private usersPollingInterval: number | null = null;
    private readonly POLLING_INTERVAL_MS = 1000; // 1 second for fast transcription updates
    private readonly USERS_POLLING_INTERVAL_MS = 30000; // 30 seconds for users

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
        this.sessionsList = new SessionsList(sessionsContainer, apiClient);
        this.usersList = new UsersList(usersContainer.id);
        this.panelResizer = new PanelResizer(document.getElementById('panels-container')!);
        
        this.setupEventHandlers();
    }

    private setupEventHandlers(): void {
        // User selection handler
        this.usersList.onUserSelect((userEmail: string) => {
            this.openUserSessions(userEmail);
        });

        // Delete all sessions handler
        this.usersList.onDeleteAllSessions(async (userEmail: string) => {
            await this.deleteAllUserSessions(userEmail);
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
            
            // Start polling for users updates if not already started
            this.startUsersPolling();
        } catch (error) {
            console.error('Failed to load users:', error);
            this.usersList.showError(error instanceof Error ? error.message : 'Failed to load users');
        }
    }

    private async openUserSessions(userEmail: string): Promise<void> {
        try {
            // Close details panel if open (when switching between users)
            if (this.isDetailsPanelOpen()) {
                this.closeDetailsPanel();
            }
            
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
        
        // Clear active state from all user cards
        const allUserCards = document.querySelectorAll('.user-card');
        allUserCards.forEach(card => card.classList.remove('active', 'selected'));
        
        // Reset panel sizes and hide resizers
        this.panelResizer.resetPanelSizes();
        
        // Also close details panel if open
        this.closeDetailsPanel();
    }

    private closeDetailsPanel(): void {
        this.detailsPanel.classList.remove('active');
        this.currentSession = null;
        
        // Clear active state from all session cards
        const allSessionCards = document.querySelectorAll('.session-card');
        allSessionCards.forEach(card => card.classList.remove('active', 'selected'));
        
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
        
        // Start polling for users updates
        this.startUsersPolling();
    }

    private async deleteAllUserSessions(userEmail?: string): Promise<void> {
        const emailToDelete = userEmail || this.currentUser?.email;
        if (!emailToDelete) {
            console.error('No user email available for deletion');
            return;
        }

        try {
            const result = await this.apiClient.deleteAllUserSessions(emailToDelete);
            if (result.success) {
                console.log(`Successfully deleted ${result.deletedCount} sessions for ${emailToDelete}`);
                
                // Refresh user data after deletion
                await this.loadUsers();
                
                // Update the sessions panel to reflect changes if it's open for this user
                if (this.isSessionsPanelOpen() && this.currentUser?.email === emailToDelete) {
                    const sessions = await this.apiClient.getInterviews(emailToDelete);
                    this.sessionsList.showSessions(sessions, emailToDelete);
                }
            } else {
                console.error('Failed to delete all sessions');
            }
        } catch (error) {
            console.error('Error deleting all sessions:', error);
        }
    }

    private startUsersPolling(): void {
        this.stopUsersPolling();
        
        console.log('Starting users polling');
        
        this.usersPollingInterval = window.setInterval(async () => {
            await this.pollUsersForUpdates();
        }, this.USERS_POLLING_INTERVAL_MS);
    }

    private stopUsersPolling(): void {
        if (this.usersPollingInterval) {
            console.log('Stopping users polling');
            clearInterval(this.usersPollingInterval);
            this.usersPollingInterval = null;
        }
    }

    private async pollUsersForUpdates(): Promise<void> {
        try {
            console.log('Polling for users updates');
            const users = await this.apiClient.getUsers();
            
            // Check if user list has changed
            const currentUsers = this.usersList.getUsers();
            const hasChanges = this.compareUserLists(currentUsers, users);
            
            if (hasChanges) {
                console.log('Users list updated');
                this.usersList.render(users);
                
                // If we have a current user selected, update their sessions too
                if (this.currentUser) {
                    const updatedUser = users.find(u => u.email === this.currentUser!.email);
                    if (updatedUser) {
                        this.currentUser = updatedUser;
                        this.sessionsList.showSessions(updatedUser.sessions || [], updatedUser.email);
                    }
                }
            }
        } catch (error) {
            console.error('Users polling error:', error);
        }
    }

    private compareUserLists(current: any[], updated: any[]): boolean {
        if (current.length !== updated.length) return true;
        
        // Compare each user's session count and last session
        for (let i = 0; i < current.length; i++) {
            const curr = current[i];
            const upd = updated[i];
            
            if (curr.email !== upd.email ||
                curr.session_count !== upd.session_count ||
                curr.last_session !== upd.last_session) {
                return true;
            }
        }
        
        return false;
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

            // Check what changed
            const summaryChanged = updatedSession.summary !== this.currentSession.summary;
            const transcriptionChanged = updatedSession.transcription !== this.currentSession.transcription;
            const wellnessChanged = JSON.stringify(updatedSession.wellness_data) !== JSON.stringify(this.currentSession.wellness_data);
            
            if (summaryChanged || transcriptionChanged || wellnessChanged) {
                console.log('Session updates detected:', {
                    summaryChanged,
                    transcriptionChanged,
                    wellnessChanged
                });
                
                // Show update indicator
                this.showUpdateIndicator();
                
                // Update current session
                this.currentSession = updatedSession;
                
                // Update only the specific content without changing tabs
                this.sessionDetails.updateContent(this.currentSession, {
                    summary: summaryChanged,
                    transcript: transcriptionChanged,
                    wellness: wellnessChanged
                });
                
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
