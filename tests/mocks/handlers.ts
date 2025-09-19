import { http, HttpResponse } from 'msw';
import { mockUsers, mockInterviews, mockHealthStatus } from './data';

// Track deleted sessions for testing
let deletedSessions = new Set<string>();

export const handlers = [
  // Get users
  http.get('http://localhost:3000/api/users', () => {
    return HttpResponse.json(mockUsers);
  }),

  // Get health status
  http.get('http://localhost:3000/api/health', () => {
    return HttpResponse.json(mockHealthStatus);
  }),

  // Get user interviews
  http.get('http://localhost:3000/api/interviews', ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return HttpResponse.json({ error: 'Email parameter required' }, { status: 400 });
    }

    const userInterviews = mockInterviews[email] || [];
    // Filter out deleted sessions
    const activeInterviews = userInterviews.filter(interview => !deletedSessions.has(interview.id));
    
    return HttpResponse.json(activeInterviews);
  }),

  // Delete single session
  http.delete('http://localhost:3000/api/interviews/:sessionId', async ({ request, params }) => {
    const { sessionId } = params;
    
    // Check if request has email in body
    try {
      const body = await request.json() as { email?: string };
      if (!body.email) {
        return HttpResponse.json({ error: 'Email required in request body' }, { status: 400 });
      }
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Find if session exists
    const sessionExists = Object.values(mockInterviews)
      .flat()
      .some(interview => interview.id === sessionId && !deletedSessions.has(interview.id));

    if (!sessionExists) {
      return HttpResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Mark as deleted
    deletedSessions.add(sessionId as string);
    
    return HttpResponse.json({ success: true });
  }),

  // Fallback for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`);
    return HttpResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  })
];

// Helper function to reset mock state
export const resetMockState = () => {
  deletedSessions.clear();
};
