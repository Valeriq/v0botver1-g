import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCampaigns, useCreateCampaign } from "@/hooks/use-campaigns";
import { usePromptProfiles } from "@/hooks/use-prompt-profiles";
import { Plus, Play, Pause, BarChart2, MoreVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCampaignSchema } from "@shared/schema";

const statusLabels: Record<string, string> = {
  active: "Активна",
  completed: "Завершена",
  draft: "Черновик",
  paused: "Приостановлена",
};

export default function Campaigns() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppLayout>
      <PageHeader
        title="Кампании"
        description="Создавайте и управляйте вашими email-рассылками."
        actions={
          <CreateCampaignDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground col-span-3 text-center py-10">Загрузка кампаний...</p>
        ) : campaigns?.length === 0 ? (
          <div className="col-span-3 text-center py-16 bg-card border border-border/50 rounded-xl border-dashed">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Play className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">Кампаний пока нет</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
              Создайте первую кампанию, чтобы начать рассылку потенциальным клиентам.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Создать кампанию</Button>
          </div>
        ) : (
          campaigns?.map((campaign) => (
            <div key={campaign.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <Badge variant={
                  campaign.status === 'active' ? 'default' : 
                  campaign.status === 'completed' ? 'secondary' : 'outline'
                }>
                  {statusLabels[campaign.status] || campaign.status}
                </Badge>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              
              <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                {campaign.name}
              </h3>
              
              <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-border/50">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Отправлено</p>
                  <p className="text-xl font-bold mt-1">{(campaign.stats as any)?.sent || 0}</p>
                </div>
                <div className="text-center border-l border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ответы</p>
                  <p className="text-xl font-bold mt-1 text-green-600">{(campaign.stats as any)?.replied || 0}</p>
                </div>
                <div className="text-center border-l border-border/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Ошибки</p>
                  <p className="text-xl font-bold mt-1 text-red-500">{(campaign.stats as any)?.failed || 0}</p>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="w-full">Редактировать</Button>
                <Button variant="secondary" className="w-full">Аналитика</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

function CreateCampaignDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const createCampaign = useCreateCampaign();
  const { data: profiles } = usePromptProfiles();
  
  const form = useForm({
    resolver: zodResolver(insertCampaignSchema),
    defaultValues: {
      name: "",
      promptProfileId: "",
      workspaceId: "00000000-0000-0000-0000-000000000000",
    }
  });

  const onSubmit = (data: any) => {
    createCampaign.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="btn-primary">
          <Plus className="mr-2 h-4 w-4" /> Новая кампания
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новую кампанию</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название кампании</Label>
            <Input id="name" {...form.register("name")} placeholder="напр. Рассылка Q3" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile">AI Профиль</Label>
            <Select onValueChange={(val) => form.setValue("promptProfileId", val)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите профиль" />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map(profile => (
                  <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={createCampaign.isPending}>
              {createCampaign.isPending ? "Создание..." : "Создать кампанию"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
