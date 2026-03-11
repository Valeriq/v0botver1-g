---
phase: 02b-google-sheets-import
plan: 02
type: execute
wave: 2
depends_on: [02b-01]
files_modified:
  - client/src/components/contacts/SheetsImport.tsx
  - client/src/components/contacts/ColumnMappingDialog.tsx
  - client/src/pages/Contacts.tsx
  - client/src/lib/queryKeys.ts
  - client/src/lib/apiClient.ts
  - client/src/__tests__/components/contacts/SheetsImport.test.tsx
autonomous: true
requirements: [GS-IMPORT-05, GS-IMPORT-06, GS-IMPORT-07]
must_haves:
  truths:
    - "Пользователь видит поле для ввода ссылки на Google Sheets"
    - "Пользователь видит предпросмотр данных перед импортом"
    - "Пользователь может изменить маппинг колонок"
    - "После импорта список контактов обновляется"
  artifacts:
    - path: "client/src/components/contacts/SheetsImport.tsx"
      provides: "Google Sheets import UI"
      exports: ["SheetsImport"]
    - path: "client/src/components/contacts/ColumnMappingDialog.tsx"
      provides: "Column mapping editor"
      exports: ["ColumnMappingDialog"]
    - path: "client/src/pages/Contacts.tsx"
      provides: "Updated contacts page with import button"
      contains: "SheetsImport"
  key_links:
    - from: "client/src/components/contacts/SheetsImport.tsx"
      to: "/api/contacts/import-sheets/preview"
      via: "POST fetch"
      pattern: "import-sheets"
    - from: "client/src/pages/Contacts.tsx"
      to: "SheetsImport component"
      via: "import and render"
---

<objective>
Создать frontend для импорта контактов из Google Sheets.

Purpose: Предоставить пользователю удобный UI для импорта контактов без работы с CSV файлами.
Output: Компоненты для ввода URL, предпросмотра и маппинга колонок.

**UX Flow:**
1. Пользователь нажимает "Импорт из Google Sheets"
2. Вставляет URL в модальное окно
3. Видит предпросмотр первых 10 строк
4. Подтверждает или изменяет маппинг колонок
5. Нажимает "Импортировать"
6. Видит результат (сколько импортировано/пропущено)
</objective>

<execution_context>
@C:/Users/HP i5 1135/.config/opencode/get-shit-done/workflows/execute-plan.md
@C:/Users/HP i5 1135/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/01-foundation/01-01-SUMMARY.md

<!-- Existing patterns -->
@client/src/pages/Contacts.tsx
@client/src/components/contacts/CSVUpload.tsx
@client/src/lib/apiClient.ts
@client/src/lib/queryKeys.ts
</context>

<interfaces>
<!-- Key types from existing code -->

From client/src/lib/apiClient.ts:
```typescript
export async function apiPost<T>(path: string, body: unknown): Promise<T>
```

From client/src/lib/queryKeys.ts:
```typescript
contacts: {
  list: (filters: Record<string, unknown>) => [...queryKeys.contacts.lists(), { filters }] as const,
}
```

From client/src/pages/Contacts.tsx:
```typescript
// Existing CSV upload pattern
const handleUpload = async (file: File) => {
  const response = await fetch('/api/contacts/upload', { ... })
  queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list(...) })
  toast({ title: 'Файл загружен', description: `...` })
}
```

<!-- New types for this feature -->

