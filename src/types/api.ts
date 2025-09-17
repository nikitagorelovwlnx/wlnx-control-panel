// API data types for WLNX Control Panel

export interface User {
    email: string;
    session_count: number;
    last_session: string;
    first_session: string;
    sessions?: Interview[];
}

export interface ChatMessage {
    id: string;
    interviewId: string;
    sender: 'user' | 'interviewer';
    content: string;
    timestamp: string;
    senderName?: string;
}

export interface InterviewSummary {
    id: string;
    interviewId: string;
    userId: string;
    summary: string;
    keyPoints: string[];
    rating?: number;
    duration?: number;
    createdAt: string;
}

export interface Interview {
    id: string;
    email: string;
    transcription: string;
    summary: string;
    created_at: string;
    updated_at: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    timestamp: string;
}

export interface ApiError {
    success: false;
    error: string;
    code?: string;
    timestamp: string;
}

export interface HealthResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    services: {
        openai: ServiceStatus;
        api: ServiceStatus;
        telegram: ServiceStatus;
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
}

export interface ServiceStatus {
    status: 'up' | 'down' | 'unknown';
    responseTime?: number;
    error?: string;
}

export interface PingResponse {
    status: 'ok';
    timestamp: string;
}
