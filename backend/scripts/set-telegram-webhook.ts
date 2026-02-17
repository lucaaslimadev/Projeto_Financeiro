/**
 * Registra a URL do webhook no Telegram para o bot receber mensagens.
 * Rode após subir o backend (e o ngrok, se local).
 *
 * Uso:
 *   npm run telegram:webhook              # usa TELEGRAM_WEBHOOK_URL do .env
 *   npm run telegram:webhook:info          # só exibe webhook atual
 *   npm run telegram:webhook:delete        # remove webhook
 */
import { resolve } from 'path';
import { config as loadEnv } from 'dotenv';

// Carrega .env do backend (rodando de backend/ ou da raiz do monorepo)
loadEnv({ path: resolve(process.cwd(), 'backend', '.env') });
loadEnv({ path: resolve(process.cwd(), '.env') });
import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim();
const cmd = process.argv[2];

if (!token) {
  console.error('Defina TELEGRAM_BOT_TOKEN no .env do backend.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function main() {
  if (cmd === 'info') {
    const info = await bot.getWebHookInfo();
    console.log('Webhook atual:', info.url || '(nenhum)');
    if (info.pending_update_count) console.log('Updates pendentes:', info.pending_update_count);
    return;
  }

  if (cmd === 'delete') {
    await bot.deleteWebHook();
    console.log('Webhook removido.');
    return;
  }

  if (!webhookUrl) {
    console.error('Defina TELEGRAM_WEBHOOK_URL no .env (ex: https://seu-ngrok.ngrok-free.app/api/v1/webhook/telegram)');
    process.exit(1);
  }

  await bot.setWebHook(webhookUrl);
  console.log('Webhook registrado:', webhookUrl);
  console.log('Envie uma mensagem para o bot no Telegram para testar.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
