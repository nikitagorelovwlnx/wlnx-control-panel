import { User, ChatMessage, InterviewSummary, Interview, HealthResponse } from '../types/api.js';

export class ApiClient {
    private baseUrl: string;
    
    constructor(baseUrl: string = 'http://localhost:3000') {
        this.baseUrl = baseUrl;
    }

    private async makeRequest<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    async getUsers(): Promise<User[]> {
        try {
            const response = await this.makeRequest<{users: User[]}>('/api/users');
            return response.users;
        } catch (error) {
            console.error('Failed to fetch users:', error);
            return [];
        }
    }

    async getInterviews(email?: string): Promise<Interview[]> {
        try {
            if (email) {
                const response = await this.makeRequest<Interview[]>(`/api/interviews?email=${encodeURIComponent(email)}`);
                return Array.isArray(response) ? response : [];
            } else {
                // Get all users first, then get interviews for each
                const users = await this.getUsers();
                const allInterviews: Interview[] = [];
                
                for (const user of users) {
                    try {
                        const userInterviews = await this.makeRequest<Interview[]>(`/api/interviews?email=${encodeURIComponent(user.email)}`);
                        if (Array.isArray(userInterviews)) {
                            allInterviews.push(...userInterviews);
                        }
                    } catch (error) {
                        // Skip failed user interviews
                        continue;
                    }
                }
                
                return allInterviews;
            }
        } catch (error) {
            return [];
        }
    }

    async getInterviewMessages(interviewId: string): Promise<ChatMessage[]> {
        // Messages endpoint not available in API, return mock data for now
        return [
            {
                id: '1',
                interviewId,
                sender: 'interviewer',
                content: 'Hello! Ready to start the interview?',
                timestamp: new Date().toISOString(),
                senderName: 'Interviewer'
            },
            {
                id: '2',
                interviewId,
                sender: 'user',
                content: 'Yes, I\'m ready!',
                timestamp: new Date().toISOString(),
                senderName: 'Candidate'
            }
        ];
    }

    async getInterviewSummary(interviewId: string): Promise<InterviewSummary> {
        // Summary endpoint not available in API, get interview data and create mock summary
        try {
            const interviews = await this.getInterviews();
            const interview = interviews.find(i => i.id === interviewId);
            
            if (!interview) {
                throw new Error('Interview not found');
            }

            return {
                id: `summary-${interviewId}`,
                interviewId,
                userId: interview.email,
                summary: interview.summary,
                keyPoints: [
                    'Transcription available',
                    'Summary generated',
                    'Interview completed',
                    'Data stored successfully'
                ],
                rating: 4,
                duration: 45 * 60, // 45 minutes in seconds
                createdAt: interview.created_at
            };
        } catch (error) {
            throw new Error('Unable to generate interview summary');
        }
    }

    async checkServerConnection(): Promise<boolean> {
        try {
            // Use health endpoint as specified in API docs
            const response = await this.makeRequest<HealthResponse>('/health');
            return response !== null;
        } catch (error) {
            try {
                // Fallback to /api/users if health endpoint doesn't exist
                await this.makeRequest<{users: User[]}>('/api/users');
                return true;
            } catch (fallbackError) {
                return false;
            }
        }
    }

    async checkBotStatus(): Promise<boolean> {
        try {
            // Check bot health endpoint
            const response = await this.makeRequest<HealthResponse>('/health');
            return response && (response.status === 'healthy' || response.status === 'degraded');
        } catch (error) {
            try {
                // Fallback to simple bot status check
                await this.makeRequest<any>('/api/bot/status');
                return true;
            } catch (fallbackError) {
                // If no specific bot endpoints, assume bot is part of the server
                return await this.checkServerConnection();
            }
        }
    }

    async getDetailedHealthStatus(): Promise<{
        server: { status: 'up' | 'down', responseTime?: number };
        bot: { status: 'up' | 'down' | 'degraded', responseTime?: number };
        overall: 'healthy' | 'degraded' | 'unhealthy';
    }> {
        const serverStartTime = Date.now();
        const botStartTime = Date.now();

        const [serverStatus, botResponse] = await Promise.allSettled([
            this.checkServerConnection(),
            this.getBotHealthDetails()
        ]);

        const serverResult = {
            status: serverStatus.status === 'fulfilled' && serverStatus.value ? 'up' as const : 'down' as const,
            responseTime: serverStatus.status === 'fulfilled' ? Date.now() - serverStartTime : undefined
        };

        const botResult = botResponse.status === 'fulfilled' 
            ? botResponse.value 
            : { status: 'down' as const, responseTime: Date.now() - botStartTime };

        // Calculate overall status
        let overall: 'healthy' | 'degraded' | 'unhealthy';
        if (serverResult.status === 'up' && botResult.status === 'up') {
            overall = 'healthy';
        } else if (serverResult.status === 'up' || botResult.status === 'up' || botResult.status === 'degraded') {
            overall = 'degraded';
        } else {
            overall = 'unhealthy';
        }

        return {
            server: serverResult,
            bot: botResult,
            overall
        };
    }

    private async getBotHealthDetails(): Promise<{ status: 'up' | 'down' | 'degraded', responseTime?: number }> {
        const startTime = Date.now();
        
        try {
            // Try to get detailed health status from bot
            const response = await this.makeRequest<HealthResponse>('/health');
            const responseTime = Date.now() - startTime;
            
            if (response && response.status) {
                return {
                    status: response.status === 'healthy' ? 'up' : 
                           response.status === 'degraded' ? 'degraded' : 'down',
                    responseTime
                };
            }
            
            // Fallback to simple bot check
            const isUp = await this.checkBotStatus();
            return {
                status: isUp ? 'up' : 'down',
                responseTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'down',
                responseTime: Date.now() - startTime
            };
        }
    }

    async getSystemStatus(): Promise<{server: boolean, bot: boolean}> {
        const healthStatus = await this.getDetailedHealthStatus();
        
        return { 
            server: healthStatus.server.status === 'up',
            bot: healthStatus.bot.status === 'up' || healthStatus.bot.status === 'degraded'
        };
    }
}
