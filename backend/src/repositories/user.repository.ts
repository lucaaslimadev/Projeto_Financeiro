import { prisma } from '../lib/prisma.js';

export const userRepository = {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, telegramId: true, createdAt: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, telegramId: true, createdAt: true },
    });
  },

  findByTelegramId(telegramId: string) {
    return prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, name: true, email: true, telegramId: true, createdAt: true },
    });
  },

  create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({
      data,
      select: { id: true, name: true, email: true, createdAt: true },
    });
  },

  setTelegramLinkCode(userId: string, code: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { telegramLinkCode: code, telegramLinkCodeExpiresAt: expiresAt },
    });
  },

  findByTelegramLinkCode(code: string) {
    return prisma.user.findFirst({
      where: {
        telegramLinkCode: code,
        telegramLinkCodeExpiresAt: { gt: new Date() },
      },
      select: { id: true, email: true },
    });
  },

  linkTelegram(userId: string, telegramId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        telegramId,
        telegramLinkCode: null,
        telegramLinkCodeExpiresAt: null,
      },
    });
  },
};
