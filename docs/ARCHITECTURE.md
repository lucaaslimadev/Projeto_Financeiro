# Arquitetura do Projeto Financeiro

Este documento descreve a arquitetura de alto nível do sistema, decisões técnicas e fluxos principais. Para detalhes de implementação e arquivos, consulte [VISAO_GERAL_DO_PROJETO.md](./VISAO_GERAL_DO_PROJETO.md).

---

## Visão geral do sistema

O Projeto Financeiro é um **monorepo** com três partes principais:

1. **Frontend** — aplicação Next.js (React) que consome a API e exibe o dashboard e as telas de gestão.
2. **Backend** — API REST em Node.js (Express + TypeScript) que orquestra a lógica de negócio e persiste dados via Prisma.
3. **Banco de dados** — PostgreSQL, acessado exclusivamente pelo backend através do Prisma ORM.

Opcionalmente, o backend integra-se à **API do Telegram** (webhook para receber mensagens e envio de alertas).

---

## Diagrama de componentes

```
                    ┌──────────────────────────────────────────┐
                    │              USUÁRIO                      │
                    └───────────────────┬──────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│   Navegador     │           │  App Next.js     │           │  Bot Telegram    │
│   (Frontend     │           │  (React, SWR,    │           │  (mensagens     │
│   Next.js)      │           │  Tailwind)       │           │  do usuário)    │
└────────┬────────┘           └────────┬────────┘           └────────┬────────┘
         │                             │                             │
         │ HTTP (REST)                  │                             │ Webhook (POST)
         │ Authorization: Bearer       │                             │
         ▼                             ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express + TypeScript)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Middlewares │  │  Controllers│  │  Services   │  │  Repositories       │ │
│  │ auth,       │  │  (rotas)    │  │  (regras    │  │  (Prisma / DB)      │ │
│  │ validate,   │  │             │  │   de negócio)│  │                     │ │
│  │ rateLimit   │  │             │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┬──────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │ Jobs (node-cron): recurring (transações do mês),             │            │
│  │                   alerts-telegram (alertas no Telegram)     │            │
│  └─────────────────────────────────────────────────────────────┘            │
└────────────────────────────────────────────────────────────┬────────────────┘
                                                              │
                                                              ▼
                                                    ┌─────────────────┐
                                                    │   PostgreSQL    │
                                                    │   (Prisma ORM)  │
                                                    └─────────────────┘
```

---

## Fluxo de uma requisição HTTP (backend)

1. **Entrada** — Requisição chega ao Express montado em `app.ts`, com prefixo `/api/v1`.
2. **Roteamento** — `routes/index.ts` direciona para o módulo correto (auth, cards, transactions, dashboard, goals, telegram).
3. **Autenticação** — Em rotas protegidas, `authMiddleware` valida o JWT no header `Authorization: Bearer <token>` e preenche `req.user` (userId, email).
4. **Validação** — Onde houver body ou query, middlewares com Zod (`validateBody` / `validateQuery`) garantem o formato dos dados.
5. **Controller** — O controller da rota chama o service correspondente.
6. **Service** — Contém a lógica de negócio e usa os repositories para acessar o banco.
7. **Repository** — Camada de acesso a dados (Prisma); abstrai queries e retorna entidades.
8. **Resposta** — Controller devolve JSON. Em caso de erro, o `errorHandler` centralizado formata a resposta de erro (4xx/5xx).

---

## Modelo de dados (resumo)

- **User** — Identificação, credenciais (email + hash de senha), saldo (`balance`), vínculo ao Telegram (`telegramId`, `telegramLinkCode`).
- **Card** — Cartão de crédito: nome, limite, dia de fechamento, dia de vencimento; pertence a um usuário.
- **Transaction** — Lançamento financeiro: descrição, valor, tipo (FIXED, VARIABLE, CARD, INCOME, ADJUSTMENT), categoria, data de vencimento, pago ou não, recorrência (opcional), parcelas (opcional), forma de pagamento (opcional).
- **CategoryGoal** — Meta mensal por categoria (ex.: teto para "Transporte"); um registro por (usuário, categoria).

Transações do tipo **ADJUSTMENT** são criadas automaticamente quando o saldo do usuário é alterado (conciliação).

---

## Jobs agendados (cron)

Executados no processo do backend após o servidor subir (`index.ts`):

| Job | Frequência | Responsabilidade |
|-----|------------|-------------------|
| **recurring.job** | Diária (configurável) | Busca transações modelo com `recurring = true` e `recurringDay`; para cada uma, verifica se já existe a recorrência no mês atual e, se não, cria a transação do mês. |
| **alerts-telegram.job** | Diária (configurável) | Para usuários com `telegramId` preenchido, envia mensagens com: contas vencendo hoje, contas atrasadas e faturas fechadas (cartões cujo dia de fechamento já passou no mês). |

Ambos podem ser desativados via variáveis de ambiente (`CRON_RECURRING_DISABLED`, `CRON_ALERTS_TELEGRAM_DISABLED`).

---

## Frontend: autenticação e dados

- **AuthProvider** — Context que mantém `user` e `token` (inicializados a partir do `localStorage`). Expõe `login`, `register` e `logout`.
- **API (axios)** — Instância configurada com `baseURL = NEXT_PUBLIC_API_URL`. Interceptor adiciona `Authorization: Bearer <token>`; em resposta 401 (exceto em login/register), limpa armazenamento e redireciona para `/login`.
- **SWR** — Hooks (`use-dashboard`, `use-transactions`, `use-cards`, `use-goals`) fazem cache e revalidação dos dados; mutations atualizam as chaves relevantes para refletir alterações na UI.

Rotas em `(dashboard)/` são protegidas: se não houver usuário logado (após carregar o estado), o usuário é redirecionado para `/login`.

---

## Segurança e boas práticas

- **Senhas** — Armazenadas com hash (bcrypt) no backend.
- **JWT** — Token assinado com `JWT_SECRET`; em produção usar segredo forte e nunca versionado.
- **Rate limiting** — Aplicado no Express para mitigar abuso.
- **Helmet** — Headers de segurança HTTP configurados no Express.
- **CORS** — Origin permitida configurada via variável de ambiente.
- **Validação** — Entrada validada com Zod antes de atingir a lógica de negócio.
- **Isolamento por usuário** — Queries filtram sempre por `userId` (via `req.user`) para garantir que um usuário acesse apenas seus próprios dados.

---

## Documentos relacionados

- [README.md](../README.md) — Visão geral, instalação, scripts e uso.
- [VISAO_GERAL_DO_PROJETO.md](./VISAO_GERAL_DO_PROJETO.md) — Mapa do código, rotas, jobs e Telegram.
- [backend/API.md](../backend/API.md) — Especificação dos endpoints da API.
