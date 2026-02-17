# Docker - Projeto Financeiro

O sistema sobe com **PostgreSQL**, **Backend** (Node/Express) e **Frontend** (Next.js) usando Docker Compose.

---

## Subir tudo

```bash
docker-compose up --build
```

Ou em segundo plano:

```bash
docker-compose up -d --build
```

- **Frontend:** http://localhost:3010 (ou `FRONTEND_PORT` no `.env`)  
- **Backend (API):** http://localhost:3011 (ou `BACKEND_PORT` no `.env`)  
- **PostgreSQL:** localhost:5434 (usuário `postgres`, senha `postgres`, banco `projeto_financeiro`)

### Rebuild limpo (se o backend falhar com erro do Prisma / "linux-musl")

Se aparecer erro do tipo *"Prisma Client could not locate the Query Engine for runtime linux-musl"*, a imagem do backend em uso é antiga (Alpine). Faça um rebuild forçado:

```bash
docker-compose down --rmi local
docker-compose build --no-cache backend
docker-compose up -d
```

O backend usa **Debian** (`node:20-bookworm-slim`) e **plataforma linux/amd64** para evitar incompatibilidade do Prisma com Alpine.

---

## Variáveis de ambiente

Crie um arquivo `.env` na **raiz** do projeto (ao lado do `docker-compose.yml`). Você pode copiar o exemplo:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NEXT_PUBLIC_API_URL` | URL da API usada pelo browser (frontend) | `http://localhost:3001/api/v1` |
| `JWT_SECRET` | Chave para assinatura do JWT | `change-me-in-production` |
| `JWT_EXPIRES_IN` | Validade do token | `7d` |
| `TELEGRAM_BOT_TOKEN` | Token do BotFather (opcional) | — |
| `TELEGRAM_WEBHOOK_URL` | URL do webhook (opcional) | — |
| `CRON_RECURRING_DISABLED` | `1` desliga o job de contas recorrentes | `0` |
| `CRON_ALERTS_TELEGRAM_DISABLED` | `1` desliga o job de alertas por Telegram | `0` |

O **PostgreSQL** e o **backend** usam credenciais fixas no compose (postgres/postgres, porta 5434). O **frontend** recebe `NEXT_PUBLIC_API_URL` no **build**; se mudar depois, é preciso fazer rebuild da imagem do frontend.

---

## Seed (dados iniciais)

Após a primeira subida, o backend já roda as migrations. Para popular com dados de exemplo:

```bash
docker exec projeto_financeiro_backend npx prisma db seed
```

(O seed usa `tsx`; se o container não tiver, use: `docker exec projeto_financeiro_backend node -e "require('child_process').execSync('npx prisma db seed', {stdio:'inherit'})"` — na verdade o package.json tem `"prisma":{"seed":"tsx prisma/seed.ts"}` e o container não tem tsx instalado em produção. So we need to run the seed differently. Let me check - the runner stage only has node_modules from builder which includes devDependencies (we copied all node_modules). So we might have tsx. Actually we did npm install in builder so we have tsx. We copy node_modules to runner so we have tsx. So npx prisma db seed will run tsx prisma/seed.ts - but prisma/seed.ts is in the container (we copy prisma folder). So we need tsx in the runner. We copied full node_modules so we have it. So the seed command should work: docker exec ... npx prisma db seed. Let me leave the doc as is.)
</think>
Verificando se o backend em produção tem `tsx` para o seed:
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace