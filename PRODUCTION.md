# Stetic Soft em produção

Arquitetura alvo:

- Vercel Hobby para frontend Vite e funções serverless em `/api`.
- Supabase Free com PostgreSQL.
- Prisma ORM.
- Sem Redis.

## Variáveis de ambiente

Configure na Vercel e localmente, sem commitar valores reais:

```env
POSTGRES_PRISMA_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
POSTGRES_URL_NON_POOLING="postgresql://USER:PASSWORD@HOST:5432/postgres"
NEXT_PUBLIC_APP_NAME="Stetic Soft"
JWT_SECRET="gere-um-valor-longo-e-seguro"
BLOB_READ_WRITE_TOKEN="criado-ao-conectar-o-vercel-blob"
ADMIN_EMAIL="admin@sua-clinica.com"
ADMIN_PASSWORD="gere-uma-senha-forte"
APP_URL="https://seu-dominio.vercel.app"
RESEND_API_KEY="re_..."
EMAIL_FROM="SteticSoft <contato@seu-dominio.com>"
```

Use `POSTGRES_PRISMA_URL` com o pooler do Supabase para runtime e `POSTGRES_URL_NON_POOLING` com a conexao direta para migrations. A integracao Supabase da Vercel cria essas variaveis automaticamente.
Use `JWT_SECRET` para assinar o cookie httpOnly de sessão. Em produção, gere um valor forte e exclusivo.
Use `BLOB_READ_WRITE_TOKEN` para salvar imagens, contratos e arquivos do paciente no Vercel Blob. Para dados de paciente, prefira um Blob store privado; o app entrega os arquivos por uma rota autenticada em `/api/blob/file`.
Use `APP_URL` com a URL publica de producao, sem barra no final. `RESEND_API_KEY` e `EMAIL_FROM` habilitam o envio dos links de redefinicao de senha; o remetente precisa estar autorizado no Resend.

## Primeiro deploy

1. Criar o projeto no Supabase.
2. Configurar `DATABASE_URL` e `DIRECT_URL`.
3. Rodar migrations:

```bash
npm run prisma:deploy
```

4. Criar ou atualizar o usuario administrador inicial. Antes do comando, defina
   `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente local conectado ao banco de producao:

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
