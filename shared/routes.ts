import { z } from 'zod';
import { insertProfileSchema, profiles } from './schema';

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
  profiles: {
    create: {
      method: 'POST' as const,
      path: '/api/profiles' as const,
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateLocation: {
      method: 'PATCH' as const,
      path: '/api/profiles/:id/location' as const,
      input: z.object({
        latitude: z.number(),
        longitude: z.number()
      }),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
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

export const wsEvents = {
  send: {
    joinQueue: z.object({ profileId: z.number(), latitude: z.number().optional(), longitude: z.number().optional() }),
    leaveQueue: z.object({}),
    offer: z.object({ targetId: z.string(), sdp: z.any() }),
    answer: z.object({ targetId: z.string(), sdp: z.any() }),
    iceCandidate: z.object({ targetId: z.string(), candidate: z.any() }),
    endChat: z.object({ targetId: z.string().optional() }),
  },
  receive: {
    matched: z.object({ partnerId: z.string(), partnerProfile: z.any(), initiator: z.boolean() }),
    offer: z.object({ senderId: z.string(), sdp: z.any() }),
    answer: z.object({ senderId: z.string(), sdp: z.any() }),
    iceCandidate: z.object({ senderId: z.string(), candidate: z.any() }),
    chatEnded: z.object({}),
    error: z.object({ message: z.string() })
  }
};
