# Visão geral do projeto

Documento de referência após revisão do código: arquitetura, fluxos e arquivos principais.

---

## O que é o projeto

Sistema de **controle financeiro pessoal** em monorepo:

- **Backend:** API REST em Node.js + Express + TypeScript, com Prisma (PostgreSQL).
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui + Recharts.
- **Integração:** Bot do Telegram para registrar despesas por mensagem e alertas diários.

Principais conceitos:

- **Saldo:** `User.balance` = saldo da conta corrente; pode ser ajustado (conciliação) e gera uma transação tipo `ADJUSTMENT`.
- **Transações:** tipos `FIXED`, `VARIABLE`, `CARD`, `INCOME`, `ADJUSTMENT`; contas fixas podem ser recorrentes (job cria as do mês).
- **Cartões:** limite, dia de fechamento e vencimento; transações tipo `CARD` e fatura por período.
- **Alertas:** contas vencendo hoje, atrasadas e faturas fechadas (para notificações e Telegram).

---

## Estrutura de pastas (principais)

```
Projeto_Financeiro/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # User, Card, Transaction, TransactionType
│   │   └── migrations/
│   ├── src/
│   │   ├── app.ts                 # Express, CORS, helmet, apiRouter, errorHandler
│   │   ├── index.ts               # listen + start jobs (recurring, alerts-telegram)
│   │   ├── config/index.ts        # port, apiPrefix, JWT, cron, Telegram
│   │   ├── middlewares/           # auth (JWT), validate (Zod), errorHandler, rateLimit
│   │   ├── routes/                # auth, cards, transactions, dashboard, telegram
│   │   ├── controllers/           # um por rota (chama services)
│   │   ├── services/              # auth, dashboard, transaction, card, recurring, alert-telegram
│   │   ├── repositories/          # user, transaction, card (Prisma)
│   │   ├── validators/            # Zod schemas (auth, transaction, card)
│   │   ├── lib/                   # prisma, installment (parcelas)
│   │   ├── jobs/                  # recurring.job, alerts-telegram.job
│   │   └── telegram/              # handler, parser, client, webhook
│   └── package.json
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root: Providers (Theme + SWR + Auth)
│       │   ├── providers.tsx      # next-themes, SWRConfig, AuthProvider
│       │   ├── (auth)/            # login, register (layout sem sidebar)
│       │   └── (dashboard)/       # layout com sidebar + topbar, páginas protegidas
│       ├── components/            # layout (AppSidebar, Topbar), ui (shadcn), Modal, etc.
│       ├── hooks/                 # use-dashboard, use-transactions, use-cards
│       ├── lib/                   # api (axios + interceptors), auth (context), utils
│       └── types/index.ts        # User, Card, Transaction, AlertsData, etc.
├── docs/
├── docker-compose.yml
└── README.md
```

---

## Backend: fluxo de uma requisição

1. **Entrada:** `app.ts` monta o Express com `config.apiPrefix` (ex.: `/api/v1`) → `apiRouter`.
2. **Rotas:** `routes/index.ts` agrupa `auth`, `cards`, `transactions`, `dashboard`, `telegram`.
3. **Proteção:** rotas (exceto auth) usam `authMiddleware`: lê `Authorization: Bearer <token>`, valida JWT e coloca `req.user` (userId, email).
4. **Validação:** onde há body/query, `validateBody`/`validateQuery` com schemas Zod.
5. **Controller → Service → Repository:** controller chama service; service usa repository (Prisma) e regras de negócio.
6. **Resposta/erro:** resposta JSON; erros passam por `errorHandler`.

---

## Backend: rotas e responsabilidades

| Prefixo | Arquivo | Principais endpoints |
|--------|---------|----------------------|
| `/auth` | auth.routes | POST register, login, telegram-link-code (protegido) |
| `/cards` | card.routes | GET/POST/PATCH /cards |
| `/transactions` | transaction.routes | POST simple, income, recurring-fixed, variable, installment-card; GET / (mês/ano); PATCH /:id/paid; DELETE /:id |
| `/dashboard` | dashboard.routes | GET balance, bills-due, overdue, month-total, invoice-by-card, alerts; PATCH balance |
| (webhook) | telegram.routes | POST webhook/telegram (recebe updates do Telegram) |

- **Saldo (conciliação):** `PATCH /dashboard/balance` atualiza `User.balance` e, se a diferença for não nula, cria uma transação `ADJUSTMENT` com essa diferença (feito em `dashboard.service.updateBalance`).
- **Contas a vencer / atrasadas:** consideram apenas tipos `FIXED` e `CARD` (não variáveis), via `transactionRepository.findBillsDueByUser` e `findBillsOverdueByUser`.

---

## Backend: jobs (cron)

- **recurring.job:** lê transações modelo (recurring + recurringDay), verifica se já existe a recorrência no mês e cria a transação do mês atual (evitando duplicatas).
- **alerts-telegram.job:** envia alertas (vencendo hoje, atrasadas, faturas fechadas) para usuários com Telegram vinculado.

Ambos são iniciados em `index.ts` após o servidor subir.

---

