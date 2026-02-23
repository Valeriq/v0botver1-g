import { z } from "zod";

const API_BASE = "";

export const buildUrl = (path: string, params?: Record<string, string>) => {
  if (!params) return path;
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
};

export const api = {
  contacts: {
    list: {
      path: `${API_BASE}/api/contacts`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          workspaceId: z.string(),
          email: z.string(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          company: z.string().nullable(),
          website: z.string().nullable(),
          customFields: z.record(z.any()).optional(),
          createdAt: z.string(),
        })),
      },
    },
    create: {
      path: `${API_BASE}/api/contacts`,
      responses: {
        201: z.object({
          id: z.string(),
          workspaceId: z.string(),
          email: z.string(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          company: z.string().nullable(),
          website: z.string().nullable(),
          createdAt: z.string(),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    delete: {
      path: `${API_BASE}/api/contacts/:id`,
      responses: {
        204: z.void(),
      },
    },
    uploadFile: {
      path: `${API_BASE}/api/contacts/upload`,
      input: z.object({
        filename: z.string(),
        content: z.string(),
      }),
      responses: {
        200: z.object({
          uploaded: z.number(),
          skipped: z.number(),
          errors: z.array(z.string()),
        }),
      },
    },
  },

  campaigns: {
    list: {
      path: `${API_BASE}/api/campaigns`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          workspaceId: z.string(),
          name: z.string(),
          status: z.enum(["draft", "active", "paused", "completed"]),
          promptProfileId: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
        })),
      },
    },
    create: {
      path: `${API_BASE}/api/campaigns`,
      responses: {
        201: z.object({
          id: z.string(),
          workspaceId: z.string(),
          name: z.string(),
          status: z.enum(["draft", "active", "paused", "completed"]),
          promptProfileId: z.string().nullable(),
          createdAt: z.string(),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    get: {
      path: `${API_BASE}/api/campaigns/:id`,
      responses: {
        200: z.object({
          id: z.string(),
          workspaceId: z.string(),
          name: z.string(),
          status: z.enum(["draft", "active", "paused", "completed"]),
          promptProfileId: z.string().nullable(),
          createdAt: z.string(),
          updatedAt: z.string(),
          stats: z.object({
            sent: z.number(),
            replied: z.number(),
            failed: z.number(),
          }).optional(),
        }),
      },
    },
    updateStatus: {
      path: `${API_BASE}/api/campaigns/:id/status`,
      responses: {
        200: z.object({
          id: z.string(),
          status: z.enum(["draft", "active", "paused", "completed"]),
        }),
      },
    },
  },

  leads: {
    list: {
      path: `${API_BASE}/api/leads`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          workspaceId: z.string(),
          contactId: z.string(),
          campaignId: z.string(),
          status: z.enum(["new", "taken", "replied", "closed"]),
          createdAt: z.string(),
        })),
      },
    },
    get: {
      path: `${API_BASE}/api/leads/:id`,
      responses: {
        200: z.object({
          id: z.string(),
          workspaceId: z.string(),
          contactId: z.string(),
          campaignId: z.string(),
          status: z.enum(["new", "taken", "replied", "closed"]),
          createdAt: z.string(),
          thread: z.array(z.object({
            id: z.string(),
            from: z.string(),
            to: z.string(),
            subject: z.string(),
            body: z.string(),
            createdAt: z.string(),
          })).optional(),
        }),
      },
    },
    take: {
      path: `${API_BASE}/api/leads/:id/take`,
      responses: {
        200: z.object({
          id: z.string(),
          status: z.enum(["new", "taken", "replied", "closed"]),
        }),
      },
    },
    reply: {
      path: `${API_BASE}/api/leads/:id/reply`,
      responses: {
        200: z.object({
          success: z.boolean(),
        }),
      },
    },
    close: {
      path: `${API_BASE}/api/leads/:id/close`,
      responses: {
        200: z.object({
          id: z.string(),
          status: z.enum(["new", "taken", "replied", "closed"]),
        }),
      },
    },
  },

  billing: {
    balance: {
      path: `${API_BASE}/api/billing/balance`,
      responses: {
        200: z.object({
          workspaceId: z.string(),
          balance: z.number(),
        }),
      },
    },
    ledger: {
      path: `${API_BASE}/api/billing/ledger`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          workspaceId: z.string(),
          type: z.enum(["credit", "debit"]),
          amount: z.number(),
          description: z.string().nullable(),
          createdAt: z.string(),
        })),
      },
    },
    credit: {
      path: `${API_BASE}/api/billing/credit`,
      responses: {
        200: z.object({
          workspaceId: z.string(),
          balance: z.number(),
        }),
      },
    },
  },

  gmailAccounts: {
    list: {
      path: `${API_BASE}/api/accounts`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          email: z.string(),
          status: z.enum(["ok", "limit", "blocked", "auth_failed"]),
          createdAt: z.string(),
        })),
      },
    },
    create: {
      path: `${API_BASE}/api/accounts`,
      responses: {
        201: z.object({
          id: z.string(),
          email: z.string(),
          status: z.enum(["ok", "limit", "blocked", "auth_failed"]),
        }),
      },
    },
  },

  promptProfiles: {
    list: {
      path: `${API_BASE}/api/prompt-profiles`,
      responses: {
        200: z.array(z.object({
          id: z.string(),
          workspaceId: z.string(),
          name: z.string(),
          systemPrompt: z.string(),
          createdAt: z.string(),
        })),
      },
    },
    create: {
      path: `${API_BASE}/api/prompt-profiles`,
      responses: {
        201: z.object({
          id: z.string(),
          workspaceId: z.string(),
          name: z.string(),
          systemPrompt: z.string(),
        }),
      },
    },
    update: {
      path: `${API_BASE}/api/prompt-profiles/:id`,
      responses: {
        200: z.object({
          id: z.string(),
          name: z.string(),
          systemPrompt: z.string(),
        }),
      },
    },
    delete: {
      path: `${API_BASE}/api/prompt-profiles/:id`,
      responses: {
        204: z.void(),
      },
    },
  },
} as const;