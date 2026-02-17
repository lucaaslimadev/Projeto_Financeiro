import { userRepository } from '../repositories/user.repository.js';
import { cardRepository } from '../repositories/card.repository.js';
import { transactionService } from '../services/transaction.service.js';
import { parseMessage } from './parser.js';

/** Fallback só quando não houver descrição; o ideal é usar a palavra que a pessoa escreveu (gasolina, farmácia, aluguel, etc.). */
const FALLBACK_CATEGORY = 'Outros';

/** Data de hoje no fuso local do servidor (YYYY-MM-DD), para não cair como "ontem" em comparações de atraso. */
function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const CODE_REGEX = /^\d{6}$/;

export async function handleTelegramMessage(telegramId: string, text: string): Promise<string> {
  let user = await userRepository.findByTelegramId(telegramId);
  if (!user) {
    const trimmed = text.trim();
    if (CODE_REGEX.test(trimmed)) {
      const userByCode = await userRepository.findByTelegramLinkCode(trimmed);
      if (userByCode) {
        await userRepository.linkTelegram(userByCode.id, telegramId);
        return '✓ Conta vinculada! Agora você pode enviar despesas pelo Telegram. Ex: 100 gasolina';
      }
      return 'Código inválido ou expirado. Gere um novo no app em Configurações > Vincular Telegram.';
    }
    return 'Conta não vinculada. No app, vá em Configurações > Vincular Telegram e envie o código aqui.';
  }

  const parsed = parseMessage(text);
  if (!parsed) {
    return `Não entendi. Exemplos:\n• 100 gasolina → despesa hoje\n• 200 farmácia débito / 200 farmácia pix / 200 farmácia dinheiro\n• 1200 aluguel dia 5 → conta fixa\n• 1000 10x cartao mercado pago → parcelado`;
  }

  try {
    if (parsed.type === 'variable') {
      await transactionService.createVariableExpense(user.id, {
        description: parsed.description,
        amount: -Math.abs(parsed.amount),
        category: parsed.description,
        dueDate: todayLocalISO(),
        paymentMethod: parsed.paymentMethod ?? null,
      });
      const methodLabel = parsed.paymentMethod
        ? { DEBIT: 'débito', PIX: 'PIX', CASH: 'dinheiro', CREDIT: 'crédito' }[parsed.paymentMethod]
        : null;
      const methodText = methodLabel ? ` (${methodLabel})` : '';
      return `✓ Despesa variável: ${parsed.description} R$ ${parsed.amount.toFixed(2)}${methodText}.`;
    }

    if (parsed.type === 'recurring') {
      await transactionService.createRecurringFixed(user.id, {
        description: parsed.description,
        amount: parsed.amount,
        category: parsed.description?.trim() || FALLBACK_CATEGORY,
        recurringDay: parsed.recurringDay,
      });
      return `✓ Conta fixa: ${parsed.description} R$ ${parsed.amount.toFixed(2)} todo dia ${parsed.recurringDay}.`;
    }

    if (parsed.type === 'installment') {
      const cards = await cardRepository.findManyByUserId(user.id);
      const card = parsed.cardName
        ? cards.find((c) => c.name.toLowerCase().includes(parsed.cardName!.toLowerCase()))
        : cards[0];
      if (!card) {
        return 'Cadastre um cartão no app para compras parceladas.';
      }
      await transactionService.createInstallmentCard(user.id, {
        description: parsed.description,
        totalAmount: parsed.amount,
        installments: parsed.installments,
        dueDay: parsed.dueDay,
        cardId: card.id,
        category: parsed.description?.trim() || FALLBACK_CATEGORY,
      });
      const valorParcela = parsed.amount / parsed.installments;
      return `✓ Parcelado no cartão ${card.name}: ${parsed.description}\n` +
        `R$ ${parsed.amount.toFixed(2)} em ${parsed.installments}x = R$ ${valorParcela.toFixed(2)}/mês (venc. dia ${parsed.dueDay}).`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao salvar.';
    return `Erro: ${msg}`;
  }

  return 'Não entendi. Use um dos exemplos da mensagem anterior.';
}
