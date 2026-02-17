import { Router, Request, Response } from 'express';
import { handleTelegramMessage } from '../telegram/handler.js';
import { sendTelegramMessage } from '../telegram/client.js';

const router = Router();

/**
 * Webhook recebido pelo Telegram (POST).
 * Body: Update do Telegram (message, callback_query, etc).
 * Responde 200 rápido e processa a mensagem; envia a resposta ao usuário via sendMessage.
 */
router.post('/webhook/telegram', async (req: Request, res: Response) => {
  const body = req.body as {
    update_id?: number;
    message?: {
      from?: { id: number };
      chat?: { id: number };
      text?: string;
    };
  };

  // Log imediato: confirma se a requisição do Telegram chegou ao backend
  console.log('[Telegram] Webhook POST recebido, update_id:', body?.update_id);

  // Resposta 200 imediata para o Telegram não reenviar
  res.sendStatus(200);

  const message = body?.message;
  if (!message?.text || message.from?.id == null || message.chat?.id == null) {
    if (body?.update_id != null) {
      console.log('[Telegram] Update ignorado (sem message.text ou from/chat):', body.update_id);
    }
    return;
  }

  const telegramId = String(message.from.id);
  const chatId = message.chat.id;
  const text = message.text.trim();

  if (!text) {
    return;
  }

  try {
    console.log('[Telegram] Mensagem recebida:', { telegramId, text: text.slice(0, 80) });
    const reply = await handleTelegramMessage(telegramId, text);
    await sendTelegramMessage(chatId, reply);
    if (reply.startsWith('Conta não vinculada')) {
      console.log('[Telegram] Usuário não vinculado. Rode: npx tsx scripts/link-telegram.ts', telegramId, '<email>');
    }
    if (reply.startsWith('Não entendi')) {
      console.log('[Telegram] Formato não reconhecido. Texto:', text);
    }
  } catch (err) {
    console.error('[Telegram] Erro ao processar:', err);
    try {
      await sendTelegramMessage(chatId, 'Erro ao processar. Tente de novo.');
    } catch {
      // ignore
    }
  }
});

export const telegramRoutes = router;
