# ClinicFlow Pro

Protótipo de plataforma para clínica com foco em:

- cadastro de pacientes
- agenda inteligente
- estoque
- prontuário eletrônico
- financeiro
- painel executivo
- controle por profissional
- comunicação automática

## Stack

- React + TypeScript
- Recharts
- Docker + NGINX

## Rodar com Docker

```bash
docker compose up --build -d
```

Acesse `http://localhost:8086`.

## Rodar sem Docker

```bash
npm install
npm run dev
```

## Observação

Este projeto é um frontend demonstrativo com dados mockados. A arquitetura alvo prevista para evolução é:

- Backend Node.js com NestJS ou Express
- PostgreSQL
- Docker
- Kubernetes
- Ingress NGINX
- Cert-Manager

## Modelo inicial de domínio

- `users`
- `roles`
- `patients`
- `professionals`
- `appointments`
- `procedures`
- `inventory`
- `stock_movements`
- `financial_transactions`
- `medical_records`
