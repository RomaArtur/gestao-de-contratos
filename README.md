# Sacramento Imóveis

Sistema web para o dia a dia de uma imobiliária. Cobre o caminho do atendimento até o contrato: agenda, proprietários, imóveis, clientes, propostas, formas de pagamento e contratos. O acesso é por login. CPF e CNPJ ficam criptografados no banco.

O trabalho foi feito para o Projeto Integrador. O site publicado está em [https://gestao-de-contratos-ruby.vercel.app](https://gestao-de-contratos-ruby.vercel.app). A documentação da API, no mesmo endereço e depois do login, fica em `/api/docs`.

## Requisitos do Projeto Integrador

| Requisito | Onde aparece |
| --- | --- |
| Framework web | Next.js no site e NestJS na API |
| Banco de dados | PostgreSQL, com Sequelize. Localmente no Docker; publicado no Neon |
| Script web (JavaScript) | Interface em React e TypeScript, executada no navegador |
| Nuvem | Site na Vercel, banco no Neon (São Paulo) e API numa VM da Oracle Cloud |
| Uso de API | API REST própria, documentada no Swagger, e consulta de CEP no ViaCEP |
| Acessibilidade | Rótulos nos campos, `aria-label` no menu, nas tabelas e nas ações, página atual marcada com `aria-current`, ícones decorativos com `aria-hidden` e texto alternativo na logo |
| Controle de versão | Git, com o histórico neste repositório |
| Testes | Vitest na API: autenticação, imóveis, propostas, contratos, agenda, datas, modelos de texto e criptografia de campos |
| Análise de dados (opcional) | Painel com totais, gráficos por situação e lista de documentos pendentes |

A acessibilidade está na marcação da interface. Não houve uma auditoria formal de WCAG. Os testes automatizados cobrem a API. O fluxo de telas foi exercitado na aplicação em execução.

## O que o sistema faz

- **Login e sessão.** O site autentica com Auth.js. A API emite JWT de acesso e de refresh. A senha é armazenada com Argon2. Os perfis são administrador, gestor e corretor. A primeira subida cria o administrador definido no ambiente.
- **Painel.** Mostra quantos imóveis, propostas e contratos existem, separa contratos ativos, vencidos e próximos do vencimento, desenha a distribuição por situação e lista imóveis sem documento e contratos sem o arquivo assinado.
- **Agenda.** Cadastro e acompanhamento de compromissos.
- **Proprietários, imóveis, clientes e propostas.** Cadastro, consulta, edição e exclusão. O CEP preenche logradouro, bairro, cidade e UF pela API pública do ViaCEP.
- **Formas de pagamento.** Cadastro das condições usadas nas propostas e nos contratos.
- **Contratos.** Edição do documento, finalização e reenvio por e-mail. O envio sai pelo Gmail (SMTP, com senha de app). Se o e-mail falhar na finalização, o contrato permanece finalizado e a tela informa o resultado. No reenvio, o histórico só é gravado depois do envio bem-sucedido.
- **Arquivos.** Upload de documentos do imóvel e do contrato assinado. O site busca o arquivo pela API com o token da sessão.
- **Documentação da API.** Swagger gerado pela própria API, com o título Sacramento Imóveis.

## Arquitetura

```
navegador
   │
   ▼
Next.js (Vercel)  ──chamada no servidor──►  NestJS (Oracle Cloud, porta 3001)
   │                                              │
   └── /api/docs repassa o Swagger                ▼
                                            PostgreSQL (Neon)
```

- O navegador fala com o site. Login, leituras e gravações partem do servidor Next.js para a API (`API_URL`).
- A página **Documentação API** redireciona para `/api/docs` no próprio site. Essa rota repassa o Swagger da API, então o endereço continua no domínio da Vercel.
- A API também responde direto em `http://147.15.126.211:3001`. A raiz não tem página (`Cannot GET /`). Os caminhos úteis são `/api/v1/...`, `/api/docs` e `/api/v1/health`.
- O health check devolve `{"status":"ok","database":"up"}` quando a API e o Neon estão acessíveis.

## Tecnologias

**Site (`frontend`)**

- Next.js 16 (App Router) e React 19
- TypeScript
- Tailwind CSS 4 e HeroUI
- Auth.js (NextAuth)
- Zod e React Hook Form

**API (`backend`)**

- NestJS 12
- Sequelize e o driver `pg`
- Zod para validar o ambiente e os corpos das requisições
- Swagger (`@nestjs/swagger`)
- Passport JWT, Argon2, Helmet e limite de taxa
- Nodemailer para o Gmail
- Winston para log
- Vitest

**Dados e publicação**

- PostgreSQL (Docker na máquina local, Neon na nuvem)
- Vercel para o site
- Oracle Cloud Always Free (`VM.Standard.E2.1.Micro`, Ubuntu 24.04) para a API
- Git

## Estrutura

```
frontend/     site Next.js
backend/      API NestJS
docker-compose.yml          Postgres local, na porta 5433
docker-compose.api.yml      alternativa para subir só a API em container
docker-compose.prod.yml     alternativa com site, API e banco no mesmo compose
```

A publicação que está no ar não usa esses compose de produção. A API na VM roda com Node.js 22 e o serviço `gestao-api` do systemd. Os compose ficam no repositório como caminho alternativo.

## Como rodar na máquina local

É preciso ter Node.js, npm e Docker.

1. Suba o banco, na raiz do repositório:

```bash
docker compose up -d
```

O Postgres fica em `127.0.0.1:5433`, no banco `gestao_contratos`, para não disputar a porta 5432 com outra instalação.

2. Configure e suba a API:

```bash
cd backend
copy .env.example .env
npm install
npm run start:dev
```

No Linux ou no macOS, troque `copy` por `cp`. A API fica em `http://localhost:3001`. Na primeira subida ela cria as tabelas e o administrador de `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. O exemplo usa `admin@imobiliaria.local`. Troque a senha e os segredos JWT antes de qualquer publicação. O Swagger local fica em `http://localhost:3001/api/docs`.

Fora do modo `test`, a API exige `GMAIL_USER` e `GMAIL_APP_PASSWORD`. A senha de app tem 16 caracteres. Os espaços que o Google mostra podem permanecer no arquivo: a API os remove. Sem essas variáveis, finalizar ou reenviar um contrato responde que o e-mail não está configurado.

3. Configure e suba o site:

```bash
cd frontend
copy .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`. As variáveis são:

| Variável | Função |
| --- | --- |
| `AUTH_SECRET` | Segredo do Auth.js |
| `AUTH_URL` | Endereço do site. Em desenvolvimento, `http://localhost:3000` |
| `API_URL` | Endereço da API usado pelo servidor Next.js |
| `PUBLIC_API_URL` | Endereço da API usado quando o navegador precisa sair do site |

## Testes

Na pasta `backend`:

```bash
npm test
```

Os arquivos `*.spec.ts` cobrem autenticação, criptografia de CPF/CNPJ, imóveis, propostas, contratos (incluindo o HTML enviado), agenda e datas. O modo `test` não dispara e-mail de verdade.

Há também `npm run test:e2e`, com a configuração em `vitest.config.e2e.ts`.

## Publicação

Três serviços gratuitos, cada um com uma parte:

| Parte | Onde está | Endereço |
| --- | --- | --- |
| Site | Vercel. A raiz do projeto na Vercel é a pasta `frontend` | [https://gestao-de-contratos-ruby.vercel.app](https://gestao-de-contratos-ruby.vercel.app) |
| Banco | Neon, região AWS South America (São Paulo), com SSL | connection string só no ambiente da API |
| API | VM Oracle em São Paulo, Node 22, serviço `gestao-api` | [http://147.15.126.211:3001](http://147.15.126.211:3001) |

Variáveis do site na Vercel (Production e Preview):

- `API_URL` e `PUBLIC_API_URL` apontam para `http://147.15.126.211:3001`
- `AUTH_SECRET` é um segredo próprio da publicação
- `AUTH_URL` pode ficar de fora: o Auth.js está com `trustHost`

Variáveis da API na VM (arquivo de ambiente do serviço, sem commit):

- `DATABASE_URL` do Neon, com `sslmode=require`. O parâmetro `channel_binding=require` fica de fora, porque o driver Node falha com ele
- `FRONTEND_ORIGIN=https://gestao-de-contratos-ruby.vercel.app`
- `NODE_ENV=production`, `PORT=3001`
- segredos JWT diferentes dos de desenvolvimento
- a mesma `FIELD_ENCRYPTION_KEY` usada para os dados já gravados
- `GMAIL_USER` e `GMAIL_APP_PASSWORD`

A VM abre as portas 22 (SSH) e 3001. O disco guarda os uploads. Há 2 GB de swap porque a instância gratuita tem cerca de 1 GB de RAM.

Conferir a API:

- [http://147.15.126.211:3001/api/v1/health](http://147.15.126.211:3001/api/v1/health)
- [http://147.15.126.211:3001/api/docs](http://147.15.126.211:3001/api/docs)

## Segurança

- Senha com Argon2 e sessão com JWT de curta duração mais refresh.
- CPF e CNPJ criptografados com `FIELD_ENCRYPTION_KEY` (AES-256-GCM, chave de 32 bytes em base64). Perder essa chave impede ler os documentos já gravados.
- Helmet na API. A política de conteúdo e o HSTS ficam desligados porque o Swagger é servido em HTTP no IP da VM. Forçar HTTPS deixava a documentação em branco.
- CORS aceita somente a origem do site (`FRONTEND_ORIGIN`).
- Segredos ficam em `.env` e no painel da Vercel. O repositório guarda só os exemplos (`.env.example` e `deploy.env.example`).
