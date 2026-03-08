import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '../../../components/layout/Header';

vi.mock('../../../stores', () => ({
  useUIStore: () => ({
    toggleSidebar: vi.fn(),
  }),
}));

describe('Header', () => {
  it('should render header', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should have menu button', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });

  it('should have title ColdBot', () => {
    render(<Header />);
    expect(screen.getByText('ColdBot')).toBeInTheDocument();
  });
});
