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
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } }, error: null }),
    },
  },
  TABLES: {
    OPERATION_TRAINING_COURSES: 'operation_training_courses',
    OPERATION_TRAINING_MATERIALS: 'operation_training_materials',
    OPERATION_TRAINING_PROGRESS: 'operation_training_progress',
  },
  STORAGE: { OPERATIONS_MEDIA: 'operations_media' },
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user' }),
  getCurrentUserId: vi.fn().mockResolvedValue('test-user'),
}));

// Mock trialData
vi.mock('../../lib/trialData', () => ({
  isTrialMode: vi.fn(() => false),
  mockTrainingCourses: [],
  mockTrainingMaterials: {},
  mockTrainingProgress: [],
}));

describe('TrainingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page title', async () => {
    const TrainingPage = (await import('../TrainingPage')).default;
    render(
      <MemoryRouter>
        <TrainingPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Đào tạo & Huấn luyện')).toBeInTheDocument();
  });

  it('shows the description text', async () => {
    const TrainingPage = (await import('../TrainingPage')).default;
    render(
      <MemoryRouter>
        <TrainingPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Chọn một khóa học/)).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    const TrainingPage = (await import('../TrainingPage')).default;
    render(
      <MemoryRouter>
        <TrainingPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Đang tải khóa học...')).toBeInTheDocument();
  });

  it('shows empty state when no courses', async () => {
    const TrainingPage = (await import('../TrainingPage')).default;
    render(
      <MemoryRouter>
        <TrainingPage />
      </MemoryRouter>
    );
    const emptyText = await screen.findByText('Chưa có khóa học nào được tạo.');
    expect(emptyText).toBeInTheDocument();
  });
});
