export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT) || 3001,
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  /** Origens CORS separadas por vírgula. Em desenvolvimento aceita 3000 e 3010. */
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000,http://localhost:3010').split(',').map((s) => s.trim()).filter(Boolean),
  databaseUrl: process.env.DATABASE_URL ?? '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  /** URL pública do webhook (ex: https://seu-dominio.com/api/v1/webhook/telegram). Necessária para setWebhook. */
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'default-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  /** Cron para contas fixas mensais. Ex: "0 1 * * *" = 1h todo dia. Vazio ou CRON_RECURRING_DISABLED=1 desliga. */
  cronRecurring: process.env.CRON_RECURRING ?? '0 1 * * *',
  cronRecurringDisabled: process.env.CRON_RECURRING_DISABLED === '1' || process.env.CRON_RECURRING_DISABLED === 'true',
  /** Cron para envio de alertas por Telegram. Ex: "0 8 * * *" = 8h todo dia. CRON_ALERTS_TELEGRAM_DISABLED=1 desliga. */
  cronAlertsTelegram: process.env.CRON_ALERTS_TELEGRAM ?? '0 8 * * *',
  cronAlertsTelegramDisabled: process.env.CRON_ALERTS_TELEGRAM_DISABLED === '1' || process.env.CRON_ALERTS_TELEGRAM_DISABLED === 'true',
} as const;
