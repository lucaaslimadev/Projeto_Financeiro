#!/usr/bin/env bash
# Corrige o erro do Prisma (linux-musl) removendo a imagem antiga e reconstruindo
# com Debian (bookworm-slim) + platform linux/amd64.
set -e
cd "$(dirname "$0")/.."
echo ">>> Parando containers e removendo imagens do projeto..."
docker-compose down --rmi local
docker rmi projeto_financeiro-backend 2>/dev/null || true
echo ">>> Reconstruindo o backend (sem cache, pull da base)..."
docker-compose build --no-cache --pull backend
echo ">>> Subindo os serviços..."
docker-compose up -d
echo ""
echo ">>> Verificando se o backend está com Debian (não Alpine):"
docker exec projeto_financeiro_backend cat /etc/os-release 2>/dev/null | head -2 || echo "(aguarde o container subir e rode: docker exec projeto_financeiro_backend cat /etc/os-release)"
echo ""
echo ">>> Pronto. Backend em http://localhost:3011 (ou BACKEND_PORT do .env)"
docker-compose ps
