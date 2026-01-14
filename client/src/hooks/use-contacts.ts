import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertContact, Contact } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useContacts() {
  return useQuery({
    queryKey: [api.contacts.list.path],
    queryFn: async () => {
      const res = await fetch(api.contacts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return api.contacts.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertContact) => {
      const res = await fetch(api.contacts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.contacts.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create contact");
      }
      return api.contacts.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      toast({ title: "Success", description: "Contact created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.contacts.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      toast({ title: "Успех", description: "Контакт удалён" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

type UploadCsvInput = z.infer<typeof api.contacts.uploadCsv.input>;
type UploadCsvResponse = z.infer<typeof api.contacts.uploadCsv.responses[200]>;

export function useUploadCsv() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UploadCsvInput): Promise<UploadCsvResponse> => {
      const res = await fetch(api.contacts.uploadCsv.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Ошибка загрузки CSV");
      }
      return api.contacts.uploadCsv.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.contacts.list.path] });
      toast({ 
        title: "CSV загружен", 
        description: `Добавлено: ${data.uploaded}, пропущено: ${data.skipped}` 
      });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}
