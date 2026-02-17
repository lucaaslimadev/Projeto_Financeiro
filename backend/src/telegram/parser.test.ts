import { describe, it, expect } from 'vitest';
import { parseMessage } from './parser.js';

describe('parseMessage', () => {
  it('"100 gasolina" → despesa variável hoje', () => {
    const r = parseMessage('100 gasolina');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('variable');
    if (r!.type === 'variable') {
      expect(r.amount).toBe(100);
      expect(r.description).toBe('gasolina');
    }
  });

  it('"1200 aluguel dia 5" → conta fixa recorrente', () => {
    const r = parseMessage('1200 aluguel dia 5');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('recurring');
    if (r!.type === 'recurring') {
      expect(r.amount).toBe(1200);
      expect(r.description).toBe('aluguel');
      expect(r.recurringDay).toBe(5);
    }
  });

  it('"1000 em 10x no cartao dia 10" → compra parcelada', () => {
    const r = parseMessage('1000 em 10x no cartao dia 10');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('installment');
    if (r!.type === 'installment') {
      expect(r.amount).toBe(1000);
      expect(r.installments).toBe(10);
      expect(r.dueDay).toBe(10);
    }
  });

  it('"1000 10x cartao mercado pago" → parcelado com cartão no nome', () => {
    const r = parseMessage('1000 10x cartao mercado pago');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('installment');
    if (r!.type === 'installment') {
      expect(r.amount).toBe(1000);
      expect(r.installments).toBe(10);
      expect(r.cardName).toBe('mercado pago');
      expect(r.description).toBe('mercado pago');
      expect(r.dueDay).toBe(10); // padrão quando não informa dia
    }
  });

  it('"500 3x mercado pago" → parcelado sem palavra "cartão"', () => {
    const r = parseMessage('500 3x mercado pago');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('installment');
    if (r!.type === 'installment') {
      expect(r.amount).toBe(500);
      expect(r.installments).toBe(3);
      expect(r.cardName).toBe('mercado pago');
    }
  });

  it('aceita "no cartão" e valor com vírgula', () => {
    const r = parseMessage('99,50 mercado');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('variable');
    if (r!.type === 'variable') {
      expect(r.amount).toBe(99.5);
      expect(r.description).toBe('mercado');
    }
  });

  it('retorna null para texto vazio ou sem valor no início', () => {
    expect(parseMessage('')).toBeNull();
    expect(parseMessage('gasolina')).toBeNull();
    expect(parseMessage('   ')).toBeNull();
  });

  it('"200 farmacia debito" → variável com paymentMethod DEBIT', () => {
    const r = parseMessage('200 farmacia debito');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('variable');
    if (r!.type === 'variable') {
      expect(r.amount).toBe(200);
      expect(r.description).toBe('farmacia');
      expect(r.paymentMethod).toBe('DEBIT');
    }
  });

  it('"200 farmacia pix" → variável com paymentMethod PIX', () => {
    const r = parseMessage('200 farmacia pix');
    expect(r).not.toBeNull();
    expect(r!.type).toBe('variable');
    if (r!.type === 'variable') {
      expect(r.description).toBe('farmacia');
      expect(r.paymentMethod).toBe('PIX');
    }
  });

  it('"150 comida dinheiro" → variável com paymentMethod CASH', () => {
    const r = parseMessage('150 comida dinheiro');
    expect(r).not.toBeNull();
    expect(r!.type === 'variable' && r.paymentMethod === 'CASH').toBe(true);
  });

  it('"80 ifood credito" → variável com paymentMethod CREDIT', () => {
    const r = parseMessage('80 ifood credito');
    expect(r).not.toBeNull();
    expect(r!.type === 'variable' && r.paymentMethod === 'CREDIT').toBe(true);
  });
});
