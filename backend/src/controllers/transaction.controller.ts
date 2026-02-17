import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service.js';

export const transactionController = {
  async createSimple(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const tx = await transactionService.createSimple(req.user.userId, req.body);
    res.status(201).json(tx);
  },

  async createRecurringFixed(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const tx = await transactionService.createRecurringFixed(req.user.userId, req.body);
    res.status(201).json(tx);
  },

  async createIncome(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const tx = await transactionService.createIncome(req.user.userId, req.body);
    res.status(201).json(tx);
  },

  async createVariableExpense(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const tx = await transactionService.createVariableExpense(req.user.userId, req.body);
    res.status(201).json(tx);
  },

  async createInstallmentCard(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const result = await transactionService.createInstallmentCard(req.user.userId, req.body);
    res.status(201).json(result);
  },

  async listByMonth(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const { year, month } = req.query as { year: string; month: string };
    const list = await transactionService.listByMonth(req.user.userId, {
      year: Number(year),
      month: Number(month),
    });
    res.json(list);
  },

  async markAsPaid(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const { id } = req.params;
    const tx = await transactionService.markAsPaid(req.user.userId, id);
    if (!tx) { res.status(404).json({ error: 'Transação não encontrada' }); return; }
    res.json(tx);
  },

  async delete(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const { id } = req.params;
    const result = await transactionService.delete(req.user.userId, id);
    if (!result) { res.status(404).json({ error: 'Transação não encontrada' }); return; }
    res.json(result);
  },

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const { id } = req.params;
    const tx = await transactionService.update(req.user.userId, id, req.body);
    if (!tx) { res.status(404).json({ error: 'Transação não encontrada' }); return; }
    res.json(tx);
  },
};
