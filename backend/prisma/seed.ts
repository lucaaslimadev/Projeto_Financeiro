import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_PASSWORD = '123456';

async function main() {
  console.log('🌱 Iniciando seed...');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);

  // Limpa dados existentes (ordem por dependência)
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.user.deleteMany();

  // --- USUÁRIOS (senha: 123456) ---
  const user1 = await prisma.user.create({
    data: {
      name: 'Maria Silva',
      email: 'maria.silva@email.com',
      passwordHash,
      telegramId: null,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'João Santos',
      email: 'joao.santos@email.com',
      passwordHash,
      telegramId: null,
    },
  });

  const userLucas = await prisma.user.create({
    data: {
      name: 'Lucas Lima',
      email: 'lucas.lima@email.com',
      passwordHash,
      telegramId: '8077221512',
    },
  });

  console.log('✓ Usuários criados:', user1.email, user2.email, userLucas.email);

  // --- CARTÕES (user1) ---
  const card1 = await prisma.card.create({
    data: {
      userId: user1.id,
      name: 'Nubank',
      limit: 5000,
      closingDay: 15,
      dueDay: 22,
    },
  });

  const card2 = await prisma.card.create({
    data: {
      userId: user1.id,
      name: 'Itaú',
      limit: 10000,
      closingDay: 10,
      dueDay: 17,
    },
  });

  console.log('✓ Cartões criados:', card1.name, card2.name);

  // --- TRANSAÇÕES: despesas fixas (user1) ---
  const hoje = new Date();
  const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);

  await prisma.transaction.createMany({
    data: [
      {
        userId: user1.id,
        description: 'Aluguel',
        amount: -1200,
        type: 'FIXED',
        category: 'Moradia',
        dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 10),
        isPaid: true,
        recurring: true,
        recurringDay: 10,
      },
      {
        userId: user1.id,
        description: 'Conta de luz',
        amount: -180,
        type: 'FIXED',
        category: 'Utilidades',
        dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 18),
        isPaid: false,
        recurring: true,
        recurringDay: 18,
      },
      {
        userId: user1.id,
        description: 'Internet',
        amount: -99.9,
        type: 'FIXED',
        category: 'Utilidades',
        dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 25),
        isPaid: false,
        recurring: true,
        recurringDay: 25,
      },
    ],
  });

  // --- TRANSAÇÕES: variáveis (user1) ---
  await prisma.transaction.createMany({
    data: [
      {
        userId: user1.id,
        description: 'Supermercado',
        amount: -350,
        type: 'VARIABLE',
        category: 'Alimentação',
        dueDate: hoje,
        isPaid: true,
      },
      {
        userId: user1.id,
        description: 'Posto - combustível',
        amount: -200,
        type: 'VARIABLE',
        category: 'Transporte',
        dueDate: hoje,
        isPaid: true,
      },
    ],
  });

  // --- TRANSAÇÕES: cartão (user1, Nubank) ---
  await prisma.transaction.createMany({
    data: [
      {
        userId: user1.id,
        cardId: card1.id,
        description: 'Compra Amazon',
        amount: -299.9,
        type: 'CARD',
        category: 'Compras',
        dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 22),
        isPaid: false,
        installmentTotal: 3,
        installmentNumber: 1,
      },
      {
        userId: user1.id,
        cardId: card1.id,
        description: 'Streaming (Netflix + Spotify)',
        amount: -79.9,
        type: 'CARD',
        category: 'Lazer',
        dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 22),
        isPaid: false,
        recurring: true,
        recurringDay: 22,
      },
    ],
  });

  // --- Receita e uma transação para user2 ---
  await prisma.transaction.create({
    data: {
      userId: user1.id,
      description: 'Salário',
      amount: 4500,
      type: 'FIXED',
      category: 'Receita',
      dueDate: new Date(hoje.getFullYear(), hoje.getMonth(), 5),
      isPaid: true,
      recurring: true,
      recurringDay: 5,
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user2.id,
      description: 'Almoço restaurante',
      amount: -85,
      type: 'VARIABLE',
      category: 'Alimentação',
      dueDate: hoje,
      isPaid: true,
    },
  });

  const totalUsers = await prisma.user.count();
  const totalCards = await prisma.card.count();
  const totalTransactions = await prisma.transaction.count();

  console.log('✓ Transações de exemplo criadas.');
  console.log('');
  console.log('📊 Resumo do seed:');
  console.log('   Usuários:', totalUsers);
  console.log('   Cartões:', totalCards);
  console.log('   Transações:', totalTransactions);
  console.log('');
  console.log('🌱 Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
