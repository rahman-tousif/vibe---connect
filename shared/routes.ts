import { z } from 'zod';
import { insertProfileSchema, profiles, groups, messages, insertGroupSchema } from './schema';

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
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/groups' as const,
      responses: {
        200: z.array(z.custom<typeof groups.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/groups' as const,
      input: insertGroupSchema,
      responses: {
        201: z.custom<typeof groups.$inferSelect>(),
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/groups/:id' as const,
      responses: {
        200: z.custom<typeof groups.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    },
    seed: {
      method: 'POST' as const,
      path: '/api/groups/seed' as const,
      responses: {
        201: z.object({ message: z.string(), count: z.number() }),
      }
    },
    messages: {
      list: {
        method: 'GET' as const,
        path: '/api/groups/:id/messages' as const,
        responses: {
          200: z.array(z.custom<typeof messages.$inferSelect>()),
        }
      }
    }
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

export const wsEvents = {
  send: {
    joinQueue: z.object({ profileId: z.number(), latitude: z.number().optional(), longitude: z.number().optional() }),
    leaveQueue: z.object({}),
    offer: z.object({ targetId: z.string(), sdp: z.any() }),
    answer: z.object({ targetId: z.string(), sdp: z.any() }),
    iceCandidate: z.object({ targetId: z.string(), candidate: z.any() }),
    endChat: z.object({ targetId: z.string().optional() }),
    // Group watch party events
    joinGroup: z.object({ groupId: z.number(), profileId: z.number() }),
    sendMessage: z.object({ groupId: z.number(), profileId: z.number(), content: z.string() }),
    updateVideo: z.object({ groupId: z.number(), videoUrl: z.string(), isPlaying: z.boolean(), playbackTime: z.number() }),
    groupOffer: z.object({ groupId: z.number(), targetProfileId: z.number(), sdp: z.any() }),
    groupAnswer: z.object({ groupId: z.number(), targetProfileId: z.number(), sdp: z.any() }),
    groupIceCandidate: z.object({ groupId: z.number(), targetProfileId: z.number(), candidate: z.any() }),
  },
  receive: {
    matched: z.object({ partnerId: z.string(), partnerProfile: z.any(), initiator: z.boolean() }),
    offer: z.object({ senderId: z.string(), sdp: z.any() }),
    answer: z.object({ senderId: z.string(), sdp: z.any() }),
    iceCandidate: z.object({ senderId: z.string(), candidate: z.any() }),
    chatEnded: z.object({}),
    error: z.object({ message: z.string() }),
    // Group watch party events
    userJoinedGroup: z.object({ profileId: z.number(), profile: z.any() }),
    newMessage: z.object({ message: z.any() }),
    videoUpdated: z.object({ videoUrl: z.string(), isPlaying: z.boolean(), playbackTime: z.number() }),
    groupOffer: z.object({ senderProfileId: z.number(), sdp: z.any() }),
    groupAnswer: z.object({ senderProfileId: z.number(), sdp: z.any() }),
    groupIceCandidate: z.object({ senderProfileId: z.number(), candidate: z.any() }),
  }
};
