import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { usePromptProfiles, useCreatePromptProfile } from "@/hooks/use-prompt-profiles";
import { Plus, Sparkles, MessageSquare } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPromptProfileSchema } from "@shared/schema";

export default function AIProfiles() {
  const { data: profiles, isLoading } = usePromptProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <AppLayout>
      <PageHeader
        title="AI Профили"
        description="Настройте, как AI будет писать ваши письма."
        actions={
          <CreateProfileDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground col-span-3 text-center">Загрузка профилей...</p>
        ) : profiles?.length === 0 ? (
          <div className="col-span-3 text-center py-16 bg-card border border-border/50 rounded-xl border-dashed">
             <div className="mx-auto h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 text-purple-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">AI Профилей нет</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
              Создайте профиль, чтобы научить AI вашему стилю общения.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Создать профиль</Button>
          </div>
        ) : (
          profiles?.map((profile) => (
            <div key={profile.id} className="bg-card border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg">{profile.name}</h3>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <MessageSquare className="h-3 w-3" /> Системные инструкции
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 italic">
                  "{profile.systemInstructions}"
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="w-full text-sm">Редактировать</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

function CreateProfileDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const createProfile = useCreatePromptProfile();
  
  const form = useForm({
    resolver: zodResolver(insertPromptProfileSchema),
    defaultValues: {
      name: "",
      systemInstructions: "",
      workspaceId: "00000000-0000-0000-0000-000000000000",
    }
  });

  const onSubmit = (data: any) => {
    createProfile.mutate(data, {
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
          <Plus className="mr-2 h-4 w-4" /> Новый профиль
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Создать AI Профиль</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название профиля</Label>
            <Input id="name" {...form.register("name")} placeholder="напр. Дружелюбный IT-продажник" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Системные инструкции</Label>
            <Textarea 
              id="instructions" 
              {...form.register("systemInstructions")} 
              placeholder="Ты эксперт по продажам. Пиши короткие, энергичные письма..."
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Опишите персону, тон и ограничения для AI.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={createProfile.isPending}>
              {createProfile.isPending ? "Создание..." : "Создать профиль"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
