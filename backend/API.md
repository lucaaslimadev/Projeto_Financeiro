# API - Projeto Financeiro

Base URL: `http://localhost:3001/api/v1`

Todas as rotas protegidas exigem o header: `Authorization: Bearer <token>` (token retornado no login/registro).

---

## Autenticação

### POST /auth/register

**Requisição:**
```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "password": "123456"
}
```

**Resposta (201):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "maria@email.com",
    "createdAt": "2025-02-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login

**Requisição:**
```json
{
  "email": "maria@email.com",
  "password": "123456"
}
```

**Resposta (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Maria Silva",
    "email": "maria@email.com",
    "createdAt": "2025-02-15T12:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Cartões

### POST /cards

**Requisição:**
```json
{
  "name": "Nubank",
  "limit": 5000,
  "closingDay": 15,
  "dueDay": 22
}
```

**Resposta (201):** objeto do cartão criado (id, userId, name, limit, closingDay, dueDay, createdAt, updatedAt).

### GET /cards

**Resposta (200):** array de cartões do usuário.

### PATCH /cards/:id

**Requisição (todos opcionais):**
```json
{
  "name": "Nubank Black",
  "limit": 8000,
  "closingDay": 12,
  "dueDay": 19
}
```

**Resposta (200):** cartão atualizado.

---

## Transações

### POST /transactions/simple

Transação simples (fixa, variável ou cartão, uma única vez).

**Requisição:**
```json
{
  "description": "Supermercado",
  "amount": -350,
  "type": "VARIABLE",
  "category": "Alimentação",
  "dueDate": "2025-02-20",
  "cardId": null
}
```

`type`: `FIXED` | `VARIABLE` | `CARD`. Se `CARD`, informe `cardId`.

**Resposta (201):** transação criada.

### POST /transactions/recurring-fixed

Conta fixa recorrente (ex.: aluguel).

**Requisição:**
```json
{
  "description": "Aluguel",
  "amount": 1200,
  "category": "Moradia",
  "recurringDay": 10
}
```

Cria uma transação no mês atual com vencimento no dia `recurringDay`. Valor é armazenado como negativo (despesa).

**Resposta (201):** transação criada.

### POST /transactions/variable

Despesa variável.

**Requisição:**
```json
{
  "description": "Posto - gasolina",
  "amount": -200,
  "category": "Transporte",
  "dueDate": "2025-02-15"
}
```

**Resposta (201):** transação criada.

### POST /transactions/installment-card

Compra parcelada no cartão (gera N transações, uma por parcela).

**Requisição:**
```json
{
  "description": "Notebook",
  "totalAmount": 3600,
  "installments": 12,
  "dueDay": 22,
  "cardId": "uuid-do-cartao",
  "category": "Tecnologia"
}
```

**Resposta (201):**
```json
{
  "count": 12,
  "message": "Parcelas criadas com sucesso"
}
```

### GET /transactions?year=2025&month=2

Lista transações do mês (requer `year` e `month`).

**Resposta (200):** array de transações (com `card` quando houver).

### PATCH /transactions/:id/paid

Marca transação como paga.

**Resposta (200):** transação atualizada.

### DELETE /transactions/:id

Exclui a transação.

**Resposta (200):** `{ "deleted": true }`.

---

## Dashboard

### GET /dashboard/balance

Retorna o saldo atual da conta corrente do usuário.

**Resposta (200):**
```json
{
  "balance": 1500.00
}
```

### PATCH /dashboard/balance

Atualiza o saldo (conciliação). Se o novo valor for diferente do atual, cria uma transação do tipo `ADJUSTMENT` com a diferença.

**Requisição:**
```json
{
  "balance": 2000.00,
  "paymentMethod": "PIX"
}
```

`paymentMethod` é opcional: `DEBIT` | `PIX` | `CASH`.

**Resposta (200):**
```json
{
  "balance": 2000.00
}
```

### GET /dashboard/bills-due?year=2025&month=2

Contas a vencer no mês (não pagas, vencimento a partir de hoje até o fim do mês).

**Resposta (200):** array de transações.

### GET /dashboard/overdue

Contas atrasadas (não pagas com vencimento anterior a hoje).

**Resposta (200):** array de transações.

### GET /dashboard/month-total?year=2025&month=2

Total do mês (soma de todas as transações do mês).

**Resposta (200):**
```json
{
  "total": -1250.50,
  "year": 2025,
  "month": 2
}
```

### GET /dashboard/invoice-by-card?year=2025&month=2

Fatura atual por cartão (soma das transações não pagas do tipo CARD no mês).

**Resposta (200):**
```json
[
  {
    "cardId": "uuid",
    "cardName": "Nubank",
    "closingDay": 15,
    "dueDay": 22,
    "totalUnpaid": -1250.00,
    "period": { "year": 2025, "month": 2 }
  }
]
```

### GET /dashboard/alerts

Alertas do dia: contas vencendo hoje, atrasadas e faturas fechadas (cartão cujo dia de fechamento já passou no mês).

**Resposta (200):**
```json
{
  "dueToday": [
    { "id": "uuid", "description": "Aluguel", "amount": -1200, "dueDate": "2025-02-13T00:00:00.000Z", "card": null }
  ],
  "overdue": [
    { "id": "uuid", "description": "Conta luz", "amount": -150, "dueDate": "2025-02-10T00:00:00.000Z", "card": null }
  ],
  "invoiceClosed": [
    { "cardName": "Nubank", "totalUnpaid": -800, "dueDay": 22, "closingDay": 15 }
  ]
}
```

---

## Metas por categoria (Goals)

### GET /goals?year=2025&month=2

Lista categorias com gasto no mês e meta mensal (quando existir). Parâmetros `year` e `month` são opcionais (padrão: mês atual).

**Resposta (200):**
```json
[
  { "category": "Transporte", "spent": 350.00, "limit": 500.00 },
  { "category": "Alimentação", "spent": 800.00, "limit": null }
]
```

### POST /goals

Define ou atualiza a meta mensal para uma categoria.

**Requisição:**
```json
{
  "category": "Transporte",
  "monthlyLimit": 500
}
```

**Resposta (204):** sem corpo.

### DELETE /goals

Remove a meta de uma categoria. Body com a categoria a remover.

**Requisição:**
```json
{
  "category": "Transporte"
}
```

**Resposta (204):** sem corpo.

---

## Erros comuns

- **400** – Validação (Zod): body ou query inválidos. Resposta inclui `details` com os campos.
- **401** – Token ausente ou inválido.
- **404** – Recurso não encontrado (cartão ou transação de outro usuário).
- **409** – E-mail já cadastrado (registro).
