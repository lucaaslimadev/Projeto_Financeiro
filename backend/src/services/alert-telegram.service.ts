import { prisma } from '../lib/prisma.js';
import { dashboardService } from './dashboard.service.js';
import { sendTelegramMessage } from '../telegram/client.js';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/**
 * Envia alertas do dia por Telegram para todos os usuários que têm telegram_id.
 * Resumo: contas vencendo hoje, atrasadas, faturas fechadas.
 */
export async function sendAlertsToAllUsers(): Promise<{ sent: number; errors: number }> {
  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: { id: true, telegramId: true },
  });

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    const telegramId = user.telegramId!;
    try {
      const alerts = await dashboardService.getAlerts(user.id);
      const hasAny =
        alerts.dueToday.length > 0 ||
        alerts.overdue.length > 0 ||
        alerts.invoiceClosed.length > 0;

      if (!hasAny) continue;

      const lines: string[] = ['📋 Resumo do dia'];

      if (alerts.dueToday.length > 0) {
        lines.push('\n⏰ Vencendo hoje:');
        alerts.dueToday.forEach((t) =>
          lines.push(`• ${t.description}: ${formatMoney(t.amount)}`)
        );
      }
      if (alerts.overdue.length > 0) {
        lines.push('\n🔴 Atrasadas:');
        alerts.overdue.forEach((t) =>
          lines.push(`• ${t.description}: ${formatMoney(t.amount)}`)
        );
      }
      if (alerts.invoiceClosed.length > 0) {
        lines.push('\n💳 Fatura fechada:');
        alerts.invoiceClosed.forEach(
          (inv) =>
            lines.push(`• ${inv.cardName}: ${formatMoney(inv.totalUnpaid)} — vence dia ${inv.dueDay}`)
        );
      }

      const text = lines.join('\n');
      await sendTelegramMessage(Number(telegramId), text);
      sent++;
    } catch (err) {
      console.error(`[Alertas Telegram] Erro para user ${user.id}:`, err);
      errors++;
    }
  }

  return { sent, errors };
}
