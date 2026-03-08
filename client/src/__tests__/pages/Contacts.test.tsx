import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Contacts } from '../../pages/Contacts';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      contacts: [
        { id: '1', email: 'test@example.com', firstName: 'Test', lastName: 'User', company: 'Test Co', status: 'active' },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    },
    isLoading: false,
  }),
}));

describe('Contacts', () => {
  it('should render contacts title', () => {
    render(<Contacts />);
    expect(screen.getByText('Контакты')).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<Contacts />);
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument();
  });

  it('should render contacts table', () => {
    render(<Contacts />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
