import { Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const authController = {
  async telegramLinkCode(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }
    const code = generateSixDigitCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
    await userRepository.setTelegramLinkCode(req.user.userId, code, expiresAt);
    res.json({ code, expiresAt: expiresAt.toISOString() });
  },

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao cadastrar';
      const status = message.includes('já cadastrado') ? 409 : 400;
      if (res.headersSent) return;
      res.status(status).json({ error: message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar';
      res.status(401).json({ error: message });
    }
  },
};
