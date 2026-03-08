import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SampleTable } from '../../../components/ui/SampleTable';

describe('SampleTable', () => {
  it('should render table', () => {
    render(<SampleTable />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('should have 3 column headers', () => {
    render(<SampleTable />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should display 5 rows of mock data', () => {
    render(<SampleTable />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
    expect(screen.getByText('Charlie Davis')).toBeInTheDocument();
  });
});
