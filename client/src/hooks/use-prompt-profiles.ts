import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertPromptProfile } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function usePromptProfiles() {
  return useQuery({
    queryKey: [api.promptProfiles.list.path],
    queryFn: async () => {
      const res = await fetch(api.promptProfiles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch prompt profiles");
      return api.promptProfiles.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePromptProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertPromptProfile) => {
      const res = await fetch(api.promptProfiles.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.promptProfiles.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create prompt profile");
      }
      return api.promptProfiles.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.promptProfiles.list.path] });
      toast({ title: "Success", description: "Prompt profile created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}
