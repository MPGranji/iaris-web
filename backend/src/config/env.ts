export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL?.trim() || '',
  adminToken: process.env.ADMIN_TOKEN?.trim() || '',
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};

/** Without DATABASE_URL the API serves the static content and does not persist form data. */
export const hasDatabase = Boolean(env.databaseUrl);
