import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactFilters } from '../../../components/contacts/ContactFilters';

describe('ContactFilters', () => {
  it('should render all filter buttons', () => {
    const onStatusChange = vi.fn();
    render(<ContactFilters status="all" onStatusChange={onStatusChange} />);
    
    expect(screen.getByText('Все')).toBeInTheDocument();
    expect(screen.getByText('Активные')).toBeInTheDocument();
    expect(screen.getByText('Bounced')).toBeInTheDocument();
    expect(screen.getByText('Отписались')).toBeInTheDocument();
  });

  it('should call onStatusChange when clicked', () => {
    const onStatusChange = vi.fn();
    render(<ContactFilters status="all" onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByText('Активные'));
    expect(onStatusChange).toHaveBeenCalledWith('active');
  });

  it('should highlight active filter', () => {
    render(<ContactFilters status="active" onStatusChange={vi.fn()} />);
    const activeButton = screen.getByText('Активные');
    expect(activeButton).toBeInTheDocument();
  });
});
