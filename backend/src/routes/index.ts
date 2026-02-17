import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { cardRoutes } from './card.routes.js';
import { transactionRoutes } from './transaction.routes.js';
import { dashboardRoutes } from './dashboard.routes.js';
import { goalsRoutes } from './goals.routes.js';
import { telegramRoutes } from './telegram.routes.js';

const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Projeto Financeiro API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      cards: '/cards',
      transactions: '/transactions',
      dashboard: '/dashboard',
    },
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/cards', cardRoutes);
apiRouter.use('/transactions', transactionRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/goals', goalsRoutes);
apiRouter.use('/', telegramRoutes);

export { apiRouter };
