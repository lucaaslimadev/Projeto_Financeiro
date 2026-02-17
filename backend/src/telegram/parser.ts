/**
 * Parser de texto livre para o bot do Telegram.
 * Reconhece: despesa variável (hoje), conta fixa recorrente (dia N), compra parcelada no cartão.
 */

export type PaymentMethodParsed = 'DEBIT' | 'PIX' | 'CASH' | 'CREDIT';

export type ParsedVariable = {
  type: 'variable';
  amount: number;
  description: string;
  paymentMethod?: PaymentMethodParsed;
};

export type ParsedRecurring = {
  type: 'recurring';
  amount: number;
  description: string;
  recurringDay: number;
};

export type ParsedInstallment = {
  type: 'installment';
  amount: number;
  description: string;
  installments: number;
  dueDay: number;
  cardName?: string;
};

export type ParsedResult = ParsedVariable | ParsedRecurring | ParsedInstallment;

/** Normaliza valor: "100" → 100, "100,50" ou "100.50" → 100.5 */
function parseAmount(raw: string): number {
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n) || n <= 0) throw new Error('Valor inválido');
  return Math.round(n * 100) / 100;
}

/** Dia do mês 1-31 */
function parseDay(raw: string): number {
  const d = Number.parseInt(raw, 10);
  if (d < 1 || d > 31) throw new Error('Dia deve ser entre 1 e 31');
  return d;
}

const RE_AMOUNT = /^\s*(\d+(?:[.,]\d{1,2})?)\s+(.+)$/s;
/** Ex: "em 10x" ou "10x" (em opcional) */
const RE_INSTALLMENT = /(?:em\s+)?(\d+)\s*(?:x|vezes)\b/i;
const RE_DAY = /\bdia\s+(\d{1,2})\b/i;
/** Ex: "no cartão Nome" ou "cartao Nome" (no opcional); captura o nome do cartão. */
const RE_CARD = /\b(?:no\s+)?cart[ãa]o(?:\s+([a-z0-9\u00C0-\u024F\s]+))?(?=\s|$)/i;

/** Forma de pagamento no final da mensagem: debito, pix, dinheiro, credito */
const PAYMENT_METHODS: { re: RegExp; method: PaymentMethodParsed }[] = [
  { re: /\s+debito$/i, method: 'DEBIT' },
  { re: /\s+d[eé]bito$/i, method: 'DEBIT' },
  { re: /\s+pix$/i, method: 'PIX' },
  { re: /\s+dinheiro$/i, method: 'CASH' },
  { re: /\s+credito$/i, method: 'CREDIT' },
  { re: /\s+cr[eé]dito$/i, method: 'CREDIT' },
];

function parsePaymentMethod(rest: string): { description: string; paymentMethod?: PaymentMethodParsed } {
  let description = rest.trim();
  let paymentMethod: PaymentMethodParsed | undefined;
  for (const { re, method } of PAYMENT_METHODS) {
    if (re.test(description)) {
      description = description.replace(re, '').trim();
      paymentMethod = method;
      break;
    }
  }
  return { description: description || 'Despesa', paymentMethod };
}

/**
 * Interpreta uma mensagem e retorna o tipo de lançamento e os dados extraídos.
 * Exemplos:
 * - "100 gasolina" → variable
 * - "1200 aluguel dia 5" → recurring
 * - "1000 em 10x no cartao dia 10" → installment
 */
export function parseMessage(text: string): ParsedResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const amountMatch = trimmed.match(RE_AMOUNT);
  if (!amountMatch) return null;

  const [, amountStr, rest] = amountMatch;
  let amount: number;
  try {
    amount = parseAmount(amountStr!);
  } catch {
    return null;
  }

  const restNorm = rest!.trim().replace(/\s+/g, ' ');
  const hasInstallment = RE_INSTALLMENT.test(restNorm);
  const dayMatch = restNorm.match(RE_DAY);
  const cardMatch = restNorm.match(RE_CARD);

  if (hasInstallment) {
    const instMatch = restNorm.match(RE_INSTALLMENT);
    const installments = instMatch ? Math.min(60, Math.max(2, Number.parseInt(instMatch[1], 10))) : 2;
    const day = dayMatch ? parseDay(dayMatch[1]) : 10;
    // Nome do cartão: "cartão X" ou, se não tiver "cartão", o resto após "Nx" (ex: "10x mercado pago")
    let cardName = cardMatch?.[1]?.trim() || undefined;
    const afterInstallment = restNorm
      .replace(RE_INSTALLMENT, ' ')
      .replace(RE_DAY, ' ')
      .replace(RE_CARD, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!cardName && afterInstallment) cardName = afterInstallment;
    const description = cardName || afterInstallment || 'Parcelado';
    return {
      type: 'installment',
      amount,
      description: description || 'Parcelado',
      installments,
      dueDay: day,
      cardName: cardName || undefined,
    };
  }

  if (dayMatch) {
    const recurringDay = parseDay(dayMatch[1]);
    const description = restNorm
      .replace(RE_DAY, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!description) return null;
    return {
      type: 'recurring',
      amount,
      description,
      recurringDay,
    };
  }

  const { description: variableDesc, paymentMethod } = parsePaymentMethod(restNorm);
  return {
    type: 'variable',
    amount,
    description: variableDesc,
    paymentMethod,
  };
}
