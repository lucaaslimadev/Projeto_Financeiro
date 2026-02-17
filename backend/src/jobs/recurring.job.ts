import cron from 'node-cron';
import { config } from '../config/index.js';
import { generateMonthlyRecurring } from '../services/recurring.service.js';

export function startRecurringJob(): void {
  if (config.cronRecurringDisabled || !config.cronRecurring) {
    console.log('[Cron] Job de contas recorrentes desativado.');
    return;
  }

  const schedule = config.cronRecurring;
  if (!cron.validate(schedule)) {
    console.warn('[Cron] Expressão inválida:', schedule, '- job de recorrentes não agendado.');
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      const result = await generateMonthlyRecurring();
      console.log(
        `[Cron] Recorrentes: ${result.created} criadas, ${result.skipped} já existiam.`
      );
    } catch (err) {
      console.error('[Cron] Erro ao gerar recorrentes:', err);
    }
  });

  console.log('[Cron] Job de contas recorrentes agendado:', schedule);
}
