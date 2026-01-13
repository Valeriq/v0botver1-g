import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Combined hook for read-only resources like Leads and Gmail Accounts
// which don't have create/update actions in the current frontend scope

export function useLeads() {
  return useQuery({
    queryKey: [api.leads.list.path],
    queryFn: async () => {
      const res = await fetch(api.leads.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch leads");
      return api.leads.list.responses[200].parse(await res.json());
    },
  });
}

export function useGmailAccounts() {
  return useQuery({
    queryKey: [api.gmailAccounts.list.path],
    queryFn: async () => {
      const res = await fetch(api.gmailAccounts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch gmail accounts");
      return api.gmailAccounts.list.responses[200].parse(await res.json());
    },
  });
}
