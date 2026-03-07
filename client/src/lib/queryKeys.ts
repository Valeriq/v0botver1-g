/**
 * Type-safe query keys factory for TanStack Query
 * Provides hierarchical structure for cache key management
 */
export const queryKeys = {
  /**
   * Query keys for contacts
   */
  contacts: {
    /** All contacts query key */
    all: ['contacts'] as const,
    /** List of contacts query key */
    list: () => [...queryKeys.contacts.all, 'list'] as const,
    /** Single contact detail query key */
    detail: (id: string) => [...queryKeys.contacts.all, 'detail', id] as const,
  },

  /**
   * Query keys for campaigns
   */
  campaigns: {
    /** All campaigns query key */
    all: ['campaigns'] as const,
    /** List of campaigns query key */
    list: () => [...queryKeys.campaigns.all, 'list'] as const,
    /** Single campaign detail query key */
    detail: (id: string) => [...queryKeys.campaigns.all, 'detail', id] as const,
  },

  /**
   * Query keys for leads
   */
  leads: {
    /** All leads query key */
    all: ['leads'] as const,
    /** List of leads query key */
    list: () => [...queryKeys.leads.all, 'list'] as const,
    /** Single lead detail query key */
    detail: (id: string) => [...queryKeys.leads.all, 'detail', id] as const,
  },

  /**
   * Query keys for emails
   */
  emails: {
    /** All emails query key */
    all: ['emails'] as const,
    /** List of emails query key */
    list: () => [...queryKeys.emails.all, 'list'] as const,
    /** Single email detail query key */
    detail: (id: string) => [...queryKeys.emails.all, 'detail', id] as const,
  },

  /**
   * Query keys for Gmail accounts
   */
  gmailAccounts: {
    /** All Gmail accounts query key */
    all: ['gmailAccounts'] as const,
    /** List of Gmail accounts query key */
    list: () => [...queryKeys.gmailAccounts.all, 'list'] as const,
    /** Single Gmail account detail query key */
    detail: (id: string) => [...queryKeys.gmailAccounts.all, 'detail', id] as const,
  },

  /**
   * Query keys for prompt profiles
   */
  promptProfiles: {
    /** All prompt profiles query key */
    all: ['promptProfiles'] as const,
    /** List of prompt profiles query key */
    list: () => [...queryKeys.promptProfiles.all, 'list'] as const,
    /** Single prompt profile detail query key */
    detail: (id: string) => [...queryKeys.promptProfiles.all, 'detail', id] as const,
  },
} as const;
