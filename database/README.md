# Database

PostgreSQL é o banco de dados do projeto. O schema e as migrações ficam no **backend** (Prisma ORM).

- **Schema e migrações:** `backend/prisma/`
- **Connection string:** configurada em `DATABASE_URL` (ver `.env.example` na raiz)

Para subir apenas o PostgreSQL via Docker:

```bash
docker-compose up -d postgres
```

Para gerar o client e aplicar migrações:

```bash
npm run db:generate
npm run db:migrate
```
