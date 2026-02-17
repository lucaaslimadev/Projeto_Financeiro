# Como subir o projeto do zero

Siga a ordem abaixo. Use **dois terminais** (um para backend, um para frontend).

---

## 1. Variáveis de ambiente

### Raiz (opcional)

Se existir `.env` na raiz, ele pode ser copiado para o backend pelos scripts do `package.json`.

### Backend

Crie ou edite `backend/.env`:

```env
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/projeto_financeiro?schema=public"
JWT_SECRET=your-secret-change-in-production
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_URL=
```

Ajuste `DATABASE_URL` se seu PostgreSQL usar outra porta/usuário/senha.

### Frontend

O frontend usa `NEXT_PUBLIC_API_URL`. Por padrão ele usa `http://localhost:3001/api/v1` (pode ser definido em `frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## 2. Banco de dados (PostgreSQL)

O backend espera PostgreSQL rodando (local ou Docker).

### Opção A: Docker (postgres)

```bash
docker run -d --name postgres-financeiro -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=projeto_financeiro -p 5434:5432 postgres:16
```

### Opção B: PostgreSQL já instalado

Crie o banco `projeto_financeiro` e use a connection string no `DATABASE_URL`.

---

## 3. Dependências e migrations

Na **raiz** do projeto:

```bash
npm install
```

No **backend** (ou pela raiz com workspace):

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
# ou em dev: npx prisma migrate dev
npm run db:seed
cd ..
```

Se rodar pela raiz:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

(Os scripts do root copiam `.env` para `backend/.env` se existir e chamam os comandos no workspace backend.)

---

## 4. Backend

Em um terminal:

```bash
npm run dev:backend
```

Ou:

```bash
cd backend && npm run dev
```

O backend sobe em **http://localhost:3001**.  
Health: http://localhost:3001/health

---

## 5. Frontend

Em **outro** terminal:

```bash
npm run dev:frontend
```

Ou:

```bash
cd frontend && npm run dev
```

O frontend sobe em **http://localhost:3000**.

### Erro "Cannot read properties of undefined (reading 'call')"

O `npm run dev` do frontend está configurado para usar **Turbopack** (`next dev --turbo`) para evitar esse bug do Webpack em dev.

Se ainda aparecer:

1. Pare o servidor do frontend (Ctrl+C).
2. Limpe o cache e reinstale:
   ```bash
   cd frontend
   rm -rf .next node_modules
   npm install
   npm run dev
   ```
3. Abra **http://localhost:3000** em aba anônima ou limpe os dados do site (F12 → Application → Clear site data) para `localhost:3000`.

---

## 6. Resumo da ordem

| Ordem | O quê              | Onde rodar   |
|-------|--------------------|--------------|
| 1     | `.env` no backend  | Criar/editar |
| 2     | PostgreSQL rodando | Docker ou local |
| 3     | `npm install`      | Raiz         |
| 4     | `prisma generate` / `migrate` / `seed` | Backend ou raiz |
| 5     | `npm run dev:backend`  | Terminal 1  |
| 6     | `npm run dev:frontend` | Terminal 2  |

Acesse: **http://localhost:3000** (login/cadastro). Usuários de exemplo vêm do seed (veja `backend/prisma/seed.ts`; ex.: senha `123456`).
