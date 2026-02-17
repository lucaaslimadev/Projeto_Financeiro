# Docker — Projeto Financeiro

Este documento descreve como executar o **Projeto Financeiro** com Docker e Docker Compose: arquitetura dos containers, variáveis de ambiente, comandos e troubleshooting.

---

## Visão geral

O `docker-compose.yml` na raiz do projeto define **três serviços**:

1. **postgres** — Banco de dados PostgreSQL 16.
2. **backend** — API REST (Node.js + Express + TypeScript), com Prisma e jobs agendados (cron).
3. **frontend** — Aplicação Next.js (build standalone) que consome a API.

O backend depende do Postgres (healthcheck); o frontend depende do backend. As migrações do Prisma são aplicadas automaticamente na subida do container do backend (`prisma migrate deploy`).

---

## Serviços em detalhe

### postgres

| Item | Valor |
|------|--------|
| **Imagem** | `postgres:16-alpine` |
| **Container** | `projeto_financeiro_db` |
| **Porta** | `5434:5432` (host:container) |
| **Credenciais** | Usuário `postgres`, senha `postgres`, banco `projeto_financeiro` |
| **Volume** | `postgres_data` → `/var/lib/postgresql/data` (persistência) |
| **Inicialização** | Script opcional: `database/init.sql` em `/docker-entrypoint-initdb.d/01-init.sql` |
| **Healthcheck** | `pg_isready -U postgres` (intervalo 5s); o backend só sobe após o Postgres estar saudável |

### backend

| Item | Valor |
|------|--------|
| **Build** | `backend/Dockerfile` (contexto `./backend`) |
| **Container** | `projeto_financeiro_backend` |
| **Porta** | `${BACKEND_PORT:-3011}:3001` |
| **Base** | `node:20-bookworm-slim` (Debian). Não é usado Alpine para evitar incompatibilidade do Prisma com o runtime `linux-musl`. |
| **Comando** | `npx prisma migrate deploy && exec node dist/index.js` |

**Dockerfile (resumo):**

- **Stage builder:** instala dependências, `prisma generate`, `npm run build` (TypeScript → `dist/`).
- **Stage runner:** copia `dist/`, `prisma/` e `node_modules`; expõe a porta 3001; na subida executa as migrações e inicia o servidor Node.

Variáveis de ambiente injetadas pelo Compose: `NODE_ENV`, `PORT`, `DATABASE_URL`, `API_PREFIX`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `TELEGRAM_*`, `CRON_*`. O `DATABASE_URL` no compose aponta para o hostname `postgres` e a porta interna `5432`.

### frontend

| Item | Valor |
|------|--------|
| **Build** | `frontend/Dockerfile` (contexto `./frontend`) |
| **Container** | `projeto_financeiro_frontend` |
| **Porta** | `${FRONTEND_PORT:-3010}:3000` |
| **Base** | `node:20-alpine` (builder e runner) |
| **Comando** | `node server.js` (output standalone do Next.js) |

**Dockerfile (resumo):**

- **Stage builder:** recebe `NEXT_PUBLIC_API_URL` como `ARG` (passado pelo Compose no build); faz `npm run build` com output standalone.
- **Stage runner:** copia apenas `public/`, `.next/standalone` e `.next/static`; roda como usuário não-root; expõe a porta 3000.

**Importante:** a URL da API é definida em **tempo de build** (`NEXT_PUBLIC_API_URL`). Se alterar essa URL no `.env` depois do primeiro build, é necessário fazer **rebuild** da imagem do frontend para que o browser use a nova URL.

---

## Variáveis de ambiente

Crie um arquivo **`.env` na raiz** do projeto (ao lado do `docker-compose.yml`). Você pode copiar o exemplo:

```bash
cp .env.example .env
```

Variáveis usadas pelo Docker Compose e pelos containers:

