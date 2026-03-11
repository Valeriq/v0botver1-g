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
import { ColumnMappingDialog, type PreviewData } from './ColumnMappingDialog';

interface ImportResponse {
  success: boolean;
  contact_list_id: string;
  imported: number;
  skipped: number;
  errors: string[];
}

interface SheetsImportProps {
  workspaceId: string;
  onImportComplete: () => void;
}

type Step = 'url' | 'preview' | 'importing';

export function SheetsImport({ workspaceId, onImportComplete }: SheetsImportProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [step, setStep] = useState<Step>('url');
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
      const message = error instanceof Error ? error.message : 'Не удалось загрузить таблицу';
      toast({
        title: 'Ошибка',
        description: message,
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
      const result = await apiPost<ImportResponse>('/api/contacts/import-sheets', {
        workspace_id: workspaceId,
        sheet_url: url,
        column_mapping: columnMapping,
      });

      toast({
        title: 'Импорт завершён',
        description: `Импортировано: ${result.imported}, пропущено: ${result.skipped}`,
      });

      // Reset and close
      setOpen(false);
      resetState();
      onImportComplete();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка импорта',
        description: message,
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const handleBack = () => {
    setStep('url');
    setPreviewData(null);
  };

  const resetState = () => {
    setUrl('');
    setPreviewData(null);
    setStep('url');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {step === 'preview' && previewData && `Найдено ${previewData.totalRows} строк`}
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">Импорт контактов...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
