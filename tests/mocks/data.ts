import { User, Interview } from '../../src/types/api';

export const mockUsers: User[] = [
  {
    email: 'alice@example.com',
    session_count: 3,
    first_session: '2025-01-13T11:10:00Z',
    last_session: '2025-01-15T10:30:00Z'
  },
  {
    email: 'bob@example.com', 
    session_count: 2,
    first_session: '2025-01-12T13:45:00Z',
    last_session: '2025-01-14T14:15:00Z'
  },
  {
    email: 'charlie@example.com',
    session_count: 1,
    first_session: '2025-01-13T09:00:00Z',
    last_session: '2025-01-13T09:00:00Z'
  }
];

export const mockInterviews: Record<string, Interview[]> = {
  'alice@example.com': [
    {
      id: 'session-alice-1',
      email: 'alice@example.com',
      created_at: '2025-01-15T10:30:00Z',
      updated_at: '2025-01-15T10:45:00Z',
      summary: 'Initial wellness consultation discussing stress management and sleep patterns.',
      transcription: 'Patient reported moderate stress levels due to work pressure. Sleep quality has improved recently.'
    },
    {
      id: 'session-alice-2', 
      email: 'alice@example.com',
      created_at: '2025-01-14T16:20:00Z',
      updated_at: '2025-01-14T16:35:00Z',
      summary: 'Follow-up session on exercise routine and nutrition habits.',
      transcription: 'Patient has started regular morning walks. Diet includes more vegetables now.'
    },
    {
      id: 'session-alice-3',
      email: 'alice@example.com', 
      created_at: '2025-01-13T11:10:00Z',
      updated_at: '2025-01-13T11:25:00Z',
      summary: 'Discussion about work-life balance and mindfulness practices.',
      transcription: 'Patient interested in meditation techniques. Working on setting boundaries at work.'
    }
  ],
  'bob@example.com': [
    {
      id: 'session-bob-1',
      email: 'bob@example.com',
      created_at: '2025-01-14T14:15:00Z',
      updated_at: '2025-01-14T14:30:00Z',
      summary: 'Health assessment and goal setting session.',
      transcription: 'Patient wants to quit smoking and improve cardiovascular health.'
    },
    {
      id: 'session-bob-2',
      email: 'bob@example.com',
      created_at: '2025-01-12T13:45:00Z',
      updated_at: '2025-01-12T14:00:00Z',
      summary: 'Smoking cessation progress and support strategies.',
      transcription: 'Patient has reduced smoking by 50%. Using nicotine patches successfully.'
    }
  ],
  'charlie@example.com': [
    {
      id: 'session-charlie-1',
      email: 'charlie@example.com',
      created_at: '2025-01-13T09:00:00Z',
      updated_at: '2025-01-13T09:15:00Z',
      summary: 'First consultation about anxiety management.',
      transcription: 'Patient experiencing workplace anxiety. Discussed breathing techniques.'
    }
  ]
};

export const mockHealthStatus = {
  server: { status: 'up', timestamp: new Date().toISOString() },
  bot: { status: 'up', timestamp: new Date().toISOString() }
};
