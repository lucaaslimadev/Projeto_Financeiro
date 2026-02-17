import { Request, Response } from 'express';
import { cardService } from '../services/card.service.js';

export const cardController = {
  async create(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const card = await cardService.create(req.user.userId, req.body);
    res.status(201).json(card);
  },

  async list(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const cards = await cardService.list(req.user.userId);
    res.json(cards);
  },

  async update(req: Request, res: Response): Promise<void> {
    if (!req.user) { res.status(401).json({ error: 'Não autorizado' }); return; }
    const { id } = req.params;
    const updated = await cardService.update(req.user.userId, id, req.body);
    if (!updated) { res.status(404).json({ error: 'Cartão não encontrado' }); return; }
    res.json(updated);
  },
};
