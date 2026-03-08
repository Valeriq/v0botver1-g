import { Button } from '../ui/button';
import { Input } from '../ui/input';

const statuses = [
  { value: 'all', label: 'Все' },
  { value: 'sent', label: 'Отправлено' },
  { value: 'delivered', label: 'Доставлено' },
  { value: 'opened', label: 'Открыто' },
  { value: 'replied', label: 'Ответ' },
  { value: 'bounced', label: 'Ошибка' },
] as const;

interface EmailFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  dateFrom: string;
  onDateFromChange: (date: string) => void;
  dateTo: string;
  onDateToChange: (date: string) => void;
}

export function EmailFilters({ 
  status, 
  onStatusChange, 
  dateFrom, 
  onDateFromChange,
  dateTo,
  onDateToChange 
}: EmailFiltersProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex gap-2">
        {statuses.map((s) => (
          <Button
            key={s.value}
            variant={status === s.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusChange(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
      
      <div className="flex gap-2 items-center ml-4">
        <span className="text-sm text-muted-foreground">С:</span>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="w-36"
        />
        <span className="text-sm text-muted-foreground">По:</span>
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          className="w-36"
        />
      </div>
    </div>
  );
}
