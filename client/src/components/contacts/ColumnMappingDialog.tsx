import { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

export interface PreviewData {
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

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  name: 'Имя',
  company: 'Компания',
  position: 'Должность',
};

export function ColumnMappingDialog({ previewData, onImport, onBack }: ColumnMappingDialogProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({
    email: previewData.detectedMapping.email || '',
    name: previewData.detectedMapping.name || '',
    company: previewData.detectedMapping.company || '',
    position: previewData.detectedMapping.position || '',
  });
  const [isImporting, setIsImporting] = useState(false);

  const handleMappingChange = (field: string, value: string) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      await onImport(mapping);
    } finally {
      setIsImporting(false);
    }
  };

  const isValid = mapping.email && mapping.email !== '';

  // Get which columns are mapped
  const mappedColumns = new Set(Object.values(mapping).filter(Boolean));

  return (
    <div className="space-y-4">
      {/* Column Mapping */}
      <div className="space-y-3">
        <h4 className="font-medium">Маппинг колонок</h4>
        <div className="grid grid-cols-2 gap-3">
          {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => (
            <div key={field} className="flex items-center gap-2">
              <label className="w-24 text-sm flex items-center">
                {field === 'email' && (
                  <Badge variant="destructive" className="mr-1 text-xs">
                    *
                  </Badge>
                )}
                {FIELD_LABELS[field] || field}
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
                    mappedColumns.has(header) ? 'bg-primary/10 font-medium' : ''
                  }
                >
                  {header}
                  {mapping.email === header && (
                    <Badge variant="default" className="ml-2 text-xs">
                      Email
                    </Badge>
                  )}
                  {mapping.name === header && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Имя
                    </Badge>
                  )}
                  {mapping.company === header && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Компания
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
                    {row[header] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Показаны первые {previewData.preview.length} из {previewData.totalRows} строк
      </p>

      {/* Actions */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isImporting}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>
        <Button onClick={handleImport} disabled={!isValid || isImporting}>
          {isImporting ? (
            <>
              <span className="h-4 w-4 mr-2 animate-spin">⏳</span>
              Импорт...
            </>
          ) : (
            <>
              Импортировать
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
