import { useQuery } from '@tanstack/react-query';
import { Mail, MailOpen, Reply, Users } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
import { apiGet } from '../lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';

interface DashboardStats {
  sent: number;
  opened: number;
  replied: number;
  leads: number;
}

interface RecentEmail {
  id: string;
  to: string;
  subject: string;
  status: string;
  sentAt: string;
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.dashboard.stats('default'),
    queryFn: () => apiGet<DashboardStats>('/api/dashboard/stats'),
  });

  const { data: recentEmails, isLoading: emailsLoading } = useQuery({
    queryKey: ['recent-emails'],
    queryFn: () => apiGet<RecentEmail[]>('/api/emails/recent'),
  });

  const kpiCards = [
    { title: 'Отправлено', value: stats?.sent ?? 0, icon: Mail, color: 'text-blue-500' },
    { title: 'Открыто', value: stats?.opened ?? 0, icon: MailOpen, color: 'text-green-500' },
    { title: 'Ответов', value: stats?.replied ?? 0, icon: Reply, color: 'text-purple-500' },
    { title: 'Лидов', value: stats?.leads ?? 0, icon: Users, color: 'text-orange-500' },
  ];

  return (
    <AppLayout>
      <PageHeader 
        title="Dashboard" 
        description="Обзор вашей email-активности и ключевые метрики."
      />
      <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? '...' : card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Emails */}
      <Card>
        <CardHeader>
          <CardTitle>Последние письма</CardTitle>
        </CardHeader>
        <CardContent>
          {emailsLoading ? (
            <p className="text-muted-foreground">Загрузка...</p>
          ) : recentEmails && recentEmails.length > 0 ? (
            <div className="space-y-2">
              {recentEmails.slice(0, 5).map((email) => (
                <div key={email.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{email.to}</p>
                    <p className="text-sm text-muted-foreground">{email.subject}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-muted">{email.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Нет писем</p>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
