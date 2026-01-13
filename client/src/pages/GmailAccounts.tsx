import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useGmailAccounts } from "@/hooks/use-resources";
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GmailAccounts() {
  const { data: accounts, isLoading } = useGmailAccounts();

  return (
    <AppLayout>
      <PageHeader
        title="Gmail Аккаунты"
        description="Подключайте и управляйте аккаунтами для рассылки."
        actions={
          <Button className="btn-primary">
            <Mail className="mr-2 h-4 w-4" /> Подключить аккаунт
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {isLoading ? (
          <p className="text-muted-foreground">Загрузка аккаунтов...</p>
        ) : accounts?.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-card border border-border/50 rounded-xl border-dashed">
            <h3 className="text-lg font-semibold">Нет подключенных аккаунтов</h3>
            <p className="text-muted-foreground mt-2 mb-6">
              Подключите Gmail аккаунт, чтобы начать рассылку кампаний.
            </p>
          </div>
        ) : (
          accounts?.map((account) => (
            <div key={account.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{account.email}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {account.status === 'ok' ? (
                      <span className="flex items-center text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Активен
                      </span>
                    ) : (
                      <span className="flex items-center text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="h-3 w-3 mr-1" /> Требуется авторизация
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Дневной лимит: {account.dailySentCount || 0}/500
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" title="Обновить статус">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
