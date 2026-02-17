#!/bin/sh
# Rode se aparecer "User postgres was denied access" ao usar Prisma.
# Uso: ./database/fix-permissions.sh

set -e

echo "Ajustando permissões no banco projeto_financeiro..."

# No banco "postgres": dono e privilégios no banco projeto_financeiro
docker-compose exec postgres psql -U postgres -d postgres -c "ALTER DATABASE projeto_financeiro OWNER TO postgres;"
docker-compose exec postgres psql -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE projeto_financeiro TO postgres;"

# Dentro de projeto_financeiro: schema public (PostgreSQL 15+)
docker-compose exec postgres psql -U postgres -d projeto_financeiro -c "ALTER SCHEMA public OWNER TO postgres;"
docker-compose exec postgres psql -U postgres -d projeto_financeiro -c "GRANT ALL ON SCHEMA public TO postgres; GRANT CREATE ON SCHEMA public TO postgres; GRANT USAGE ON SCHEMA public TO postgres;"

echo "Concluído. Rode: npm run db:migrate"
echo ""
echo "Se ainda falhar, recrie o volume (apaga dados):"
echo "  docker-compose down -v && docker-compose up -d postgres && sleep 5 && npm run db:migrate"
