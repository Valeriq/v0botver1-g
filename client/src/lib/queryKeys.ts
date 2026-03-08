export const queryKeys = {
  all: ['all'] as const,
  
  // Contacts
  contacts: {
    all: ['contacts'] as const,
    lists: () => [...queryKeys.contacts.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.contacts.lists(), { filters }] as const,
    details: () => [...queryKeys.contacts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
  },
  
  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.campaigns.lists(), { filters }] as const,
    details: () => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.campaigns.details(), id] as const,
  },
  
  // Leads
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.leads.lists(), { filters }] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
  },
  
  // Gmail Accounts
  accounts: {
    all: ['accounts'] as const,
    lists: () => [...queryKeys.accounts.all, 'list'] as const,
    list: (workspaceId: string) => [...queryKeys.accounts.lists(), workspaceId] as const,
    details: () => [...queryKeys.accounts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.accounts.details(), id] as const,
  },
  
  // Templates (Prompt Profiles)
  templates: {
    all: ['templates'] as const,
    lists: () => [...queryKeys.templates.all, 'list'] as const,
    list: (workspaceId: string) => [...queryKeys.templates.lists(), workspaceId] as const,
    details: () => [...queryKeys.templates.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.templates.details(), id] as const,
  },
  
  // Emails
  emails: {
    all: ['emails'] as const,
    lists: () => [...queryKeys.emails.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.emails.lists(), { filters }] as const,
    thread: (contactId: string) => [...queryKeys.emails.all, 'thread', contactId] as const,
  },
  
  // Dashboard stats
  dashboard: {
    all: ['dashboard'] as const,
    stats: (workspaceId: string) => [...queryKeys.dashboard.all, 'stats', workspaceId] as const,
  },
};