| Variável | Serviço | Descrição | Padrão |
|----------|---------|-----------|--------|
| `DATABASE_URL` | — | Não é necessária no Compose; o backend recebe URL fixa (host `postgres`). | — |
| `NEXT_PUBLIC_API_URL` | frontend (build) | URL da API que o browser vai usar. Deve apontar para o backend acessível pelo usuário (ex.: `http://localhost:3011/api/v1`). | `http://localhost:3011/api/v1` |
| `BACKEND_PORT` | host | Porta do host mapeada para a 3001 do backend. | `3011` |
| `FRONTEND_PORT` | host | Porta do host mapeada para a 3000 do frontend. | `3010` |
| `JWT_SECRET` | backend | Chave para assinatura do JWT. Em produção use valor forte. | `change-me-in-production` |
| `JWT_EXPIRES_IN` | backend | Validade do token. | `7d` |
| `TELEGRAM_BOT_TOKEN` | backend | Token do bot (BotFather). Opcional; deixe vazio para desativar. | — |
| `TELEGRAM_WEBHOOK_URL` | backend | URL pública do webhook. Opcional; necessária para o bot receber mensagens. | — |
| `CRON_RECURRING_DISABLED` | backend | `1` desliga o job de transações recorrentes. | `0` |
| `CRON_ALERTS_TELEGRAM_DISABLED` | backend | `1` desliga o job de alertas no Telegram. | `0` |

O Compose usa `${VAR:-default}`; assim, se uma variável não estiver no `.env`, o valor padrão é usado.

---

## Comandos

### Subir todos os serviços

```bash
docker-compose up --build
```

Com `--build`, as imagens são (re)construídas se necessário. Sem `--build`, usa imagens já existentes.

### Subir em segundo plano

```bash
docker-compose up -d --build
```

### Parar os containers

```bash
docker-compose down
```

Os dados do Postgres permanecem no volume `postgres_data`. Para remover também os volumes:

```bash
docker-compose down -v
```

### Aplicar migrações manualmente (opcional)

O backend já executa `prisma migrate deploy` ao iniciar. Se quiser rodar manualmente:

```bash
docker exec projeto_financeiro_backend npx prisma migrate deploy
```

### Seed (dados de exemplo)

Após a primeira subida e com as migrações aplicadas:

```bash
docker exec projeto_financeiro_backend npx prisma db seed
```

O seed cria usuários (senha: `123456`), cartões e transações de exemplo.

### Logs

```bash
docker-compose logs -f
```

Apenas um serviço:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Rebuild de um serviço

Para forçar reconstrução do backend (por exemplo, após alterar código ou dependências):

```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

Para o frontend (obrigatório se mudar `NEXT_PUBLIC_API_URL`):

```bash
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Subir apenas o PostgreSQL

Para desenvolver backend e frontend na máquina e usar só o banco em Docker:

```bash
docker-compose up -d postgres
```

Use `DATABASE_URL=postgresql://postgres:postgres@localhost:5434/projeto_financeiro?schema=public` no `.env` da raiz ou do backend e rode as migrações e o seed localmente.

---

## Troubleshooting

### Erro do Prisma: "Query Engine" / "linux-musl"

Se aparecer erro relacionado ao Prisma Client não encontrar o engine para `linux-musl`, a imagem do backend em cache pode ser antiga (quando ainda usava Alpine). O Dockerfile atual usa **Debian** (`node:20-bookworm-slim`).

**Solução:** rebuild forçado do backend sem cache:

```bash
docker-compose down --rmi local
docker-compose build --no-cache backend
docker-compose up -d
```

### Frontend não conecta na API

1. Confirme que `NEXT_PUBLIC_API_URL` no `.env` aponta para a URL do backend que o **navegador** usa (ex.: `http://localhost:3011/api/v1` se o backend estiver na porta 3011).
2. Como essa variável é injetada no build do Next.js, após alterar o `.env` faça rebuild do frontend: `docker-compose build --no-cache frontend && docker-compose up -d frontend`.

### Porta já em uso

Altere no `.env`:

- `BACKEND_PORT` (ex.: 3012)
- `FRONTEND_PORT` (ex.: 3011)

E ajuste `NEXT_PUBLIC_API_URL` para usar a nova porta do backend (e faça rebuild do frontend).

### Backend não sobe / Postgres não pronto

O backend depende do healthcheck do Postgres. Se o banco demorar a iniciar, o Compose aguarda. Veja os logs: `docker-compose logs postgres` e `docker-compose logs backend`.

---

## Estrutura dos Dockerfiles

- **backend:** multi-stage (builder + runner); instala OpenSSL/ca-certificates; gera Prisma Client e compila TypeScript no builder; no runner só executa `dist/index.js` e migrações.
- **frontend:** multi-stage (builder + runner); build do Next.js com output standalone; runner mínimo com apenas `server.js` e arquivos estáticos.

Os arquivos `.dockerignore` em `backend/` e `frontend/` reduzem o contexto de build (excluindo `node_modules`, `.git`, etc.).

---

Para visão geral do projeto e instalação sem Docker, veja o [README.md](./README.md).
