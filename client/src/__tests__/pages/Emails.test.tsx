import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Emails } from '../../pages/Emails';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: {
      emails: [
        { id: '1', contactId: 'c1', contactEmail: 'test@example.com', subject: 'Test Subject', status: 'sent', sentAt: '2026-03-08T10:00:00Z', direction: 'outbound' },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    },
    isLoading: false,
  }),
}));

describe('Emails', () => {
  it('renders title', () => {
    render(<Emails />);
    expect(screen.getByText('Письма')).toBeInTheDocument();
  });
});
