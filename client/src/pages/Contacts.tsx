import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { useContacts, useCreateContact, useDeleteContact, useUploadFileToStorage } from "@/hooks/use-contacts";
import { Plus, Trash2, Search, User, Briefcase, Globe, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema } from "@shared/schema";

type ContactFormData = z.infer<typeof insertContactSchema>;

const CONTACTS_PER_PAGE = 25;

export default function Contacts() {
  const { data: contacts, isLoading } = useContacts();
  const deleteContact = useDeleteContact();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredContacts = contacts?.filter(contact => 
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalContacts = filteredContacts?.length || 0;
  const totalPages = Math.ceil(totalContacts / CONTACTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
  const endIndex = startIndex + CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts?.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <AppLayout>
      <PageHeader
        title="Контакты"
        description="Управляйте базой потенциальных клиентов."
        actions={
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Поиск контактов..." 
                className="pl-9 w-64 bg-background"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <UploadFileButton />
            <CreateContactDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
          </div>
        }
      />

      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Компания</TableHead>
              <TableHead>Сайт</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Загрузка контактов...
                </TableCell>
              </TableRow>
            ) : paginatedContacts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Контакты не найдены. Добавьте первый контакт.
                </TableCell>
              </TableRow>
            ) : (
              paginatedContacts?.map((contact) => (
                <TableRow key={contact.id} className="group">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      {contact.firstName} {contact.lastName}
                    </div>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>
                    {contact.company && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        {contact.company}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.website && (
                      <a href={contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <Globe className="h-3 w-3" />
                        Открыть
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContact.mutate(contact.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted-foreground">
            Показано {startIndex + 1}-{Math.min(endIndex, totalContacts)} из {totalContacts} контактов
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
              Назад
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-9"
                    data-testid={`button-page-${page}`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              data-testid="button-next-page"
            >
              Далее
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function CreateContactDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const createContact = useCreateContact();
  const form = useForm<ContactFormData>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      website: "",
    }
  });

  const onSubmit = (data: ContactFormData) => {
    const payload = { 
      ...data, 
      workspaceId: "00000000-0000-0000-0000-000000000000"
    };
    
    createContact.mutate(payload as any, {
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
          <Plus className="mr-2 h-4 w-4" /> Добавить контакт
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Добавить новый контакт</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input id="firstName" {...form.register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input id="lastName" {...form.register("lastName")} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
            <Input id="email" type="email" {...form.register("email")} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Компания</Label>
            <Input id="company" {...form.register("company")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Сайт</Label>
            <Input id="website" {...form.register("website")} placeholder="https://" />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? "Создание..." : "Создать контакт"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadFileButton() {
  const uploadFile = useUploadFileToStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ 
    success: boolean; 
    filename: string; 
    uploaded?: number;
    skipped?: number;
    errors?: string[];
    error?: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExts = [".csv", ".xlsx", ".xls"];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExts.includes(ext)) {
      setUploadResult({
        success: false,
        filename: file.name,
        error: "Выберите CSV или Excel файл (.csv, .xlsx, .xls)"
      });
      setIsDialogOpen(true);
      return;
    }

    try {
      const result = await uploadFile.mutateAsync(file);
      setUploadResult({
        success: true,
        filename: result.filename,
        uploaded: result.uploaded,
        skipped: result.skipped,
        errors: result.errors,
      });
      setIsDialogOpen(true);
    } catch (error) {
      setUploadResult({
        success: false,
        filename: file.name,
        error: (error as Error).message,
      });
      setIsDialogOpen(true);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-file-upload"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploadFile.isPending}
        data-testid="button-upload-file"
      >
        <Upload className="mr-2 h-4 w-4" />
        {uploadFile.isPending ? "Загрузка..." : "Загрузить Excel/CSV"}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Результат загрузки</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {uploadResult?.success ? (
              <>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="font-medium">Файл успешно загружен!</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{uploadResult.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Загружено контактов:</span>
                  <span className="font-medium text-green-600">{uploadResult.uploaded || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Пропущено:</span>
                  <span className="font-medium text-yellow-600">{uploadResult.skipped || 0}</span>
                </div>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground">Предупреждения:</span>
                    <ul className="text-sm text-yellow-600 space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>...и ещё {uploadResult.errors.length - 5}</li>
                      )}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-destructive">
                  <span className="font-medium">Ошибка загрузки</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {uploadResult?.error || "Неизвестная ошибка"}
                </div>
              </>
            )}
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsDialogOpen(false)}>Закрыть</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
