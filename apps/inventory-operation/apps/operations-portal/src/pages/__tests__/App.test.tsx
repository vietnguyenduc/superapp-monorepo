import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock all page components
vi.mock('../Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('../CheckInPage', () => ({ default: () => <div>CheckIn Page</div> }));
vi.mock('../DocumentsPage', () => ({ default: () => <div>Documents Page</div> }));
vi.mock('../ChatPage', () => ({ default: () => <div>Chat Page</div> }));
vi.mock('../TicketsPage', () => ({ default: () => <div>Tickets Page</div> }));
vi.mock('../AssetsPage', () => ({ default: () => <div>Assets Page</div> }));
vi.mock('../EmergencyPage', () => ({ default: () => <div>Emergency Page</div> }));
vi.mock('../TrainingPage', () => ({ default: () => <div>Training Page</div> }));
vi.mock('../Manual/Manual', () => ({ default: () => <div>Manual Page</div> }));

// Mock Layout components
vi.mock('../../components/Layout/AppSwitcher', () => ({ default: () => <div>AppSwitcher</div> }));
vi.mock('../../components/Layout/MobileMenuDrawer', () => ({ default: () => null }));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app header with title', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Cổng Thông tin')).toBeInTheDocument();
  });

  it('renders the sidebar with navigation items', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Nghiệp vụ Vận hành')).toBeInTheDocument();
  });

  it('renders all main navigation links', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
    expect(screen.getByText('Sự cố')).toBeInTheDocument();
    expect(screen.getByText('Tài sản')).toBeInTheDocument();
    expect(screen.getByText('Đào tạo')).toBeInTheDocument();
    expect(screen.getByText('Tài liệu')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Khẩn cấp')).toBeInTheDocument();
    expect(screen.getByText('Hướng dẫn')).toBeInTheDocument();
  });

  it('renders the AppSwitcher component', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('AppSwitcher')).toBeInTheDocument();
  });

  it('renders the dashboard page by default', async () => {
    const App = (await import('../../App')).default;
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });
});
