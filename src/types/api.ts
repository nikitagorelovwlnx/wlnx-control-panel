// API data types for WLNX Control Panel

export interface User {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive';
    createdAt: string;
    lastActivity?: string;
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
    userId: string;
    title: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    startTime: string;
    endTime?: string;
    participantCount: number;
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
