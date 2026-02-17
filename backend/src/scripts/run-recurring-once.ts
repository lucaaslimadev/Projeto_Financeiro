/**
 * Roda a geração de contas recorrentes uma vez (para uso com cron do sistema).
 * Uso: npx tsx src/scripts/run-recurring-once.ts
 *      ou: npm run cron:recurring
 */
import 'dotenv/config';
import { generateMonthlyRecurring } from '../services/recurring.service.js';
import { prisma } from '../lib/prisma.js';

async function main() {
  const result = await generateMonthlyRecurring();
  console.log(JSON.stringify({ created: result.created, skipped: result.skipped }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
