import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search, Trash2, Loader2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

export function Contacts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [deletingAll, setDeletingAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const pageSize = 25;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.contacts.list({ page, search, status }),
    queryFn: () => apiGet<ContactsResponse>(`/api/contacts?workspace_id=${DEFAULT_WORKSPACE_ID}&page=${page}&limit=${pageSize}&search=${search}&status=${status === 'all' ? '' : status}`),
  });

  const handleDeleteContact = async (id: string) => {
    try {
      const response = await fetch(`/api/contacts/${id}?workspace_id=${DEFAULT_WORKSPACE_ID}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete contact');
      
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list });
      toast({ title: 'Контакт удалён' });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить контакт',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch(`/api/contacts/all?workspace_id=${DEFAULT_WORKSPACE_ID}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to delete all contacts');
      
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list });
      toast({ title: 'Контакты удалены', description: `Удалено ${result.contacts_deleted || 'все'} контактов` });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить контакты',
        variant: 'destructive',
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const idsToDelete = Array.from(selectedIds);
    try {
      await Promise.all(
        idsToDelete.map(id => 
          fetch(`/api/contacts/${id}?workspace_id=${DEFAULT_WORKSPACE_ID}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list });
      toast({ title: `Удалено ${idsToDelete.length} контактов` });
      setSelectedIds(new Set());
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить выбранные контакты',
        variant: 'destructive',
      });
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (!data?.contacts) return;
    if (selectedIds.size === data.contacts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.contacts.map(c => c.id)));
    }
  };

  const columns: ColumnDef<Contact>[] = [
    {
      id: 'select',
      header: () => (
        <input
          type="checkbox"
          checked={data?.contacts ? selectedIds.size === data.contacts.length && data.contacts.length > 0 : false}
          onChange={toggleSelectAll}
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.original.id)}
          onChange={() => toggleSelect(row.original.id)}
          className="h-4 w-4"
        />
      ),
      size: 40,
    },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'firstName', header: 'Имя' },
    { accessorKey: 'lastName', header: 'Фамилия' },
    { accessorKey: 'company', header: 'Компания' },
    { accessorKey: 'status', header: 'Статус' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteContact(row.original.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.contacts ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppLayout>
      <PageHeader 
        title="Контакты" 
        description="Управляйте списком контактов для email-рассылок."
        actions={
          <div className="flex gap-2">
            {data && data.total > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={deletingAll}>
                    {deletingAll ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Удаление...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Удалить все
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить все контакты?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие удалит все контакты ({data.total} шт.). Действие нельзя отменить.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Удалить все
                    </AlertDialogAction>
                  </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            )}
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить выбранные ({selectedIds.size})
              </Button>
            )}
            <SheetsImport 
              workspaceId={DEFAULT_WORKSPACE_ID} 
              onImportComplete={() => {
                queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list });
              }}
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
