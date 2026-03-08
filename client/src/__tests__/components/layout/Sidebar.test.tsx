import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../../../components/layout/Sidebar';

vi.mock('../../../stores', () => ({
  useUIStore: () => ({
    sidebarOpen: true,
  }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { firstName: 'Test', username: 'testuser' },
    logout: vi.fn(),
  }),
}));

vi.mock('wouter', () => ({
  useLocation: () => ['/'],
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Sidebar', () => {
  it('should render sidebar', () => {
    render(<Sidebar />);
    expect(screen.getByText('ColdBot.ai')).toBeInTheDocument();
  });

  it('should have navigation items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Контакты')).toBeInTheDocument();
    expect(screen.getByText('Кампании')).toBeInTheDocument();
  });

  it('should show user info', () => {
    render(<Sidebar />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
