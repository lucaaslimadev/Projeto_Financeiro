# 💰 Projeto Financeiro

Sistema full-stack de **controle financeiro pessoal** com dashboard, múltiplos tipos de lançamento, cartões de crédito, metas por categoria e integração com **Telegram** para registro de despesas por mensagem e alertas automáticos.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](./DOCKER.md)

---

## 📋 Índice

- [Visão geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e execução](#-instalação-e-execução)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Scripts disponíveis](#-scripts-disponíveis)
- [API e documentação](#-api-e-documentação)
- [Integração Telegram](#-integração-telegram)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Licença](#-licença)

---

## 🎯 Visão geral

O **Projeto Financeiro** é um monorepo que oferece:

- **Backend:** API REST em Node.js com Express e TypeScript, autenticação JWT, validação com Zod e ORM Prisma (PostgreSQL).
- **Frontend:** Interface moderna em Next.js 14 (App Router), React, Tailwind CSS e componentes acessíveis, com dashboard interativo e gráficos (Recharts).
- **Integração:** Bot no Telegram para lançar despesas por mensagem de texto e receber alertas de vencimento e faturas.

O sistema suporta **múltiplos usuários**, cada um com seu saldo, cartões, transações e metas por categoria. Contas fixas podem ser **recorrentes** (geradas automaticamente todo mês por um job agendado), e compras no cartão podem ser **parceladas** com geração automática das parcelas.

---

## ✨ Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Autenticação** | Registro, login com JWT e vínculo da conta ao Telegram via código de 6 dígitos. |
| **Saldo** | Saldo da conta corrente com conciliação (ajuste gera transação tipo `ADJUSTMENT`). |
| **Transações** | Lançamentos **fixos**, **variáveis**, **receitas**, **cartão** e **parcelados**; filtro por mês/ano; marcar como pago e excluir. |
| **Contas fixas** | Contas recorrentes com dia de vencimento (ex.: aluguel dia 10); job cria a transação do mês automaticamente. |
| **Cartões** | CRUD de cartões (limite, dia de fechamento e vencimento); visão de fatura por cartão e alertas de fatura fechada. |
| **Dashboard** | Saldo, totais do mês (receitas/despesas), contas a vencer, atrasadas, faturas por cartão, alertas e gráficos (barras por dia, pizza por categoria). |
| **Metas por categoria** | Tetos mensais por categoria (ex.: combustível, mercado) com acompanhamento no dashboard. |
| **Relatórios** | Visualização e exportação (CSV/PDF) de dados do período. |
| **Telegram** | Envio de mensagens no bot para registrar despesa variável, conta fixa ou compra parcelada; alertas diários (vencendo hoje, atrasadas, faturas). |

---

## 🛠 Stack tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Backend** | Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT (jsonwebtoken), bcrypt, Zod, node-cron, node-telegram-bot-api, Helmet, CORS, express-rate-limit |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI (shadcn-style), Recharts, SWR, Axios, next-themes, jspdf, Sonner |
| **Banco de dados** | PostgreSQL 16 (Docker ou local) |
| **Infraestrutura** | Docker e Docker Compose (PostgreSQL, backend e frontend containerizados) |

---

## 🏗 Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │     │   PostgreSQL    │
│   Next.js       │────▶│   Express       │────▶│   Prisma ORM    │
│   (porta 3000)  │     │   (porta 3001)  │     │   (porta 5434)  │
└────────┬────────┘     └────────┬────────┘     └─────────────────┘
         │                       │
         │                       │ Webhook
         │                       ▼
         │               ┌─────────────────┐
         │               │   Telegram API  │
         └───────────────│   (bot + alertas)│
                         └─────────────────┘
```

- **Fluxo da requisição (backend):** rota → `authMiddleware` (JWT) → validação (Zod) → controller → service → repository (Prisma) → resposta JSON. Erros tratados por `errorHandler`.
- **Jobs agendados (cron):** geração de transações recorrentes do mês; envio de alertas (vencendo hoje, atrasadas, faturas) para usuários com Telegram vinculado.

Documentação detalhada da arquitetura e fluxos: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

---

## 📦 Pré-requisitos

- **Node.js** >= 18
- **npm** (ou yarn/pnpm)
- **Docker e Docker Compose** (opcional; recomendado para subir todo o ambiente ou apenas o PostgreSQL)

---

## 🚀 Instalação e execução

### 1. Clonar o repositório

```bash
git clone https://github.com/lucaaslimadev/Projeto_Financeiro.git
cd Projeto_Financeiro
```

### 2. Instalar dependências

Na raiz do projeto (monorepo com workspaces):

```bash
npm install
```

### 3. Variáveis de ambiente

Copie o arquivo de exemplo e ajuste os valores conforme seu ambiente:

```bash
cp .env.example .env
```

Edite o `.env` e preencha pelo menos `DATABASE_URL`. Para integração com Telegram, veja [Integração Telegram](#-integração-telegram). **Nunca commite o arquivo `.env`.**

### 4. Banco de dados

**Opção A — Docker (recomendado)**

Subir **todo o sistema** (PostgreSQL + Backend + Frontend):

```bash
docker-compose up --build
```

- Frontend: **http://localhost:3010** (ou `FRONTEND_PORT` definido no `.env`)
- API: **http://localhost:3011** (ou `BACKEND_PORT`)
- Health: `http://localhost:3011/health`

Apenas **PostgreSQL** (desenvolvimento local do backend/frontend):

```bash
npm run docker:up
# ou: docker-compose up -d postgres
```

**Opção B — PostgreSQL local**

Crie um banco chamado `projeto_financeiro` e use a URL em `DATABASE_URL`.

**Gerar cliente Prisma e aplicar migrações**

```bash
npm run db:generate
npm run db:migrate
```

**Dados de exemplo (opcional)**

```bash
npm run db:seed
```

O seed cria usuários (senha: `123456`), cartões e transações de exemplo para testes.

### 5. Executar em desenvolvimento (sem Docker full)

Com o PostgreSQL rodando e as migrações aplicadas:

**Terminal 1 — Backend**

```bash
npm run dev:backend
```

**Terminal 2 — Frontend**

```bash
npm run dev:frontend
```

- Frontend: **http://localhost:3000**
- API: **http://localhost:3001**
- Health: **http://localhost:3001/health**

> **Portas:** em ambiente local (sem Docker) o backend usa 3001 e o frontend 3000. Com `docker-compose up`, o backend usa 3011 e o frontend 3010. Ajuste `NEXT_PUBLIC_API_URL` no `.env` de acordo (ex.: `http://localhost:3001/api/v1` local e `http://localhost:3011/api/v1` com Docker).

---

## 🔐 Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim* | Connection string PostgreSQL (ex.: `postgresql://user:pass@host:5434/projeto_financeiro?schema=public`). *Necessária para o backend; pode estar em `backend/.env` ou na raiz. |
| `NEXT_PUBLIC_API_URL` | Sim (frontend) | URL base da API (ex.: `http://localhost:3001/api/v1` ou `http://localhost:3011/api/v1` com Docker). |
| `JWT_SECRET` | Sim (produção) | Chave secreta para assinatura do JWT. Altere em produção. |
| `JWT_EXPIRES_IN` | Não | Validade do token (padrão: `7d`). |
| `TELEGRAM_BOT_TOKEN` | Não | Token do bot (obter em [@BotFather](https://t.me/BotFather)). Deixe vazio para desativar. |
| `TELEGRAM_WEBHOOK_URL` | Não* | URL pública do webhook (*necessária se usar o bot para receber mensagens). Em dev use [ngrok](https://ngrok.com). |
| `CRON_RECURRING_DISABLED` | Não | `1` desativa o job de transações recorrentes. |
| `CRON_ALERTS_TELEGRAM_DISABLED` | Não | `1` desativa o job de alertas no Telegram. |

Exemplo completo: [.env.example](./.env.example). O script `npm run db:migrate` copia o `.env` da raiz para `backend/.env` quando aplicável.

---

## 📜 Scripts disponíveis

Na **raiz** do projeto:

| Script | Descrição |
|--------|-----------|
| `npm run dev:backend` | Inicia o backend em modo desenvolvimento (watch). |
| `npm run dev:frontend` | Inicia o frontend em modo desenvolvimento. |
| `npm run build:backend` | Build do backend (TypeScript → `dist/`). |
| `npm run build:frontend` | Build do frontend (Next.js). |
| `npm run db:generate` | Gera o Prisma Client. |
| `npm run db:migrate` | Aplica migrações em desenvolvimento (interativo para novo nome). |
| `npm run db:studio` | Abre o Prisma Studio para inspeção do banco. |
| `npm run db:seed` | Popula o banco com dados de exemplo. |
| `npm run docker:up` | Sobe os serviços com Docker Compose. |
| `npm run docker:down` | Para os containers. |
| `npm run test` | Executa os testes do backend. |
| `npm run test:watch` | Executa os testes em modo watch. |

No **backend** (ex.: `cd backend`):

| Script | Descrição |
|--------|-----------|
| `npm run telegram:webhook` | Registra a URL do webhook no Telegram. |
| `npm run telegram:webhook:info` | Exibe a URL do webhook atual. |
| `npm run telegram:webhook:delete` | Remove o webhook. |
| `npm run cron:recurring` | Executa uma vez o job de recorrências. |
| `npm run cron:alerts-telegram` | Executa uma vez o job de alertas no Telegram. |

---

## 📚 API e documentação

A API REST está sob o prefixo `/api/v1`. Rotas protegidas exigem o header:

```
Authorization: Bearer <token>
```

**Resumo dos principais endpoints:**

| Recurso | Métodos |
|---------|---------|
| **Auth** | `POST /auth/register`, `POST /auth/login`, `GET /auth/telegram-link-code` (protegido) |
| **Cartões** | `GET /cards`, `POST /cards`, `PATCH /cards/:id` |
| **Transações** | `POST /transactions/simple`, `recurring-fixed`, `variable`, `income`, `installment-card`; `GET /transactions?year=&month=`; `PATCH /:id/paid`, `DELETE /:id` |
| **Dashboard** | `GET /dashboard/balance`, `PATCH /dashboard/balance`, `GET /dashboard/bills-due`, `overdue`, `month-total`, `invoice-by-card`, `alerts`, `spending-by-category`, `year-report` |
| **Metas** | `GET /goals`, `POST /goals`, `PATCH /goals/:id`, `DELETE /goals/:id` |
| **Telegram** | `POST /webhook/telegram` (recebe updates do Telegram) |

Documentação detalhada com exemplos de requisição e resposta: **[backend/API.md](./backend/API.md)**.

---

## 🤖 Integração Telegram

1. **Variáveis:** no `.env` (raiz ou backend), defina `TELEGRAM_BOT_TOKEN` e `TELEGRAM_WEBHOOK_URL` (URL pública; em dev use ngrok apontando para a rota do webhook).
2. **Registrar webhook:** com o backend no ar, execute `cd backend && npm run telegram:webhook`.
3. **Vincular conta:** no app, em **Configurações**, gere o código de vínculo e envie os 6 dígitos no chat do bot no Telegram.
4. **Formato das mensagens (uma linha, valor no início):**

   | Exemplo | Ação |
   |--------|------|
   | `100 gasolina` | Despesa variável R$ 100 (hoje) |
   | `1200 aluguel dia 5` | Conta fixa R$ 1.200 todo dia 5 |
   | `1000 em 10x no cartao dia 10` | Compra parcelada no cartão (10x, dia 10) |

Mais detalhes: [backend/TELEGRAM.md](./backend/TELEGRAM.md) e [backend/PRÓXIMOS_PASSOS_WEBHOOK.md](./backend/PRÓXIMOS_PASSOS_WEBHOOK.md).

---

## 📁 Estrutura do repositório

```
Projeto_Financeiro/
├── backend/                 # API REST (Node.js + Express + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma    # Modelos: User, Card, Transaction, CategoryGoal
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── app.ts           # Configuração Express, CORS, rotas, errorHandler
│   │   ├── index.ts         # Servidor + inicialização dos jobs (cron)
│   │   ├── config/
│   │   ├── middlewares/     # auth (JWT), validate (Zod), rateLimit, errorHandler
│   │   ├── routes/          # auth, cards, transactions, dashboard, goals, telegram
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── validators/
│   │   ├── lib/             # prisma, installment (parcelas)
│   │   ├── jobs/            # recurring.job, alerts-telegram.job
│   │   └── telegram/        # handler, parser, client
│   ├── API.md               # Documentação da API
│   ├── Dockerfile
│   └── package.json
├── frontend/                # Next.js 14 (App Router) + React + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/      # login, register
│   │   │   └── (dashboard)/ # layout com sidebar; páginas protegidas
│   │   ├── components/      # layout (AppSidebar, Topbar), ui, Modal, etc.
│   │   ├── hooks/           # use-dashboard, use-transactions, use-cards, use-goals
│   │   ├── lib/             # api (axios), auth (context)
│   │   └── types/
│   ├── Dockerfile
│   └── package.json
├── database/               # Scripts e documentação do PostgreSQL
├── docs/
│   ├── ARCHITECTURE.md      # Arquitetura e fluxos
│   ├── VISAO_GERAL_DO_PROJETO.md
│   └── ...
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

## 👤 Autor

**Lucas Lima**  
- GitHub: [@lucaaslimadev](https://github.com/lucaaslimadev)  
- Repositório: [Projeto_Financeiro](https://github.com/lucaaslimadev/Projeto_Financeiro)

Projeto desenvolvido para fins de portfólio e estudo em desenvolvimento full-stack.
