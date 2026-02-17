-- Garante permissões no schema public (PostgreSQL 15+ restringe por padrão)
GRANT ALL ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;
ALTER SCHEMA public OWNER TO postgres;
