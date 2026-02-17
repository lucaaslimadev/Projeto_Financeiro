import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config/index.js';

let bot: TelegramBot | null = null;

function getBot(): TelegramBot | null {
  if (!config.telegramBotToken) return null;
  if (!bot) {
    bot = new TelegramBot(config.telegramBotToken, { polling: false });
  }
  return bot;
}

export function sendTelegramMessage(chatId: number, text: string): Promise<unknown> {
  const telegramBot = getBot();
  if (!telegramBot) return Promise.reject(new Error('Bot não configurado (TELEGRAM_BOT_TOKEN)'));
  return telegramBot.sendMessage(chatId, text);
}
