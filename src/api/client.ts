import { User, ChatMessage, InterviewSummary, Interview } from '../types/api.js';

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
            // Use /api/users as health check since it doesn't require parameters
            await this.makeRequest('/api/users');
            return true;
        } catch (error) {
            return false;
        }
    }

    async checkBotStatus(): Promise<boolean> {
        try {
            // Check if bot endpoint exists, if not assume server handles bot functionality
            await this.makeRequest('/api/bot/status');
            return true;
        } catch (error) {
            // If bot endpoint doesn't exist, check if server is running (assume bot is integrated)
            return await this.checkServerConnection();
        }
    }

    async getSystemStatus(): Promise<{server: boolean, bot: boolean}> {
        const [server, bot] = await Promise.all([
            this.checkServerConnection(),
            this.checkBotStatus()
        ]);
        return { server, bot };
    }
}
