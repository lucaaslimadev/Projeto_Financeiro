import rateLimit from 'express-rate-limit';

/** Limite para rotas de auth (login/cadastro): reduz brute force e abuso */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máx. 10 requisições por IP na janela
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export { authLimiter };
