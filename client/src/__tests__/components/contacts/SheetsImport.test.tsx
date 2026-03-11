import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SheetsImport } from '../../../components/contacts/SheetsImport';
import * as apiClient from '../../../lib/apiClient';

// Mock apiClient
vi.mock('../../../lib/apiClient', () => ({
  apiPost: vi.fn(),
}));

// Mock useToast
vi.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ 
    defaultOptions: { queries: { retry: false } }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('SheetsImport', () => {
  const mockOnImportComplete = vi.fn();
  const workspaceId = 'test-workspace-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render import button', () => {
    render(
      <SheetsImport workspaceId={workspaceId} onImportComplete={mockOnImportComplete} />,
      { wrapper: createWrapper() }
    );
    
    expect(screen.getByText('Импорт из Google Sheets')).toBeInTheDocument();
  });

  it('should open dialog when button clicked', async () => {
    render(
      <SheetsImport workspaceId={workspaceId} onImportComplete={mockOnImportComplete} />,
      { wrapper: createWrapper() }
    );
    
    const button = screen.getByText('Импорт из Google Sheets');
    fireEvent.click(button);
    
    expect(screen.getByPlaceholderText(/docs.google.com/)).toBeInTheDocument();
  });

  it('should call preview API with valid URL', async () => {
    const mockApiPost = vi.mocked(apiClient.apiPost);
    mockApiPost.mockResolvedValueOnce({
      preview: [{ Email: 'test@example.com', Name: 'Test' }],
      totalRows: 1,
      headers: ['Email', 'Name'],
      detectedMapping: { email: 'Email', name: 'Name' },
    });

    render(
      <SheetsImport workspaceId={workspaceId} onImportComplete={mockOnImportComplete} />,
      { wrapper: createWrapper() }
    );
    
    const button = screen.getByText('Импорт из Google Sheets');
    fireEvent.click(button);
    
    const input = screen.getByPlaceholderText(/docs.google.com/);
    fireEvent.change(input, { 
      target: { value: 'https://docs.google.com/spreadsheets/d/test123/edit' } 
    });
    
    const previewButton = screen.getByText('Предпросмотр');
    fireEvent.click(previewButton);
    
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/api/contacts/import-sheets/preview',
        expect.objectContaining({
          workspace_id: workspaceId,
          sheet_url: 'https://docs.google.com/spreadsheets/d/test123/edit',
        })
      );
    });
  });
});
