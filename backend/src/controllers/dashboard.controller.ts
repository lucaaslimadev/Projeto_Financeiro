import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
  async billsDue(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const list = await dashboardService.getBillsDue(req.user.userId, year, month);
    res.json(list);
  },

  async overdue(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const list = await dashboardService.getOverdue(req.user.userId);
    res.json(list);
  },

  async monthTotal(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const result = await dashboardService.getMonthTotal(req.user.userId, year, month);
    res.json(result);
  },

  async spendingByCategory(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const list = await dashboardService.getSpendingByCategory(req.user.userId, year, month);
    res.json(list);
  },

  async invoiceByCard(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const year = req.query.year ? Number(req.query.year) : undefined;
    const month = req.query.month ? Number(req.query.month) : undefined;
    const list = await dashboardService.getCurrentInvoiceByCard(req.user.userId, year, month);
    res.json(list);
  },

  async alerts(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const data = await dashboardService.getAlerts(req.user.userId);
    res.json(data);
  },

  async getBalance(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const data = await dashboardService.getBalance(req.user.userId);
    res.json(data);
  },

  async updateBalance(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const balance = Number(req.body?.balance);
    if (typeof balance !== 'number' || !Number.isFinite(balance)) {
      res.status(400).json({ error: 'Valor de saldo inválido' });
      return;
    }
    const rawMethod = req.body?.paymentMethod;
    const paymentMethod = rawMethod === 'DEBIT' || rawMethod === 'PIX' || rawMethod === 'CASH' ? rawMethod : undefined;
    const data = await dashboardService.updateBalance(req.user.userId, balance, paymentMethod);
    res.json(data);
  },

  async yearReport(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const year = Number(req.query.year) || new Date().getFullYear();
    const data = await dashboardService.getYearReport(req.user.userId, year);
    res.json(data);
  },
};
