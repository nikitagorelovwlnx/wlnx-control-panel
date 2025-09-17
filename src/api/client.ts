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
        // API only provides current user endpoint, return as single user array
        try {
            const response = await this.makeRequest<User>('/api/users/me');
            return [response]; // Wrap single user in array
        } catch (error) {
            return []; // Return empty array if not authenticated
        }
    }

    async getInterviews(): Promise<Interview[]> {
        try {
            const response = await this.makeRequest<Interview[]>('/api/interviews');
            return response;
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
                userId: interview.userId || 'unknown',
                summary: 'Interview completed successfully. The candidate demonstrated good technical knowledge and communication skills.',
                keyPoints: [
                    'Strong problem-solving abilities',
                    'Good communication skills',
                    'Relevant technical experience',
                    'Cultural fit assessment positive'
                ],
                rating: 4,
                duration: 45 * 60, // 45 minutes in seconds
                createdAt: interview.startTime || new Date().toISOString()
            };
        } catch (error) {
            throw new Error('Unable to generate interview summary');
        }
    }

    async checkConnection(): Promise<boolean> {
        try {
            // Use /api/users/me as health check since /api/health doesn't exist
            await this.makeRequest('/api/users/me');
            return true;
        } catch (error) {
            return false;
        }
    }
}
