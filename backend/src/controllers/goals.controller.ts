import { Request, Response } from 'express';
import { goalsService } from '../services/goals.service.js';

export const goalsController = {
  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const list = await goalsService.getCategoriesWithSpendingAndGoals(
      req.user.userId,
      year,
      month
    );
    res.json(list);
  },

  async setGoal(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }
    const category = String(req.body?.category ?? '').trim();
    const monthlyLimit = Number(req.body?.monthlyLimit);
    if (!category) {
      res.status(400).json({ error: 'Categoria é obrigatória' });
      return;
    }
    if (!Number.isFinite(monthlyLimit) || monthlyLimit < 0) {
      res.status(400).json({ error: 'Meta deve ser um número não negativo' });
      return;
    }
    await goalsService.setGoal(req.user.userId, category, monthlyLimit);
    res.status(204).send();
  },

  async removeGoal(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado' });
      return;
    }
    const category = String(req.body?.category ?? '').trim();
    if (!category) {
      res.status(400).json({ error: 'Categoria é obrigatória' });
      return;
    }
    await goalsService.removeGoal(req.user.userId, category);
    res.status(204).send();
  },
};
