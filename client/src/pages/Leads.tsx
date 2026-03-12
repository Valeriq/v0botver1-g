import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useLeads } from "@/hooks/use-resources";
import { Badge } from "@/components/ui/badge";
import { Inbox, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  new: "Новый",
  contacted: "Связались",
  qualified: "Квалифицирован",
  converted: "Конвертирован",
};

const classificationLabels: Record<string, string> = {
  interested: "Заинтересован",
  not_interested: "Не заинтересован",
  meeting_request: "Запрос встречи",
  question: "Вопрос",
  out_of_office: "Не в офисе",
  unsubscribe: "Отписка",
};

export default function Leads() {
  const { data: leads, isLoading } = useLeads();

  return (
    <AppLayout>
      <PageHeader
        title="Лиды"
        description="Отслеживайте ответы и заинтересованных клиентов."
      />

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Статус</TableHead>
              <TableHead>Классификация</TableHead>
              <TableHead>Получено</TableHead>
              <TableHead>Gmail Переписка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  Загрузка лидов...
                </TableCell>
              </TableRow>
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">Лидов пока нет</p>
                    <p className="text-sm text-muted-foreground">
                      Ответы, классифицированные как лиды, появятся здесь.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Badge variant={lead.status === 'new' ? 'default' : 'secondary'}>
                      {statusLabels[lead.status] || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {'Не классифицирован'}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.createdAt ? formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ru }) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-primary text-sm">
                      Нет переписки
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
}
