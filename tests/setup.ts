import '@testing-library/jest-dom';
import { mockUsers, mockInterviews, mockHealthStatus } from './mocks/data';

// Track deleted sessions for testing
let deletedSessions = new Set<string>();

// Mock fetch
global.fetch = jest.fn((url: string, options?: RequestInit) => {
  const urlStr = url.toString();
  const method = options?.method || 'GET';
  
  console.log(`Mock fetch: ${method} ${urlStr}`);
  
  if (method === 'GET' && urlStr.includes('/api/users')) {
    // Update session counts based on current interviews
    const updatedUsers = mockUsers.map(user => ({
      ...user,
      session_count: mockInterviews[user.email]?.filter(session => !deletedSessions.has(session.id)).length || 0
    }));
    
    console.log('Returning mock users:', updatedUsers);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ users: updatedUsers }),
    } as Response);
  }
  
  if (method === 'GET' && urlStr.includes('/api/health')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockHealthStatus),
    } as Response);
  }
  
  if (method === 'GET' && urlStr.includes('/api/interviews')) {
    const emailMatch = urlStr.match(/email=([^&]+)/);
    if (emailMatch) {
      const email = decodeURIComponent(emailMatch[1]);
      const userInterviews = mockInterviews[email] || [];
      const activeInterviews = userInterviews.filter(interview => !deletedSessions.has(interview.id));
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(activeInterviews),
      } as Response);
    }
  }
  
  if (method === 'DELETE' && urlStr.includes('/api/interviews/')) {
    const sessionIdMatch = urlStr.match(/\/api\/interviews\/([^?]+)/);
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      
      // Check if session exists
      const sessionExists = Object.values(mockInterviews)
        .flat()
        .some(interview => interview.id === sessionId && !deletedSessions.has(interview.id));
      
      if (!sessionExists) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Session not found' }),
        } as Response);
      }
      
      // Mark as deleted
      deletedSessions.add(sessionId);
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }
  }
  
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ error: 'Endpoint not found' }),
  } as Response);
}) as jest.Mock;

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Reset mock state before each test
beforeEach(() => {
  deletedSessions.clear();
  (global.fetch as jest.Mock).mockClear();
  (global.confirm as jest.Mock).mockClear();
});

// Clean up DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
});

// Keep console.log for debugging, mock others
global.console = {
  ...console,
  log: console.log, // Keep real console.log for debugging
  warn: jest.fn(),
  error: console.error, // Keep errors visible
};

// Export reset function for tests
export const resetMockState = () => {
  deletedSessions.clear();
};
