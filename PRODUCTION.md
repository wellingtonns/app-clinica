# Stetic Soft em produção

Arquitetura alvo:

- Vercel Hobby para frontend Vite e funções serverless em `/api`.
- Supabase Free com PostgreSQL.
- Prisma ORM.
- Sem Redis.

## Variáveis de ambiente

Configure na Vercel e localmente, sem commitar valores reais:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
NEXT_PUBLIC_APP_NAME="Stetic Soft"
JWT_SECRET="gere-um-valor-longo-e-seguro"
```

Use `DATABASE_URL` com o pooler do Supabase para runtime e `DIRECT_URL` com a conexão direta para migrations.
Use `JWT_SECRET` para assinar o cookie httpOnly de sessão. Em produção, gere um valor forte e exclusivo.

## Primeiro deploy

1. Criar o projeto no Supabase.
2. Configurar `DATABASE_URL` e `DIRECT_URL`.
3. Rodar migrations:

```bash
npm run prisma:deploy
```

4. Criar o usuario administrador inicial:

```bash
npm run prisma:seed
```

5. Fazer deploy na Vercel.

## Build

O build já executa `prisma generate` antes do Vite:

```bash
npm run build
```

## Dados

O app não usa `localStorage` como fonte principal. Os dados são carregados de `/api/clinic` e persistidos no PostgreSQL:

- Pacientes
- Profissionais
- Agendamentos
- Pagamentos
- Lançamentos financeiros
- Produtos
- Movimentações de estoque
- Registros operacionais do paciente

Para dados de teste opcionais, rode:

```bash
SEED_SAMPLE_DATA=true npm run prisma:seed
```
