import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const telegramId = process.argv[2] || '8077221512';
  const email = process.argv[3] || 'lucas.lima@email.com';

  // Remove telegram_id de quem tiver esse ID (evitar duplicidade)
  await prisma.user.updateMany({
    where: { telegramId },
    data: { telegramId: null },
  });

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash('123456', 10);
    user = await prisma.user.create({
      data: {
        name: 'Lucas Lima',
        email,
        passwordHash,
        telegramId,
      },
    });
    console.log(`Usuário criado: ${user.email} (senha: 123456)`);
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramId },
    });
    console.log(`Telegram ID ${telegramId} vinculado a: ${user.email}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
