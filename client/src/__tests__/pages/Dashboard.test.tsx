import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../../pages/Dashboard';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: null,
    isLoading: true,
  }),
}));

describe('Dashboard', () => {
  it('should render dashboard title', () => {
    render(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('should render 4 KPI cards', () => {
    render(<Dashboard />);
    expect(screen.getByText('Отправлено')).toBeInTheDocument();
    expect(screen.getByText('Открыто')).toBeInTheDocument();
    expect(screen.getByText('Ответов')).toBeInTheDocument();
    expect(screen.getByText('Лидов')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<Dashboard />);
    // 4 KPI cards show '...' when loading
    const loadingElements = screen.getAllByText('...');
    expect(loadingElements.length).toBe(4);
  });
});
