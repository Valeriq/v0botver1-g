import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { ArrowLeft, Mail, MailOpen, User, Bot, CheckCircle, XCircle, Clock } from 'lucide-react';
import { queryKeys } from '../lib/queryKeys';
import { apiGet } from '../lib/apiClient';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface ThreadEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  direction: 'outbound' | 'inbound';
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  isAIGenerated?: boolean;
}

interface ThreadInfo {
  contactId: string;
  contactEmail: string;
  contactName: string;
  leadStatus?: 'new' | 'taken' | 'replied' | 'closed';
  emails: ThreadEmail[];
}

const statusIcons = {
  sent: <Clock className="h-4 w-4 text-blue-500" />,
  delivered: <CheckCircle className="h-4 w-4 text-green-500" />,
  opened: <MailOpen className="h-4 w-4 text-yellow-500" />,
  replied: <Mail className="h-4 w-4 text-purple-500" />,
  bounced: <XCircle className="h-4 w-4 text-red-500" />,
};

const leadStatusColors = {
  new: 'bg-green-100 text-green-800',
  taken: 'bg-blue-100 text-blue-800',
  replied: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
};

const leadStatusLabels = {
  new: 'Новый Lead',
  taken: 'В работе',
  replied: 'Отвечен',
  closed: 'Закрыт',
};

export function Thread() {
  const { contactId } = useParams<{ contactId: string }>();

  const { data: thread, isLoading } = useQuery({
    queryKey: queryKeys.emails.thread(contactId!),
    queryFn: () => apiGet<ThreadInfo>(`/api/emails/thread/${contactId}`),
    enabled: !!contactId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p>Загрузка...</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="space-y-6">
        <Link href="/emails">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к письмам
          </Button>
        </Link>
        <p className="text-muted-foreground">Цепочка не найдена</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/emails">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к письмам
          </Button>
        </Link>
        
        {thread.leadStatus && (
          <Badge className={leadStatusColors[thread.leadStatus]}>
            {leadStatusLabels[thread.leadStatus]}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{thread.contactName || thread.contactEmail}</h1>
        <p className="text-muted-foreground">{thread.contactEmail}</p>
      </div>

      <div className="space-y-4">
        {thread.emails.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет писем в этой цепочке
            </CardContent>
          </Card>
        ) : (
          thread.emails.map((email) => (
            <Card 
              key={email.id}
              className={email.direction === 'inbound' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${email.direction === 'inbound' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {email.direction === 'inbound' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        email.isAIGenerated ? (
                          <Bot className="h-4 w-4 text-purple-600" />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {email.direction === 'inbound' ? email.from : email.to}
                        {email.isAIGenerated && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            AI
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(email.sentAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcons[email.status]}
                    <span className="text-sm text-muted-foreground">
                      {email.direction === 'inbound' ? 'Входящее' : 'Исходящее'}
                    </span>
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{email.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {email.body}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
