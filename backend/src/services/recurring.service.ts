import { transactionRepository } from '../repositories/transaction.repository.js';

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dueDateForMonth(year: number, month: number, recurringDay: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(recurringDay, lastDay);
  return new Date(year, month, day);
}

/**
 * Gera transações recorrentes do mês atual.
 * Para cada "regra" recorrente (user + descrição + categoria + valor + recurringDay),
 * verifica se já existe transação no mês; se não, cria uma com due_date = recurring_day no mês.
 * Não duplica se já existir.
 */
export async function generateMonthlyRecurring(): Promise<{ created: number; skipped: number }> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const year = now.getFullYear();
  const month = now.getMonth();

  const templates = await transactionRepository.findRecurringTemplates();
  const seen = new Set<string>();
  let created = 0;
  let skipped = 0;

  for (const t of templates) {
    const day = t.recurringDay ?? 0;
    if (day < 1 || day > 31) continue;

    const amount = Number(t.amount);
    const key = `${t.userId}|${t.description}|${t.category}|${amount}|${day}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const exists = await transactionRepository.existsRecurringInMonth(
      t.userId,
      t.description,
      t.category,
      amount,
      day,
      monthStart,
      monthEnd
    );

    if (exists) {
      skipped++;
      continue;
    }

    const dueDate = dueDateForMonth(year, month, day);
    await transactionRepository.create({
      user: { connect: { id: t.userId } },
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      dueDate,
      isPaid: false,
      recurring: true,
      recurringDay: day,
    });
    created++;
  }

  return { created, skipped };
}
