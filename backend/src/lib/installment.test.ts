import { describe, it, expect } from 'vitest';
import {
  toCents,
  fromCents,
  splitAmountEqually,
  getDueDateForInstallment,
  getFirstDueDateFromCardClosing,
  buildInstallmentItems,
} from './installment.js';

describe('toCents', () => {
  it('converte reais para centavos (inteiro)', () => {
    expect(toCents(10)).toBe(1000);
    expect(toCents(10.01)).toBe(1001);
    expect(toCents(0.01)).toBe(1);
    expect(toCents(99.99)).toBe(9999);
  });

  it('arredonda corretamente', () => {
    expect(toCents(10.005)).toBe(1001);
    expect(toCents(10.004)).toBe(1000);
  });
});

describe('fromCents', () => {
  it('converte centavos para reais com 2 decimais', () => {
    expect(fromCents(1000)).toBe(10);
    expect(fromCents(1001)).toBe(10.01);
    expect(fromCents(1)).toBe(0.01);
  });
});

describe('splitAmountEqually', () => {
  it('divide valor igualmente quando divisível', () => {
    const amounts = splitAmountEqually(1200, 3); // 120000 centavos / 3 = 40000 cada
    expect(amounts).toHaveLength(3);
    expect(amounts.every((c) => c === -40000)).toBe(true);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(-120000);
  });

  it('distribui resto nas primeiras parcelas (1 centavo a mais)', () => {
    // 1000 centavos / 3 = 333 cada, resto 1 -> primeira parcela 334, outras 333
    const amounts = splitAmountEqually(10, 3); // 10 reais = 1000 centavos
    expect(amounts).toHaveLength(3);
    expect(amounts[0]).toBe(-334);
    expect(amounts[1]).toBe(-333);
    expect(amounts[2]).toBe(-333);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(-1000);
  });

  it('soma das parcelas igual ao total (precisão financeira)', () => {
    const total = 3599.99; // valor que gera resto
    const n = 12;
    const amounts = splitAmountEqually(total, n);
    expect(amounts).toHaveLength(n);
    const totalCents = Math.round(total * 100);
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(-totalCents);
  });

  it('rejeita installments < 2', () => {
    expect(() => splitAmountEqually(100, 1)).toThrow('installments deve ser >= 2');
  });

  it('rejeita total zero', () => {
    expect(() => splitAmountEqually(0, 3)).toThrow('totalAmount deve ser positivo');
  });
});

describe('getDueDateForInstallment', () => {
  it('primeira parcela não cai no passado (dia 10 já passou em jan)', () => {
    const start = new Date(2025, 0, 15); // 15 jan 2025; dia 10 já passou
    const d0 = getDueDateForInstallment(start, 0, 10);
    const d1 = getDueDateForInstallment(start, 1, 10);
    const d2 = getDueDateForInstallment(start, 2, 10);
    expect(d0.getFullYear()).toBe(2025);
    expect(d0.getMonth()).toBe(1); // fev (próximo dia 10)
    expect(d0.getDate()).toBe(10);
    expect(d1.getMonth()).toBe(2);
    expect(d1.getDate()).toBe(10);
    expect(d2.getMonth()).toBe(3);
    expect(d2.getDate()).toBe(10);
  });

  it('quando dia de vencimento ainda não passou, primeira parcela é no mês atual', () => {
    const start = new Date(2025, 0, 5); // 5 jan; dia 10 ainda não passou
    const d0 = getDueDateForInstallment(start, 0, 10);
    expect(d0.getMonth()).toBe(0);
    expect(d0.getDate()).toBe(10);
  });

  it('ajusta dia quando mês tem menos dias (ex: 31 em fev)', () => {
    const start = new Date(2025, 0, 1); // jan 2025
    const feb = getDueDateForInstallment(start, 1, 31); // fev tem 28 dias
    expect(feb.getMonth()).toBe(1);
    expect(feb.getDate()).toBe(28);
  });

  it('mantém dia 15 em todos os meses quando possível', () => {
    const start = new Date(2025, 0, 1); // dia 1; dia 15 ainda não passou
    for (let i = 0; i < 12; i++) {
      const d = getDueDateForInstallment(start, i, 15);
      expect(d.getDate()).toBe(15);
      expect(d.getMonth()).toBe(i);
    }
  });
});

describe('getFirstDueDateFromCardClosing', () => {
  it('compra depois do fechamento: 1ª parcela na próxima fatura (cartão fecha 5, vence 10)', () => {
    const purchase = new Date(2025, 1, 15); // 15 fev
    const d = getFirstDueDateFromCardClosing(purchase, 5, 10);
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(2); // março
    expect(d.getDate()).toBe(10);
  });

  it('compra antes do fechamento: 1ª parcela na fatura deste mês', () => {
    const purchase = new Date(2025, 1, 3); // 3 fev; fechamento dia 5
    const d = getFirstDueDateFromCardClosing(purchase, 5, 10);
    expect(d.getMonth()).toBe(1); // fev
    expect(d.getDate()).toBe(10);
  });
});

describe('buildInstallmentItems', () => {
  it('retorna N itens com installment_number 1..N e installment_total N', () => {
    const items = buildInstallmentItems({
      totalAmount: 1200,
      installments: 4,
      dueDay: 22,
      startDate: new Date(2025, 0, 1),
    });
    expect(items).toHaveLength(4);
    expect(items.map((i) => i.installmentNumber)).toEqual([1, 2, 3, 4]);
    expect(items.every((i) => i.installmentTotal === 4)).toBe(true);
  });

  it('valores somam exatamente o total (em centavos)', () => {
    const items = buildInstallmentItems({
      totalAmount: 100.01,
      installments: 7,
      dueDay: 10,
      startDate: new Date(2025, 0, 1),
    });
    const sumCents = items.reduce((a, i) => a + i.amountCents, 0);
    expect(sumCents).toBe(-10001); // -100.01 em centavos
  });

  it('due_date incrementa mês a mês com dueDay correto', () => {
    const items = buildInstallmentItems({
      totalAmount: 100,
      installments: 3,
      dueDay: 5,
      startDate: new Date(2025, 0, 1), // dia 1; dia 5 ainda não passou
    });
    expect(items[0].dueDate.getDate()).toBe(5);
    expect(items[0].dueDate.getMonth()).toBe(0);
    expect(items[1].dueDate.getDate()).toBe(5);
    expect(items[1].dueDate.getMonth()).toBe(1);
    expect(items[2].dueDate.getDate()).toBe(5);
    expect(items[2].dueDate.getMonth()).toBe(2);
  });

  it('todos os amountCents são negativos (despesa)', () => {
    const items = buildInstallmentItems({
      totalAmount: 50,
      installments: 2,
      dueDay: 15,
      startDate: new Date(2025, 0, 1),
    });
    expect(items.every((i) => i.amountCents < 0)).toBe(true);
  });
});
