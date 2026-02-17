# -----------------------------------------------------------------------------
# Backend - Debian (node:20-bookworm-slim). NÃO use Alpine (erro Prisma musl/openssl).
# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS builder
LABEL backend.base=debian-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# -----------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules ./node_modules/

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]
