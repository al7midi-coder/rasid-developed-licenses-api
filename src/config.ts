import { z } from 'zod';

const schema=z.object({
  PORT:z.coerce.number().default(8080),
  DATABASE_URL:z.string().optional(),
  PGHOST:z.string().optional(),
  PGPORT:z.coerce.number().default(5432),
  PGDATABASE:z.string().default('rasid'),
  PGUSER:z.string().default('rasid'),
  PGPASSWORD:z.string().optional(),
  DATABASE_SSL:z.enum(['disable','require','verify-full']).default('require'),
  DATABASE_CA_CERT:z.string().optional(),
  DATABASE_POOL_MAX:z.coerce.number().default(10),
  ALLOWED_ORIGINS:z.string().default('https://sustaqua.com,https://www.sustaqua.com,https://rasid-platform-2026.web.app,https://rasid-platform-2026.firebaseapp.com,http://127.0.0.1:8765'),
  API_ADMIN_TOKEN:z.string().min(16).optional(),
  COLLECTOR_INGEST_TOKEN:z.string().min(16).optional(),
  CURRENT_DATABASE_URL:z.string().optional(),
  STATEMENT_TIMEOUT_MS:z.coerce.number().default(15000),
  AUTO_MIGRATE:z.enum(['true','false']).default('true'),
CACHE_TTL_MS: z.coerce.number().int().min(1000).default(30000),
FACET_LIMIT: z.coerce.number().int().min(5).max(100).default(20),
MAP_CLUSTER_LIMIT: z.coerce.number().int().min(100).max(5000).default(1200),
MAP_POINT_LIMIT: z.coerce.number().int().min(100).max(5000).default(2000),

GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
PROGRAM_SPREADSHEET_ID: z.string().optional(),
USERS_SHEET_NAME: z.string().default('Users'),
RESEND_API_KEY: z.string().optional(),
PASSWORD_RESET_FROM: z.string().optional(),
PASSWORD_RESET_URL: z.string().url().default('https://sustaqua.com/rasid/reset-password'),
NOTIFICATION_FROM: z.string().optional(),
NOTIFICATION_LICENSE_SUBJECT: z.string().default('راصد | رخص محالة للإغلاق'),
NOTIFICATION_LICENSE_BODY: z.string().default('تمت إحالة {count} رخصة للإغلاق تخص: {departments}.'),
NOTIFICATION_VISIT_SUBJECT: z.string().default('راصد | زيارة جديدة على مشروعك'),
NOTIFICATION_VISIT_BODY: z.string().default('تم إنشاء زيارة جديدة رقم {visitCode} على مشروع {projectName} في {road} بواسطة {creator}.'),
});
export const config=schema.refine(value=>Boolean(value.DATABASE_URL||(value.PGHOST&&value.PGPASSWORD)),{message:'DATABASE_URL أو PGHOST/PGPASSWORD مطلوب'}).parse(process.env);
export const allowedOrigins=new Set(config.ALLOWED_ORIGINS.split(',').map(x=>x.trim()).filter(Boolean));
