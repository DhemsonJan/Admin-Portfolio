import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(here, '..', '..');

const bool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const int = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const list = (value, fallback = []) => {
  const parsed = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : fallback;
};

const env = process.env;
const nodeEnv = env.NODE_ENV ?? 'development';
const isProd = nodeEnv === 'production';

const resolveFromServer = (value, fallback) => path.resolve(serverRoot, value ?? fallback);

export const config = {
  serverRoot,
  isProd,
  nodeEnv,
  port: int(env.PORT, 4000),

  clientOrigin: list(env.CLIENT_ORIGIN, ['http://localhost:5173', 'http://localhost:5174']),
  serveClient: bool(env.SERVE_CLIENT, true),

  /**
   * Whether the admin surface (login, project mutations, uploads) is mounted.
   *
   * True for the CMS process you run on your own machine. The public deployment
   * sets EXPOSE_ADMIN=false so the login endpoint and every write route are
   * absent from the build rather than merely protected by a PIN — content is
   * published from the CMS straight into the shared database.
   */
  exposeAdmin: bool(env.EXPOSE_ADMIN, true),

  db: {
    client: (env.DB_CLIENT ?? 'sqlite').toLowerCase(),
    sqliteFile: resolveFromServer(env.SQLITE_FILE, './data/portfolio.db'),
    databaseUrl: env.DATABASE_URL ?? '',
    poolMax: int(env.DB_POOL_MAX, 10),
  },

  auth: {
    pinHash: (env.ADMIN_PIN_HASH ?? '').trim(),
    pin: (env.ADMIN_PIN ?? '').trim(),
    sessionTtlHours: int(env.SESSION_TTL_HOURS, 12),
    cookieName: 'pm_session',
    cookieSecure: env.COOKIE_SECURE === 'auto' || env.COOKIE_SECURE === ''
      ? isProd
      : bool(env.COOKIE_SECURE, isProd),
  },

  rateLimit: {
    windowMinutes: int(env.LOGIN_WINDOW_MINUTES, 15),
    maxAttempts: int(env.LOGIN_MAX_ATTEMPTS, 5),
    lockoutMinutes: int(env.LOGIN_LOCKOUT_MINUTES, 15),
  },

  /**
   * Outbound email. Contact-form messages are sent to `mail.to` through the
   * configured SMTP account. Gmail works with an app password (not the account
   * password); keep it in SMTP_PASS.
   */
  mail: {
    enabled: bool(env.MAIL_ENABLED, false),
    host: env.SMTP_HOST ?? 'smtp.gmail.com',
    port: int(env.SMTP_PORT, 465),
    secure: (env.SMTP_SECURE ?? '') === 'true' || int(env.SMTP_PORT, 465) === 465,
    user: env.SMTP_USER ?? '',
    pass: env.SMTP_PASS ?? '',
    from: env.MAIL_FROM ?? '',
    to: env.MAIL_TO ?? '',
  },

  storage: {
    driver: (env.STORAGE_DRIVER ?? 'local').toLowerCase(),
    uploadDir: resolveFromServer(env.UPLOAD_DIR, './uploads'),
    publicUploadPath: env.PUBLIC_UPLOAD_PATH ?? '/uploads',
    maxUploadBytes: int(env.MAX_UPLOAD_MB, 8) * 1024 * 1024,
    maxGalleryImages: int(env.MAX_GALLERY_IMAGES, 8),
    allowedTypes: list(env.ALLOWED_IMAGE_TYPES, ['image/jpeg', 'image/png', 'image/webp']),
    supabase: {
      url: (env.SUPABASE_URL ?? '').replace(/\/+$/, ''),
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
      bucket: env.SUPABASE_BUCKET ?? 'portfolio',
    },
    s3: {
      bucket: env.S3_BUCKET ?? '',
      region: env.S3_REGION ?? 'auto',
      endpoint: env.S3_ENDPOINT ?? '',
      accessKeyId: env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? '',
      publicBaseUrl: (env.S3_PUBLIC_BASE_URL ?? '').replace(/\/+$/, ''),
    },
  },
};

export default config;