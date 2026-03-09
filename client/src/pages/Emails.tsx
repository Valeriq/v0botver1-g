import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, Search, Mail } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
import { apiGet } from '../lib/apiClient';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { EmailFilters } from '../components/emails/EmailFilters';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

interface Email {
  id: string;
  contactId: string;
  contactEmail: string;
  subject: string;
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  sentAt: string;
  direction: 'outbound' | 'inbound';
}

interface EmailsResponse {
  emails: Email[];
  total: number;
  page: number;
  pageSize: number;
}

const statusColors: Record<Email['status'], string> = {
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  opened: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-purple-100 text-purple-800',
  bounced: 'bg-red-100 text-red-800',
};

const statusLabels: Record<Email['status'], string> = {
  sent: 'Отправлено',
  delivered: 'Доставлено',
  opened: 'Открыто',
  replied: 'Ответ',
  bounced: 'Ошибка',
};

export function Emails() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const pageSize = 25;

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.emails.list({ page, search, status, dateFrom, dateTo }),
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      return apiGet<EmailsResponse>(`/api/emails?${params}`);
    },
  });

  const columns: ColumnDef<Email>[] = [
    {
      accessorKey: 'contactEmail',
      header: 'Получатель',
      cell: ({ row }) => (
        <Link 
          href={`/thread/${row.original.contactId}`}
          className="text-blue-600 hover:underline"
        >
          {row.original.contactEmail}
        </Link>
      ),
    },
    {
      accessorKey: 'subject',
      header: 'Тема',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.direction === 'inbound' && (
            <Mail className="h-4 w-4 text-blue-500" />
          )}
          <span className="truncate max-w-md">{row.original.subject}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <Badge className={statusColors[row.original.status]}>
          {statusLabels[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: 'sentAt',
      header: 'Дата',
      cell: ({ row }) => new Date(row.original.sentAt).toLocaleDateString('ru-RU'),
    },
  ];

  const table = useReactTable({
    data: data?.emails ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <AppLayout>
      <PageHeader 
        title="Письма" 
        description="История всех отправленных и полученных писем."
      />
      <div className="space-y-6">

      <div className="flex justify-between items-center">
        <EmailFilters
          status={status}
          onStatusChange={setStatus}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
        />
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по email..."
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
                    <TableRow 
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
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
                      Нет писем
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
                disabled={!data || data.emails.length < pageSize}
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
