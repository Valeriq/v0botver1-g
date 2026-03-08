import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppLayout } from '../../../components/layout/AppLayout';

vi.mock('../../../stores', () => ({
  useUIStore: () => ({
    sidebarOpen: true,
    toggleSidebar: vi.fn(),
  }),
}));

vi.mock('../../../components/layout/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../../../components/layout/Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

describe('AppLayout', () => {
  it('should render children', () => {
    render(
      <AppLayout>
        <div>Test Content</div>
      </AppLayout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have sidebar', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should have header', () => {
    render(<AppLayout><div>Content</div></AppLayout>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
