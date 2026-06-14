import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: null, error: null })),
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
      channel: vi.fn(() => ({
        on: vi.fn(() => ({
          subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
        })),
      })),
      removeChannel: vi.fn(),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_CHAT_GROUPS: 'operation_chat_groups',
    OPERATION_CHAT_MEMBERS: 'operation_chat_members',
    OPERATION_CHAT_MESSAGES: 'operation_chat_messages',
    USERS: 'users',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockChatGroups: [],
  mockChatMessages: {},
}));

describe('ChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the group list title', async () => {
    const ChatPage = (await import('../ChatPage')).default;
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Danh sách nhóm')).toBeInTheDocument();
  });

  it('shows empty group state', async () => {
    const ChatPage = (await import('../ChatPage')).default;
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    const emptyText = await screen.findByText('Chưa có nhóm nào.');
    expect(emptyText).toBeInTheDocument();
  });

  it('renders the message input placeholder', async () => {
    const ChatPage = (await import('../ChatPage')).default;
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Nhập tin nhắn...')).toBeInTheDocument();
  });
});
