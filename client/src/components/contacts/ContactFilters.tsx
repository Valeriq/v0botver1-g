import { Button } from '../ui/button';

const statuses = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'unsubscribed', label: 'Отписались' },
] as const;

interface ContactFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
}

export function ContactFilters({ status, onStatusChange }: ContactFiltersProps) {
  return (
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
  );
}
