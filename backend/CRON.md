# Job agendado: contas fixas mensais (recorrentes)

Quando uma transação tem `recurring = true` e `recurring_day` preenchido, o job gera automaticamente uma nova transação todo mês, usando `recurring_day` como dia de vencimento. Não duplica se já existir transação no mês para a mesma regra (mesmo usuário, descrição, categoria, valor e dia).

---

## Configuração

### Variáveis de ambiente

No `.env` (raiz ou `backend/`):

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `CRON_RECURRING` | Expressão cron do job (minuto hora dia mês dia-semana) | `0 1 * * *` (1h da manhã, todo dia) |
| `CRON_RECURRING_DISABLED` | `1` ou `true` desativa o job (útil em dev ou se usar cron externo) | — |

### Exemplos de expressão cron

- `0 1 * * *` — todo dia à 1h (recomendado)
- `0 0 * * *` — todo dia à 0h
- `0 6 1 * *` — dia 1 de cada mês às 6h
- `*/15 * * * *` — a cada 15 minutos (só para teste)

O job roda **enquanto o servidor estiver no ar**. Ao iniciar, ele agenda a execução conforme `CRON_RECURRING`; não roda no exato momento do startup (só no próximo horário do cron).

---

## Desativar o job (cron em processo)

Se não quiser o cron dentro do backend (por exemplo, vai usar cron do sistema):

```env
CRON_RECURRING_DISABLED=1
```

Ou deixe `CRON_RECURRING` vazio:

```env
CRON_RECURRING=
```

---

## Rodar uma vez (cron externo ou manual)

Para rodar a geração **uma vez** (sem agendar), use o script:

```bash
cd backend
npm run cron:recurring
```

Saída em JSON, ex.: `{"created":3,"skipped":0}`.

Assim você pode agendar **fora** do processo Node, por exemplo no crontab do servidor:

```bash
# Todo dia às 2h
0 2 * * * cd /caminho/para/Projeto_Financeiro/backend && npm run cron:recurring
```

Nesse caso, configure `CRON_RECURRING_DISABLED=1` para não ter dois agendamentos (um no Node e um no sistema).

---

## Regras da lógica

1. **Quem é “recorrente”:** transações com `recurring = true` e `recurring_day` entre 1 e 31.
2. **Desduplicação:** para cada combinação (usuário + descrição + categoria + valor + `recurring_day`), considera-se **uma regra**. Só é criada **uma** transação por mês por regra.
3. **Vencimento:** a nova transação tem `due_date` = dia `recurring_day` no mês atual (ou último dia do mês se o mês tiver menos dias).
4. **Campos copiados:** `description`, `amount`, `type`, `category`, `recurring = true`, `recurring_day`. `is_paid = false`, `card_id` não é copiado (contas fixas normalmente não são de cartão).

---

## Job: alertas por Telegram

Envio diário de resumo de alertas (contas vencendo hoje, atrasadas, faturas fechadas) para usuários que têm `telegram_id` e `TELEGRAM_BOT_TOKEN` configurado.

### Variáveis

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `CRON_ALERTS_TELEGRAM` | Expressão cron do envio | `0 8 * * *` (8h da manhã) |
| `CRON_ALERTS_TELEGRAM_DISABLED` | `1` ou `true` desativa o job | — |

### Rodar uma vez

```bash
cd backend
npm run cron:alerts-telegram
```

Saída: `{"sent":2,"errors":0}`. Requer `TELEGRAM_BOT_TOKEN` no `.env`.
