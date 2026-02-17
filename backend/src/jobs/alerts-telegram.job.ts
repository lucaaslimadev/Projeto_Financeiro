import cron from 'node-cron';
import { config } from '../config/index.js';
import { sendAlertsToAllUsers } from '../services/alert-telegram.service.js';

export function startAlertsTelegramJob(): void {
  if (config.cronAlertsTelegramDisabled || !config.telegramBotToken) {
    if (!config.telegramBotToken) return;
    if (config.cronAlertsTelegramDisabled) {
      console.log('[Cron] Job de alertas por Telegram desativado.');
    }
    return;
  }

  const schedule = config.cronAlertsTelegram;
  if (!cron.validate(schedule)) {
    console.warn('[Cron] CRON_ALERTS_TELEGRAM inválido:', schedule);
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      const result = await sendAlertsToAllUsers();
      console.log(`[Cron] Alertas Telegram: ${result.sent} enviados, ${result.errors} erros.`);
    } catch (err) {
      console.error('[Cron] Erro ao enviar alertas Telegram:', err);
    }
  });

  console.log('[Cron] Job de alertas Telegram agendado:', schedule);
}