## Backend: Telegram

- **Webhook:** rota recebe POST do Telegram; handler processa mensagens.
- **Vínculo:** usuário gera código no app (Configurações); envia o código no bot → `userRepository.linkTelegram`.
- **Comandos por mensagem:** parser interpreta linhas como:
  - `100 gasolina` → despesa variável hoje;
  - `1200 aluguel dia 5` → conta fixa todo dia 5;
  - `1000 em 10x no cartao dia 10` → parcelado no cartão (usa primeiro cartão ou nome informado).

---

## Frontend: autenticação e API

- **AuthProvider** (`lib/auth.tsx`): estado `user` e `token` vindo do `localStorage`; funções `login`, `register`, `logout` que atualizam storage e estado.
- **api** (`lib/api.ts`): axios com `baseURL` = `NEXT_PUBLIC_API_URL` (ex.: `http://localhost:3011/api/v1`). Interceptor de request adiciona `Authorization: Bearer <token>`; interceptor de response em 401 (exceto login/register) limpa storage e redireciona para `/login`.

---

## Frontend: layout e proteção

- **Root:** `layout.tsx` → `Providers` (ThemeProvider, SWRConfig, AuthProvider).
- **Dashboard:** `(dashboard)/layout.tsx` é client; usa `useAuth()` e `useDashboardBalance()`; se não estiver carregando e não houver `user`, redireciona para `/login`. Renderiza `AppSidebar` (fixa no desktop, Sheet no mobile) e `Topbar` (saldo, nova transação, tema, notificações, avatar).
- **Sidebar:** links para Dashboard, Transações, Cartões, Contas Fixas, Relatórios, Configurações; exibe email e botão Sair.

---

## Frontend: dados e SWR

- **use-dashboard.ts:** hooks SWR para balance, month-total, bills-due, overdue, invoice-by-card, alerts; parâmetros opcionais de mês/ano para filtrar.
- **use-transactions.ts:** lista de transações por mês/ano; `useMarkAsPaid` e `useDeleteTransaction` que chamam a API e fazem `mutate` em chaves `transactions` e `dashboard` para atualizar listas e cards.
- **use-cards.ts:** lista de cartões; create/update com mutate em `cards` e, no update, também em cache do dashboard.

Configuração global do SWR em `providers.tsx`: `revalidateOnFocus`, `revalidateIfStale`, `dedupingInterval`, `errorRetryCount`.

---

## Frontend: páginas principais

- **Dashboard (`/`):** cards (saldo com ajuste, receitas/despesas do mês, contas a vencer, fatura por cartão); seção “Contas a vencer” com botão Pagar; alertas; gráficos (barras por dia, pizza por categoria); tabela de transações recentes; filtro mês/ano; exportar CSV.
- **Transações (`/transactions`):** lista por mês/ano; “Nova transação” com abas Variável, Fixa, Receita, Parcelado (cada uma chama o endpoint correspondente).
- **Contas fixas (`/fixed-bills`):** lista de tipo FIXED; modal para adicionar conta fixa (recurring-fixed).
- **Cartões (`/cards`):** lista e CRUD de cartões.
- **Relatórios (`/reports`):** relatórios/gráficos adicionais.
- **Configurações (`/settings`):** configurações do usuário e vínculo Telegram (código de 6 dígitos).

---

## Tipos de transação (resumo)

| Tipo        | Uso |
|------------|-----|
| FIXED      | Contas fixas (ex.: aluguel, luz); pode ser recurring (job gera mensalmente). |
| VARIABLE   | Despesas variáveis (mercado, combustível). |
| CARD       | Fatura de cartão; parcelas usam installmentTotal/installmentNumber. |
| INCOME     | Receitas (salário, freela). |
| ADJUSTMENT | Ajuste de saldo (conciliação); criado automaticamente ao alterar o saldo. |

---

## Pontos de atenção ao manter/estender

1. **Casing de componentes:** no frontend, componentes UI estão em minúsculo (ex.: `button`, `card`) para evitar conflitos de import.
2. **Portas:** Docker costuma usar backend 3011 e frontend 3010; local pode ser 3001 e 3000. `NEXT_PUBLIC_API_URL` e `config.port`/CORS devem estar alinhados.
3. **Conciliação:** alterar saldo sempre via `PATCH /dashboard/balance` (ou `dashboardService.updateBalance`), para garantir criação da transação ADJUSTMENT.
4. **Contas a vencer/atrasadas:** lógica considera só FIXED e CARD; variáveis não entram nesses alertas.
5. **Telegram:** webhook precisa de URL pública; em dev usar ngrok e configurar `TELEGRAM_WEBHOOK_URL` e rodar `npm run telegram:webhook` no backend.

---

## Documentos relacionados

- **README.md** — configuração, scripts, Docker, Telegram, API.
- **backend/API.md** — detalhes dos endpoints (se existir).
- **docs/SUGESTOES_E_MELHORIAS.md** — ideias de função e UI para diferenciar telas.

Este arquivo serve como mapa do projeto após a revisão do código; use-o para navegar na base e entender onde implementar novas features ou correções.
