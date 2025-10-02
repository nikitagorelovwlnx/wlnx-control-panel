import { User, ChatMessage, InterviewSummary, Interview, HealthResponse, PingResponse, PromptsConfiguration, ConversationStage, Prompt, Coach } from '../types/api.js';

export class ApiClient {
    private baseUrl: string;
    private botHealthUrl: string;
    
    constructor(baseUrl: string = 'http://localhost:3000', botHealthUrl: string = 'http://localhost:3002') {
        this.baseUrl = baseUrl;
        this.botHealthUrl = botHealthUrl;
        
        // Note: botHealthUrl is optional - bot health monitoring is separate from main API
        console.info(`API Client configured: API=${this.baseUrl}, BotHealth=${this.botHealthUrl}`);
    }

    private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn(`Main API server not available at ${this.baseUrl}${endpoint}`);
            } else {
                console.error(`API Error for ${endpoint}:`, error);
            }
            throw error;
        }
    }

    private async makeBotHealthRequest<T>(endpoint: string): Promise<T> {
        try {
            const response = await fetch(`${this.botHealthUrl}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Expected JSON response, got ${contentType}. Bot health server may not be running.`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                // This is expected when bot health server is not running - suppress noisy error
                console.debug(`Bot health server not available at ${this.botHealthUrl}${endpoint} (this is normal in development)`);
            } else if (error instanceof SyntaxError && error.message.includes('Unexpected token')) {
                console.warn(`Bot health endpoint ${endpoint} returned HTML instead of JSON - health server not running`);
            } else {
                console.error(`Bot Health API Error for ${endpoint}:`, error);
            }
            throw error;
        }
    }

    async getUsers(): Promise<User[]> {
        try {
            const response = await this.makeRequest<{users: User[]}>('/api/users');
            return response.users;
        } catch (error) {
            console.error('Failed to fetch users, returning demo data:', error);
            // Return demo data when API is not available
            return this.getDemoUsers();
        }
    }

    private getDemoUsers(): User[] {
        return [
            {
                email: 'alice.johnson@company.com',
                session_count: 8,
                last_session: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                first_session: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                sessions: [
                    {
                        id: 'demo-001',
                        user_id: 'alice.johnson@company.com',
                        email: 'alice.johnson@company.com',
                        transcription: 'Coach: How are you feeling today Alice?\nAlice: I\'ve been feeling quite stressed lately with work deadlines.\nCoach: Let\'s work through some relaxation techniques together.',
                        summary: 'Alice expressed work-related stress. Discussed breathing exercises and time management strategies.',
                        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                email: 'bob.smith@startup.io',
                session_count: 15,
                last_session: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                first_session: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                sessions: [
                    {
                        id: 'demo-002',
                        user_id: 'bob.smith@startup.io',
                        email: 'bob.smith@startup.io',
                        transcription: 'Coach: Hi Bob, how has your week been?\nBob: Pretty good actually! I implemented some of the mindfulness techniques we discussed.\nCoach: That\'s wonderful to hear! How did they work for you?',
                        summary: 'Bob reported positive progress with mindfulness practices. Discussed maintaining consistency and expanding techniques.',
                        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            },
            {
                email: 'carol.davis@tech.corp',
                session_count: 3,
                last_session: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                first_session: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
                sessions: [
                    {
                        id: 'demo-003',
                        user_id: 'carol.davis@tech.corp',
                        email: 'carol.davis@tech.corp',
                        transcription: 'Coach: Carol, tell me about your sleep patterns lately.\nCarol: I\'ve been having trouble falling asleep, especially on Sunday nights.\nCoach: Sunday night insomnia is common. Let\'s explore some relaxation techniques.',
                        summary: 'Carol discussed sleep difficulties, particularly Sunday night anxiety. Introduced progressive muscle relaxation techniques.',
                        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                    }
                ]
            }
        ];
    }

    async getInterviews(email?: string): Promise<Interview[]> {
        try {
            if (email) {
                console.log('Fetching interviews for user:', email);
                const response = await this.makeRequest<any>(`/api/interviews?email=${encodeURIComponent(email)}`);
                console.log('Interviews response for', email, ':', response);
                
                // Check if response has results array
                if (response && response.results && Array.isArray(response.results)) {
                    console.log('Found results array:', response.results);
                    // Map API WellnessSession to Interview format
                    return response.results.map((session: any) => ({
                        id: session.id,
                        user_id: session.user_id,
                        email: session.user_id, // API uses user_id as email
                        created_at: session.created_at,
                        updated_at: session.updated_at,
                        transcription: session.transcription,
                        summary: session.summary,
                        analysis_results: session.analysis_results,
                        wellness_data: session.wellness_data
                    }));
                } else if (Array.isArray(response)) {
                    return response;
                } else {
                    console.warn('Unexpected response format:', response);
                    return [];
                }
            } else {
                // Get all users first, then get interviews for each
                const users = await this.getUsers();
                const allInterviews: Interview[] = [];
                
                for (const user of users) {
                    try {
                        const response = await this.makeRequest<any>(`/api/interviews?email=${encodeURIComponent(user.email)}`);
                        let userInterviews: Interview[] = [];
                        
                        if (response && response.results && Array.isArray(response.results)) {
                            userInterviews = response.results;
                        } else if (Array.isArray(response)) {
                            userInterviews = response;
                        }
                        
                        if (userInterviews.length > 0) {
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
            console.error('Failed to fetch interviews:', error);
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
                userId: interview.email || interview.user_id || 'unknown',
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
            // Check bot health endpoint on port 3002
            const response = await this.makeBotHealthRequest<HealthResponse>('/health');
            return response && (response.status === 'healthy' || response.status === 'degraded');
        } catch (error) {
            try {
                // Fallback to /status endpoint (same as /health according to bot API)
                const statusResponse = await this.makeBotHealthRequest<HealthResponse>('/status');
                return statusResponse && (statusResponse.status === 'healthy' || statusResponse.status === 'degraded');
            } catch (fallbackError) {
                try {
                    // Final fallback to /ping endpoint
                    const pingResponse = await this.makeBotHealthRequest<PingResponse>('/ping');
                    return pingResponse.status === 'ok';
                } catch (pingError) {
                    // Health check server is not running, but bot might still be working
                    // Check if we can infer bot status from API server
                    return await this.inferBotStatusFromApi();
                }
            }
        }
    }

    private async inferBotStatusFromApi(): Promise<boolean> {
        try {
            // Try to check if there's any bot-related activity or endpoints
            // This is a fallback when health check server is not available
            console.debug('Bot health check server unavailable, using fallback status detection');
            
            // For now, assume bot is offline when health server is not available
            // In production, you might want to check for recent bot activity via API
            return false; // Conservative approach - assume offline without health check
        } catch (error) {
            console.debug('Cannot infer bot status:', error);
            return false;
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
            // Try to get detailed health status from bot on port 3002
            const response = await this.makeBotHealthRequest<HealthResponse>('/health');
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

    // Session deletion methods
    async deleteSession(sessionId: string, userEmail?: string): Promise<boolean> {
        if (!userEmail) {
            console.warn('No userEmail provided for deletion');
            return false;
        }

        console.log(`Deleting session ${sessionId} for user ${userEmail}`);
        
        try {
            // Use the working variant: Body JSON
            await this.makeRequest(`/api/interviews/${sessionId}`, {
                method: 'DELETE',
                body: JSON.stringify({ email: userEmail })
            });
            console.log(`✅ Session ${sessionId} deleted successfully`);
            return true;
        } catch (error) {
            console.error('Failed to delete session:', error);
            return false;
        }
    }

    async deleteAllUserSessions(userEmail: string): Promise<{success: boolean, deletedCount: number}> {
        try {
            // Get user sessions first
            const interviews = await this.getInterviews(userEmail);
            let deletedCount = 0;
            
            // Delete each session
            for (const interview of interviews) {
                try {
                    const success = await this.deleteSession(interview.id, userEmail);
                    if (success) {
                        deletedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to delete session ${interview.id}:`, error);
                }
            }
            
            return { success: true, deletedCount };
        } catch (error) {
            console.error('Failed to delete all user sessions:', error);
            return { success: false, deletedCount: 0 };
        }
    }

    // Prompts Configuration API methods
    async getPromptsConfiguration(): Promise<PromptsConfiguration> {
        console.log('🔄 Fetching prompts configuration from server at /api/prompts');
        
        try {
            // Call real API endpoint
            const response = await this.makeRequest<any>('/api/prompts');
            console.log('📡 Server response:', response);
            
            // Check if server returned proper format - handle real API structure
            const data = response.data || response;
            if (data && typeof data === 'object') {
                // Transform server data structure to our expected format
                const stages: ConversationStage[] = [];
                const prompts: Prompt[] = [];
                
                // Server might return different structure, adapt accordingly
                if (data.stages && data.prompts) {
                    // Server returns our expected format
                    return {
                        stages: data.stages,
                        prompts: data.prompts,
                        lastUpdated: data.lastUpdated || new Date().toISOString()
                    };
                } else if (typeof data === 'object') {
                    // Server returns stage-based structure: {stage_name: {question_prompt, extraction_prompt}}
                    let stageOrder = 1;
                    for (const [stageKey, stageData] of Object.entries(data)) {
                        if (typeof stageData === 'object' && stageData !== null) {
                            // Create stage
                            stages.push({
                                id: stageKey,
                                name: this.formatStageName(stageKey),
                                description: `Stage: ${this.formatStageName(stageKey)}`,
                                order: stageOrder++
                            });
                            
                            // Create prompts for this stage
                            const stageDataObj = stageData as any;
                            if (stageDataObj.question_prompt) {
                                prompts.push({
                                    id: `${stageKey}_question`,
                                    stageId: stageKey,
                                    content: stageDataObj.question_prompt,
                                    order: 1,
                                    isActive: true,
                                    description: 'Question Prompt'
                                });
                            }
                            if (stageDataObj.extraction_prompt) {
                                prompts.push({
                                    id: `${stageKey}_extraction`,
                                    stageId: stageKey,
                                    content: stageDataObj.extraction_prompt,
                                    order: 2,
                                    isActive: true,
                                    description: 'Extraction Prompt'
                                });
                            }
                        }
                    }
                    
                    if (stages.length > 0) {
                        console.log('✅ Successfully transformed server data:', { stages: stages.length, prompts: prompts.length });
                        return {
                            stages,
                            prompts,
                            lastUpdated: new Date().toISOString()
                        };
                    }
                }
                
                console.log('✅ Transformed server data:', { 
                    stages: stages.length, 
                    prompts: prompts.length 
                });
                
                return {
                    stages,
                    prompts,
                    lastUpdated: new Date().toISOString()
                };
            }
            
            // Server response invalid - use mock
            console.warn('⚠️ Invalid server response format, using mock data');
            console.log('Response structure:', Object.keys(response || {}));
            console.log('Data structure:', Object.keys(data || {}));
            
        } catch (error) {
            console.error('❌ Failed to fetch from /api/prompts:', error);
        }
        
        // Always fallback to mock data
        console.log('🔄 Using mock prompts configuration as fallback');
        return this.getMockPromptsConfiguration();
    }

    private formatStageName(stageKey: string): string {
        return stageKey
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async updateStagePrompts(stageId: string, prompts: Prompt[]): Promise<boolean> {
        try {
            console.log('🔄 Saving prompts for stage:', stageId, { promptCount: prompts.length });
            
            // Convert our Prompt[] format to server's expected format
            const questionPrompt = prompts.find(p => p.description?.includes('Question'))?.content || '';
            const extractionPrompt = prompts.find(p => p.description?.includes('Extraction'))?.content || '';
            
            const serverFormat = {
                question_prompt: questionPrompt,
                extraction_prompt: extractionPrompt
            };
            
            console.log('📡 Sending to server:', serverFormat);
            
            const response = await this.makeRequest(`/api/prompts/${stageId}`, {
                method: 'PUT',
                body: JSON.stringify(serverFormat)
            });
            
            console.log('✅ Stage prompts saved successfully:', response);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to save stage prompts:', error);
            throw error;
        }
    }

    private getMockPromptsConfiguration(): PromptsConfiguration {
        const stages: ConversationStage[] = [
            { id: 'welcome', name: 'Welcome & Introduction', description: 'Initial greeting and rapport building', order: 1 },
            { id: 'assessment', name: 'Health Assessment', description: 'Gathering baseline health information', order: 2 },
            { id: 'goals', name: 'Goal Setting', description: 'Identifying wellness goals and priorities', order: 3 },
            { id: 'planning', name: 'Action Planning', description: 'Creating specific wellness action plans', order: 4 },
            { id: 'closure', name: 'Session Closure', description: 'Wrapping up and next steps', order: 5 }
        ];

        const prompts: Prompt[] = [
            // Welcome stage prompts
            { id: 'w1', stageId: 'welcome', content: 'Hello! I\'m your wellness coach. How are you feeling today?', order: 1, isActive: true, description: 'Question Prompt' },
            { id: 'w2', stageId: 'welcome', content: 'Extract the user\'s emotional state and readiness for coaching from their response.', order: 2, isActive: true, description: 'Extraction Prompt' },

            // Assessment stage prompts  
            { id: 'a1', stageId: 'assessment', content: 'Let\'s start with your current health status. How would you rate your overall health on a scale of 1-10?', order: 1, isActive: true, description: 'Question Prompt' },
            { id: 'a2', stageId: 'assessment', content: 'Extract specific health metrics, sleep patterns, nutrition habits, and physical activity levels from the user\'s response.', order: 2, isActive: true, description: 'Extraction Prompt' },

            // Goals stage prompts
            { id: 'g1', stageId: 'goals', content: 'What are your main wellness goals for the next 3 months?', order: 1, isActive: true, description: 'Question Prompt' },
            { id: 'g2', stageId: 'goals', content: 'Extract specific, measurable goals and identify the user\'s motivation level and priorities.', order: 2, isActive: true, description: 'Extraction Prompt' },

            // Planning stage prompts
            { id: 'p1', stageId: 'planning', content: 'Let\'s create a specific action plan. What\'s one small step you can take this week?', order: 1, isActive: true, description: 'Question Prompt' },
            { id: 'p2', stageId: 'planning', content: 'Extract concrete action steps, timelines, and potential obstacles from the user\'s planning discussion.', order: 2, isActive: true, description: 'Extraction Prompt' },

            // Closure stage prompts
            { id: 'c1', stageId: 'closure', content: 'Let\'s summarize what we\'ve discussed today. What are your key takeaways?', order: 1, isActive: true, description: 'Question Prompt' },
            { id: 'c2', stageId: 'closure', content: 'Extract the session summary, key commitments, and follow-up actions from the user\'s response.', order: 2, isActive: true, description: 'Extraction Prompt' }
        ];

        return {
            stages,
            prompts,
            lastUpdated: new Date().toISOString()
        };
    }

    // Coach API methods
    async getCoaches(): Promise<Coach[]> {
        try {
            console.log('🔄 Fetching coaches from /api/coaches');
            const response = await this.makeRequest<any>('/api/coaches');
            console.log('📡 Coaches response:', response);
            
            // Handle different response formats
            const coaches = response.coaches || response.data || response;
            if (Array.isArray(coaches)) {
                return coaches;
            }
            
            console.warn('⚠️ Invalid coaches response format, using mock data');
        } catch (error) {
            console.error('❌ Failed to fetch coaches:', error);
        }
        
        // Fallback to mock data
        return this.getMockCoaches();
    }

    async updateCoach(coachId: string, prompt: string): Promise<boolean> {
        try {
            console.log('🔄 Updating coach:', coachId, 'with prompt length:', prompt.length);
            
            const response = await this.makeRequest(`/api/coaches/${coachId}`, {
                method: 'PUT',
                body: JSON.stringify({ prompt })
            });
            
            console.log('✅ Coach updated successfully:', response);
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update coach:', error);
            throw error;
        }
    }

    private getMockCoaches(): Coach[] {
        return [
            {
                id: 'default-coach',
                name: 'Default Wellness Coach',
                description: 'The main wellness coaching assistant',
                prompt: 'You are Anna, a professional wellness coach. You help people with nutrition, fitness, and overall health. Be empathetic, supportive, and provide practical advice. Always maintain a warm and encouraging tone.',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
    }

}
