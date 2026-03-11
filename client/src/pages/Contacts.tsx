import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
import { apiGet } from '../lib/apiClient';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ContactFilters } from '../components/contacts/ContactFilters';
import { SheetsImport } from '../components/contacts/SheetsImport';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { useToast } from '@/hooks/use-toast';

// TODO: Get workspace ID from auth context
const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

interface Contact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  status: string;
}

interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export function Contacts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const pageSize = 25;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.contacts.list({ page, search, status }),
    queryFn: () => apiGet<ContactsResponse>(`/api/contacts?page=${page}&limit=${pageSize}&search=${search}&status=${status === 'all' ? '' : status}`),
  });

  const columns: ColumnDef<Contact>[] = [
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'firstName', header: 'Имя' },
    { accessorKey: 'lastName', header: 'Фамилия' },
    { accessorKey: 'company', header: 'Компания' },
    { accessorKey: 'status', header: 'Статус' },
  ];

  const table = useReactTable({
    data: data?.contacts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleUpload = async (file: File) => {
    try {
      // Читаем файл как текст
      const fileContent = await file.text();
      
      // Отправляем JSON на backend
      const response = await fetch('/api/contacts/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: '00000000-0000-0000-0000-000000000000', // TODO: получить из контекста
          file_content: fileContent,
          filename: file.name,
          delimiter: ',',
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      const result = await response.json();
      
      // Обновляем список контактов
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list({ page, search, status }) });
      
      // Показываем уведомление
      toast({
        title: 'Файл загружен',
        description: `Добавлено: ${result.uploaded}, пропущено: ${result.skipped}`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list({ page, search, status }) });
  };

  return (
    <AppLayout>
      <PageHeader 
        title="Контакты" 
        description="Управляйте списком контактов для email-рассылок."
        actions={
          <div className="flex gap-2">
            <SheetsImport 
              workspaceId={DEFAULT_WORKSPACE_ID}
              onImportComplete={handleImportComplete}
            />
          </div>
        }
      />
      <div className="space-y-6">

      <div className="flex justify-between items-center">
        <ContactFilters status={status} onStatusChange={setStatus} />
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                      Нет контактов
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {data ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, data.total)} из ${data.total}` : '0'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!data || data.contacts.length < pageSize}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
      </div>
    </AppLayout>
  );
}
