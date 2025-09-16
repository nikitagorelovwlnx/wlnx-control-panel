import { User, ChatMessage, InterviewSummary, Interview, ApiResponse } from '../types/api.js';

export class ApiClient {
    private baseUrl: string;
    
    constructor(baseUrl: string = 'http://localhost:8000') {
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
        const response = await this.makeRequest<ApiResponse<User[]>>('/api/users');
        return response.data;
    }

    async getInterviews(): Promise<Interview[]> {
        const response = await this.makeRequest<ApiResponse<Interview[]>>('/api/interviews');
        return response.data;
    }

    async getInterviewMessages(interviewId: string): Promise<ChatMessage[]> {
        const response = await this.makeRequest<ApiResponse<ChatMessage[]>>(`/api/interviews/${interviewId}/messages`);
        return response.data;
    }

    async getInterviewSummary(interviewId: string): Promise<InterviewSummary> {
        const response = await this.makeRequest<ApiResponse<InterviewSummary>>(`/api/interviews/${interviewId}/summary`);
        return response.data;
    }

    async checkConnection(): Promise<boolean> {
        try {
            await this.makeRequest('/api/health');
            return true;
        } catch (error) {
            return false;
        }
    }
}