Backend response types:
```typescript
interface PreviewResponse {
  preview: Record<string, string>[]
  totalRows: number
  headers: string[]
  detectedMapping: {
    email?: string
    name?: string
    company?: string
    position?: string
  }
}

interface ImportResponse {
  success: boolean
  contact_list_id: string
  imported: number
  skipped: number
  errors: string[]
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Создать компонент SheetsImport</name>
  <files>client/src/components/contacts/SheetsImport.tsx</files>
  <action>
    Создать компонент для импорта из Google Sheets:
    
    ```tsx
    import { useState } from 'react';
    import { Link2, Loader2 } from 'lucide-react';
    import { Button } from '../ui/button';
    import { Input } from '../ui/input';
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
    } from '../ui/dialog';
    import { apiPost } from '@/lib/apiClient';
    import { useToast } from '@/hooks/use-toast';
    import { ColumnMappingDialog } from './ColumnMappingDialog';
    
    interface PreviewData {
      preview: Record<string, string>[];
      totalRows: number;
      headers: string[];
      detectedMapping: {
        email?: string;
        name?: string;
        company?: string;
        position?: string;
      };
    }
    
    interface SheetsImportProps {
      workspaceId: string;
      onImportComplete: () => void;
    }
    
    export function SheetsImport({ workspaceId, onImportComplete }: SheetsImportProps) {
      const [open, setOpen] = useState(false);
      const [url, setUrl] = useState('');
      const [loading, setLoading] = useState(false);
      const [previewData, setPreviewData] = useState<PreviewData | null>(null);
      const [step, setStep] = useState<'url' | 'preview' | 'importing'>('url');
      const { toast } = useToast();
    
      const handlePreview = async () => {
        if (!url.includes('docs.google.com/spreadsheets')) {
          toast({
            title: 'Неверный URL',
            description: 'Введите ссылку на Google Sheets',
            variant: 'destructive',
          });
          return;
        }
    
        setLoading(true);
        try {
          const data = await apiPost<PreviewData>('/api/contacts/import-sheets/preview', {
            workspace_id: workspaceId,
            sheet_url: url,
          });
          setPreviewData(data);
          setStep('preview');
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: error instanceof Error ? error.message : 'Не удалось загрузить таблицу',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      };
    
      const handleImport = async (columnMapping?: Record<string, string>) => {
        if (!previewData) return;
    
        setStep('importing');
        try {
          const result = await apiPost<{ imported: number; skipped: number; errors: string[] }>(
            '/api/contacts/import-sheets',
            {
              workspace_id: workspaceId,
              sheet_url: url,
              column_mapping: columnMapping || previewData.detectedMapping,
            }
          );
    
          toast({
            title: 'Импорт завершён',
            description: `Импортировано: ${result.imported}, пропущено: ${result.skipped}`,
          });
    
          setOpen(false);
          setUrl('');
          setPreviewData(null);
          setStep('url');
          onImportComplete();
        } catch (error) {
          toast({
            title: 'Ошибка импорта',
            description: error instanceof Error ? error.message : 'Неизвестная ошибка',
            variant: 'destructive',
          });
          setStep('preview');
        }
      };
    
      const handleBack = () => {
        setStep('url');
        setPreviewData(null);
      };
    
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4 mr-2" />
              Импорт из Google Sheets
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {step === 'url' && 'Импорт из Google Sheets'}
                {step === 'preview' && 'Предпросмотр данных'}
                {step === 'importing' && 'Импорт...'}
              </DialogTitle>
              <DialogDescription>
                {step === 'url' && 'Вставьте публичную ссылку на Google Sheets'}
                {step === 'preview' && `Найдено ${previewData?.totalRows} строк`}
              </DialogDescription>
            </DialogHeader>
    
            {step === 'url' && (
              <div className="space-y-4">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Убедитесь, что таблица доступна по ссылке ("Anyone with the link can view")
                </p>
                <Button onClick={handlePreview} disabled={loading || !url}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Загрузка...
                    </>
                  ) : (
                    'Предпросмотр'
                  )}
                </Button>
              </div>
            )}
    
            {step === 'preview' && previewData && (
              <ColumnMappingDialog
                previewData={previewData}
                onImport={handleImport}
                onBack={handleBack}
              />
            )}
    
            {step === 'importing' && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Импорт контактов...</span>
              </div>
            )}
          </DialogContent>
        </Dialog>
      );
    }
    ```
  </action>
  <verify>
    <automated>cd client && pnpm exec tsc --noEmit --skipLibCheck 2>&1 | grep -c "SheetsImport" || echo "Type check passed"</automated>
  </verify>
  <done>
    - Компонент SheetsImport.tsx создан
    - Содержит 3 шага: URL -> Preview -> Import
    - Интегрирован с toast уведомлениями
  </done>
</task>

<task type="auto">
  <name>Task 2: Создать компонент ColumnMappingDialog</name>
  <files>client/src/components/contacts/ColumnMappingDialog.tsx</files>
  <action>
    Создать компонент для предпросмотра и маппинга колонок:
    
    ```tsx
    import { useState } from 'react';
    import { ArrowLeft, ArrowRight } from 'lucide-react';
    import { Button } from '../ui/button';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
    import { Badge } from '../ui/badge';
    
    interface PreviewData {
      preview: Record<string, string>[];
      totalRows: number;
      headers: string[];
      detectedMapping: {
        email?: string;
        name?: string;
        company?: string;
        position?: string;
      };
    }
    
    interface ColumnMappingDialogProps {
      previewData: PreviewData;
      onImport: (mapping?: Record<string, string>) => Promise<void>;
      onBack: () => void;
    }
    
    const REQUIRED_FIELDS = ['email'] as const;
    const OPTIONAL_FIELDS = ['name', 'company', 'position'] as const;
    
    export function ColumnMappingDialog({ previewData, onImport, onBack }: ColumnMappingDialogProps) {
      const [mapping, setMapping] = useState<Record<string, string>>({
        email: previewData.detectedMapping.email || '',
        name: previewData.detectedMapping.name || '',
        company: previewData.detectedMapping.company || '',
        position: previewData.detectedMapping.position || '',
      });
    
      const handleMappingChange = (field: string, value: string) => {
        setMapping((prev) => ({ ...prev, [field]: value }));
      };
    
      const handleImport = () => {
        onImport(mapping);
      };
    
      const isValid = mapping.email && mapping.email !== '';
    
      return (
        <div className="space-y-4">
          {/* Column Mapping */}
          <div className="space-y-3">
            <h4 className="font-medium">Маппинг колонок</h4>
            <div className="grid grid-cols-2 gap-3">
              {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <label className="w-24 text-sm capitalize">
                    {field === 'email' && (
                      <Badge variant="destructive" className="mr-1">
                        *
                      </Badge>
                    )}
                    {field === 'email' && 'Email'}
                    {field === 'name' && 'Имя'}
                    {field === 'company' && 'Компания'}
                    {field === 'position' && 'Должность'}
                  </label>
                  <Select
                    value={mapping[field] || undefined}
                    onValueChange={(value) => handleMappingChange(field, value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Выберите колонку" />
                    </SelectTrigger>
                    <SelectContent>
                      {previewData.headers.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
    
          {/* Preview Table */}
          <div className="border rounded-md max-h-60 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {previewData.headers.map((header) => (
                    <TableHead
                      key={header}
                      className={
                        Object.values(mapping).includes(header)
                          ? 'bg-primary/10 font-medium'
                          : ''
                      }
                    >
                      {header}
                      {mapping.email === header && (
                        <Badge variant="default" className="ml-2 text-xs">
                          Email
                        </Badge>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.preview.map((row, i) => (
                  <TableRow key={i}>
                    {previewData.headers.map((header) => (
                      <TableCell key={header} className="text-sm">
                        {row[header]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
    
          <p className="text-sm text-muted-foreground">
            Показаны первые 10 из {previewData.totalRows} строк
          </p>
    
          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
            <Button onClick={handleImport} disabled={!isValid}>
              Импортировать
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      );
    }
    ```
  </action>
  <verify>
    <automated>cd client && pnpm exec tsc --noEmit --skipLibCheck 2>&1 | grep -c "ColumnMappingDialog" || echo "Type check passed"</automated>
  </verify>
  <done>
    - Компонент ColumnMappingDialog.tsx создан
    - Показывает предпросмотр таблицы
    - Позволяет изменить маппинг колонок
    - Валидирует обязательное поле email
  </done>
</task>

<task type="auto">
  <name>Task 3: Интегрировать SheetsImport в страницу Contacts</name>
  <files>client/src/pages/Contacts.tsx</files>
  <action>
    Обновить страницу Contacts для добавления кнопки импорта из Google Sheets:
    
    1. Импортировать SheetsImport компонент
    2. Добавить его в actions PageHeader рядом с CSVUpload
    3. Передать workspaceId (временно захардкодить или использовать store)
    4. Добавить колбэк для обновления списка после импорта
    
    ```tsx
    // В начале файла добавить импорт
    import { SheetsImport } from '../components/contacts/SheetsImport';
    
    // В компоненте, заменить секцию PageHeader:
    <PageHeader 
      title="Контакты" 
      description="Управляйте списком контактов для email-рассылок."
      actions={
        <div className="flex gap-2">
          <SheetsImport 
            workspaceId="00000000-0000-0000-0000-000000000000" // TODO: из контекста
            onImportComplete={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.contacts.list({ page, search, status }) });
            }}
          />
          <CSVUpload onUpload={handleUpload} />
        </div>
      }
    />
    ```
  </action>
  <verify>
    <automated>cd client && pnpm exec tsc --noEmit --skipLibCheck 2>&1 | head -20 || echo "Type check passed"</automated>
  </verify>
  <done>
    - Кнопка "Импорт из Google Sheets" отображается на странице контактов
    - После успешного импорта список обновляется
    - Компоненты работают вместе без конфликтов
  </done>
</task>

<task type="auto">
  <name>Task 4: Добавить тесты для компонентов</name>
  <files>client/src/__tests__/components/contacts/SheetsImport.test.tsx</files>
  <action>
    Создать тесты для SheetsImport компонента:
    
    ```tsx
    import { render, screen, fireEvent, waitFor } from '@testing-library/react';
    import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
    import { SheetsImport } from '@/components/contacts/SheetsImport';
    import * as apiClient from '@/lib/apiClient';
    
    // Мокаем apiPost
    jest.mock('@/lib/apiClient');
    const mockedApiPost = apiClient.apiPost as jest.MockedFunction<typeof apiClient.apiPost>;
    
    // Мокаем toast
    jest.mock('@/hooks/use-toast', () => ({
      useToast: () => ({ toast: jest.fn() }),
    }));
    
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    
    describe('SheetsImport', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });
    
      it('renders import button', () => {
        render(<SheetsImport workspaceId="test-ws" onImportComplete={jest.fn()} />, { wrapper });
        expect(screen.getByText('Импорт из Google Sheets')).toBeInTheDocument();
      });
    
      it('shows error for invalid URL', async () => {
        render(<SheetsImport workspaceId="test-ws" onImportComplete={jest.fn()} />, { wrapper });
        
        const button = screen.getByText('Импорт из Google Sheets');
        fireEvent.click(button);
        
        const input = screen.getByPlaceholderText(/docs.google.com/);
        fireEvent.change(input, { target: { value: 'https://invalid-url.com' } });
        
        const previewButton = screen.getByText('Предпросмотр');
        fireEvent.click(previewButton);
        
        // Должен показать toast с ошибкой
        await waitFor(() => {
          expect(mockedApiPost).not.toHaveBeenCalled();
        });
      });
    
      it('shows preview after successful fetch', async () => {
        mockedApiPost.mockResolvedValueOnce({
          preview: [{ email: 'test@example.com' }],
          totalRows: 1,
          headers: ['email'],
          detectedMapping: { email: 'email' },
        });
    
        render(<SheetsImport workspaceId="test-ws" onImportComplete={jest.fn()} />, { wrapper });
        
        const button = screen.getByText('Импорт из Google Sheets');
        fireEvent.click(button);
        
        const input = screen.getByPlaceholderText(/docs.google.com/);
        fireEvent.change(input, { target: { value: 'https://docs.google.com/spreadsheets/d/test' } });
        
        const previewButton = screen.getByText('Предпросмотр');
        fireEvent.click(previewButton);
        
        await waitFor(() => {
          expect(screen.getByText('Предпросмотр данных')).toBeInTheDocument();
        });
      });
    });
    ```
    
    Также создать базовый тест для ColumnMappingDialog.
  </action>
  <verify>
    <automated>cd client && pnpm test -- --testPathPattern=SheetsImport --passWithNoTests</automated>
  </verify>
  <done>
    - Тесты для SheetsImport проходят
    - Тесты покрывают основные сценарии (валидный/невалидный URL)
    - Тесты мокают API вызовы
  </done>
</task>

</tasks>

<verification>
1. Запустить dev сервер: `cd client && pnpm dev`
2. Открыть страницу /contacts
3. Нажать "Импорт из Google Sheets"
4. Вставить валидный URL Google Sheets
5. Проверить предпросмотр и маппинг
6. Выполнить импорт
7. Проверить обновление списка контактов
</verification>

<success_criteria>
1. Кнопка "Импорт из Google Sheets" отображается на странице контактов
2. Модальное окно принимает URL Google Sheets
3. Предпросмотр показывает первые 10 строк
4. Маппинг колонок можно изменить
5. Импорт создаёт контакты в БД
6. Список контактов обновляется после импорта
7. Toast уведомления показываются при успехе/ошибке
8. Тесты проходят
</success_criteria>

<output>
После завершения создать `.planning/phases/02b-google-sheets-import/02b-02-SUMMARY.md`
</output>
