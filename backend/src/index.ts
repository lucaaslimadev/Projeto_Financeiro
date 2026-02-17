import 'dotenv/config';
import { app } from './app.js';
import { config } from './config/index.js';
import { startRecurringJob } from './jobs/recurring.job.js';
import { startAlertsTelegramJob } from './jobs/alerts-telegram.job.js';

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`[Backend] Servidor rodando em http://localhost:${PORT}`);
  console.log(`[Backend] Ambiente: ${config.nodeEnv}`);
  startRecurringJob();
  startAlertsTelegramJob();
});
