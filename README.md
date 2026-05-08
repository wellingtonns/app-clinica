# ClinicFlow Pro

Prototipo de plataforma para clinica com foco em:

- cadastro de pacientes
- agenda inteligente
- estoque
- prontuario eletronico
- financeiro
- dashboard executivo
- controle por profissional
- comunicacao automatica

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

## Observacao

Este projeto e um frontend demonstrativo com dados mockados. A arquitetura alvo prevista para evolucao e:

- Backend Node.js com NestJS ou Express
- PostgreSQL
- Docker
- Kubernetes
- Ingress NGINX
- Cert-Manager

## Modelo inicial de dominio

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
