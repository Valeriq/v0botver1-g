import { z } from 'zod';
import { 
  insertContactSchema, 
  insertCampaignSchema, 
  insertPromptProfileSchema, 
  contacts, 
  campaigns, 
  promptProfiles, 
  gmailAccounts, 
  leads,
  csvUploads
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  contacts: {
    list: {
      method: 'GET' as const,
      path: '/api/contacts',
      responses: {
        200: z.array(z.custom<typeof contacts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/contacts',
      input: insertContactSchema,
      responses: {
        201: z.custom<typeof contacts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/contacts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    uploadCsv: {
      method: 'POST' as const,
      path: '/api/contacts/upload-csv',
      input: z.object({
        fileContent: z.string(),
        filename: z.string(),
      }),
      responses: {
        200: z.object({
          success: z.boolean(),
          csvUploadId: z.string(),
          uploaded: z.number(),
          skipped: z.number(),
          errors: z.array(z.string()),
        }),
        400: errorSchemas.validation,
      },
    },
  },
  csvUploads: {
    list: {
      method: 'GET' as const,
      path: '/api/csv-uploads',
      responses: {
        200: z.array(z.custom<typeof csvUploads.$inferSelect>()),
      },
    },
  },
  campaigns: {
    list: {
      method: 'GET' as const,
      path: '/api/campaigns',
      responses: {
        200: z.array(z.custom<typeof campaigns.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/campaigns',
      input: insertCampaignSchema,
      responses: {
        201: z.custom<typeof campaigns.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  promptProfiles: {
    list: {
      method: 'GET' as const,
      path: '/api/prompt-profiles',
      responses: {
        200: z.array(z.custom<typeof promptProfiles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/prompt-profiles',
      input: insertPromptProfileSchema,
      responses: {
        201: z.custom<typeof promptProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  gmailAccounts: {
    list: {
      method: 'GET' as const,
      path: '/api/gmail-accounts',
      responses: {
        200: z.array(z.custom<typeof gmailAccounts.$inferSelect>()),
      },
    },
  },
  leads: {
    list: {
      method: 'GET' as const,
      path: '/api/leads',
      responses: {
        200: z.array(z.custom<typeof leads.$inferSelect>()),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
