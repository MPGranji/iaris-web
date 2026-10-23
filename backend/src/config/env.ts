export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4001),
  databaseUrl: process.env.DATABASE_URL?.trim() || "",
  adminToken: process.env.ADMIN_TOKEN?.trim() || "",
  demoAdminLogin: process.env.DEMO_ADMIN_LOGIN === "true",
  appOrigins: (process.env.APP_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  mailMode: process.env.MAIL_MODE?.trim() || "preview",
  mailFrom: process.env.MAIL_FROM?.trim() || "",
  mailReplyTo: process.env.MAIL_REPLY_TO?.trim() || "",
  consultationTo: process.env.CONSULTATION_TO?.trim() || "",
  adminAppUrl: process.env.ADMIN_APP_URL?.trim() || "http://127.0.0.1:5176",
  publicSiteUrl:
    process.env.PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:5175",
  smtpHost: process.env.SMTP_HOST?.trim() || "",
  smtpPort: Number(process.env.SMTP_PORT ?? 465),
  smtpSecure: process.env.SMTP_SECURE !== "false",
  smtpUser: process.env.SMTP_USER?.trim() || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
};

/** Without DATABASE_URL the API serves the static content and does not persist form data. */
export const hasDatabase = Boolean(env.databaseUrl);
