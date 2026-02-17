/**
 * Lógica de parcelamento com precisão financeira (aritmética em centavos, sem float).
 * - Divide o valor igualmente entre N parcelas
 * - Resto (se houver) é distribuído nas primeiras parcelas (1 centavo por vez)
 * - due_date mês a mês baseado no dia de vencimento
 */

export interface InstallmentItem {
  installmentNumber: number;
  installmentTotal: number;
  amountCents: number; // valor da parcela em centavos (negativo para despesa)
  dueDate: Date;
}

export interface BuildInstallmentsInput {
  /** Valor total (positivo; será convertido para despesa = negativo) */
  totalAmount: number;
  /** Quantidade de parcelas (>= 2) */
  installments: number;
  /** Dia do vencimento da fatura no mês (1-31) */
  dueDay: number;
  /** Mês/ano da compra (data da primeira parcela) */
  startDate: Date;
  /** Quando informado (cartão), primeira parcela = vencimento da próxima fatura (fechamento closingDay, venc. dueDay) */
  closingDay?: number;
}

const CENTS = 100;

/**
 * Converte valor em reais para centavos (inteiro).
 * Evita float: ex. 10.01 -> 1001.
 */
export function toCents(value: number): number {
  return Math.round(value * CENTS);
}

/**
 * Converte centavos para valor em reais (número com 2 decimais).
 * Para persistência em Decimal(12,2).
 */
export function fromCents(cents: number): number {
  return Math.round(cents) / CENTS;
}

/**
 * Divide valor total em centavos igualmente entre N parcelas.
 * O resto (totalCents % N) é distribuído nas primeiras parcelas (1 centavo a mais cada).
 * Retorna array de valores em centavos (todos negativos para despesa).
 */
export function splitAmountEqually(totalAmount: number, installments: number): number[] {
  if (installments < 2) throw new Error('installments deve ser >= 2');
  const totalCents = toCents(Math.abs(totalAmount));
  if (totalCents === 0) throw new Error('totalAmount deve ser positivo');

  const basePerInstallment = Math.floor(totalCents / installments);
  const remainder = totalCents % installments;
  const amounts: number[] = [];

  for (let i = 0; i < installments; i++) {
    const extra = i < remainder ? 1 : 0;
    amounts.push(-(basePerInstallment + extra)); // negativo = despesa
  }

  return amounts;
}

/**
 * Próxima ocorrência do dia de vencimento (dueDay) a partir de startDate.
 * Se o dueDay deste mês ainda não passou → vence este mês; senão → próximo mês.
 */
function getFirstDueDate(startDate: Date, dueDay: number): Date {
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const dayOfMonth = startDate.getDate();
  const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();
  const dueDayInMonth = Math.min(dueDay, lastDayOfCurrentMonth);
  if (dayOfMonth <= dueDayInMonth) {
    return new Date(year, month, dueDayInMonth);
  }
  const nextMonth = month + 1;
  const nextYear = nextMonth > 11 ? year + 1 : year;
  const nextMonthNorm = nextMonth % 12;
  const lastDayNext = new Date(nextYear, nextMonthNorm + 1, 0).getDate();
  return new Date(nextYear, nextMonthNorm, Math.min(dueDay, lastDayNext));
}

/**
 * Data de vencimento da primeira parcela com base no fechamento do cartão.
 * A compra entra na fatura cujo fechamento é o próximo após a data da compra.
 * Ex.: compra 15/fev, cartão fecha dia 5 e vence dia 10 → próxima fatura fecha 5/mar, vence 10/mar.
 */
export function getFirstDueDateFromCardClosing(
  purchaseDate: Date,
  closingDay: number,
  dueDay: number
): Date {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth();
  const dayOfMonth = purchaseDate.getDate();
  let closingMonth = month;
  if (dayOfMonth > closingDay) {
    closingMonth = month + 1;
  }
  const closingYear = closingMonth > 11 ? year + 1 : year;
  const closingMonthNorm = closingMonth % 12;
  const lastDay = new Date(closingYear, closingMonthNorm + 1, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return new Date(closingYear, closingMonthNorm, day);
}

/**
 * Retorna a data de vencimento da parcela de índice `installmentIndex` (0-based).
 * Se closingDay for informado, usa a fatura do cartão (fechamento + vencimento); senão, próximo dueDay.
 */
export function getDueDateForInstallment(
  startDate: Date,
  installmentIndex: number,
  dueDay: number,
  closingDay?: number
): Date {
  const first =
    closingDay != null && closingDay >= 1 && closingDay <= 31
      ? getFirstDueDateFromCardClosing(startDate, closingDay, dueDay)
      : getFirstDueDate(startDate, dueDay);
  if (installmentIndex === 0) return first;
  const year = first.getFullYear();
  const month = first.getMonth() + installmentIndex;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return new Date(year, month, day);
}

/**
 * Monta a lista de parcelas: valor (centavos), dueDate, installmentNumber, installmentTotal.
 * Se closingDay for informado (cartão), a 1ª parcela vence no vencimento da próxima fatura.
 */
export function buildInstallmentItems(input: BuildInstallmentsInput): InstallmentItem[] {
  const { totalAmount, installments, dueDay, startDate, closingDay } = input;
  const amountsCents = splitAmountEqually(totalAmount, installments);
  const items: InstallmentItem[] = [];

  for (let i = 0; i < installments; i++) {
    items.push({
      installmentNumber: i + 1,
      installmentTotal: installments,
      amountCents: amountsCents[i],
      dueDate: getDueDateForInstallment(startDate, i, dueDay, closingDay),
    });
  }

  return items;
}
