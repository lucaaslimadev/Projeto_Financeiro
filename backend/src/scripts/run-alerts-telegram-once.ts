import 'dotenv/config';
import { sendAlertsToAllUsers } from '../services/alert-telegram.service.js';
import { prisma } from '../lib/prisma.js';

async function main() {
  const result = await sendAlertsToAllUsers();
  console.log(JSON.stringify(result));
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
