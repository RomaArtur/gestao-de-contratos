# Gestão Imobiliária

Sistema para o dia a dia de uma imobiliária: proprietários, imóveis, clientes, propostas e contratos. O acesso é por login, com os perfis de administrador e corretor. CPF e CNPJ ficam criptografados no banco.

O frontend é Next.js, a API é NestJS e o Postgres sobe pelo Docker.

## Como rodar

Na raiz, sobe o banco:

```bash
docker compose up -d
```

O Postgres fica em `127.0.0.1:5433`, para não ocupar a porta 5432 se já existir um Postgres na máquina.

No `backend`, copie `.env.example` para `.env` e suba a API:

```bash
cd backend
npm install
npm run start:dev
```

Ela fica em `http://localhost:3001`. Na primeira subida cria as tabelas e o administrador definido em `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. A documentação da API está em `http://localhost:3001/api/docs`.

No `frontend`, o mesmo com o `.env`:

```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:3000` e entre com esse administrador.

Os testes da API rodam com `npm test` dentro de `backend`.
