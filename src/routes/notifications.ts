import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  listPlatformNotifications,
  markPlatformNotificationRead,
  notifyLicenseReferral,
  notifyVisitCreated
} from '../services/notification-service.js';

export async function notificationRoutes(app: FastifyInstance) {

  app.post('/license-referral', async request => {
    const b = z.object({
      ids: z.array(z.number().int().positive()).min(1).max(10000),
      actorEmail: z.string().email().optional()
    }).parse(request.body);

    return notifyLicenseReferral(
      [...new Set(b.ids)] as number[],
      b.actorEmail || ''
    );
  });

  app.post('/visit-created', async request => {
    const b = z.object({
      projectId: z.string().min(1),
      projectName: z.string().optional().default(''),
      visitCode: z.string().min(1),
      road: z.string().optional().default(''),
      creator: z.string().optional().default(''),

      visitDate: z.string().optional().default(''),

      evaluationScore: z
        .union([z.string(), z.number()])
        .optional()
        .transform(v => v === undefined ? '' : String(v)),

      createdByEmail: z.string().email().optional()
    }).parse(request.body);

    return notifyVisitCreated(b);
  });

  app.post('/list', async request => {
    const b = z.object({
      email: z.string().email(),
      limit: z.number().int().min(1).max(100).optional().default(20)
    }).parse(request.body);

    return listPlatformNotifications(
      b.email,
      b.limit
    );
  });

  app.post('/read', async request => {
    const b = z.object({
      id: z.number().int().positive(),
      email: z.string().email()
    }).parse(request.body);

    return markPlatformNotificationRead(
      b.id,
      b.email
    );
  });

}
