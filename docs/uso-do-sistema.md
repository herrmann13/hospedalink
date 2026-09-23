# Hospeda Link — Guia de Uso do Sistema

> Protótipo de uma central de hospedagem corporativa em Jataí-GO. A plataforma capta a demanda de empresas que precisam hospedar equipes temporárias, e a equipe interna negocia com hotéis, pousadas e alojamentos parceiros.

---

## 1. Visão geral

O **Hospeda Link** conecta empresas a estabelecimentos de hospedagem em Jataí. O fluxo central é:

**Empresa acessa o site → entende o serviço → preenche o formulário → a solicitação aparece no painel administrativo → o operador consulta parceiros → cadastra opções e valores → registra a negociação → fecha uma proposta → converte em contrato.**

O sistema **não** faz reserva automática, não exibe estabelecimentos publicamente e não processa pagamento online. Toda negociação é intermediada pela equipe interna.

---

## 2. Arquitetura e tecnologias

| Camada | Tecnologia | Local |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router v7 + TanStack Query + React Hook Form + Zod + motion + Phosphor Icons | `client/` |
| Backend | Express 5 + Prisma + SQLite + jose (JWT) + bcryptjs + Zod | `server/` |
| Gerenciador | Bun (runtime + package manager) | monorepo na raiz |

O banco é **SQLite** (arquivo `server/prisma/dev.db`) nesta versão de prova de conceito. A migração para PostgreSQL em produção exige apenas trocar `provider` e `DATABASE_URL` em `server/prisma/schema.prisma` e `server/.env`.

---

## 3. Como rodar

### Pré-requisitos

- [Bun](https://bun.sh) (versão 1.3+)

### Instalação e execução

```bash
bun install          # instala as dependências dos dois workspaces
bun run db:reset     # cria o banco SQLite e roda o seed (dados de demonstração)
bun run dev          # sobe frontend (Vite :5173) e API (Express :3001)
```

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `bun run dev` | Sobe frontend + backend em modo desenvolvimento |
| `bun run build` | Gera o client de produção e o Prisma Client |
| `bun run db:push` | Aplica o schema atual ao banco |
| `bun run db:seed` | Roda o seed |
| `bun run db:reset` | Recria o banco e roda o seed (estado limpo de demonstração) |

### Acessos

- **Site:** http://localhost:5173
- **Painel administrativo:** http://localhost:5173/admin
- **Login do admin (seed):** `admin@hospedalink.com.br` / `admin123`

O `server/.env` contém `DATABASE_URL`, `JWT_SECRET` e `PORT`. Este arquivo é ignorado pelo git (`.env*`) e deve ser recriado em um clone novo. Em produção, `JWT_SECRET` é obrigatório e deve ser uma chave longa e aleatória.

---

## 4. Rotas da aplicação

### Públicas

| Rota | Descrição |
|---|---|
| `/` | Landing page (hero, como funciona, benefícios, para empresas, parceiros, diferenciação) |
| `/solicitar-hospedagem` | Formulário de solicitação em 4 etapas |
| `/seja-parceiro` | Cadastro de estabelecimento parceiro |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |

### Administrativas (requerem login)

| Rota | Descrição |
|---|---|
| `/admin/login` | Login da equipe interna |
| `/admin` | Dashboard com métricas da operação |
| `/admin/solicitacoes` | Lista de solicitações |
| `/admin/solicitacoes/:id` | Detalhe da solicitação (status, negociações, propostas, contrato) |
| `/admin/parceiros` | Lista de parceiros |
| `/admin/parceiros/:id` | Detalhe do parceiro (aprovação, quartos, serviços) |
| `/admin/negociacoes` | Negociações em andamento |
| `/admin/contratos` | Contratos fechados |
| `/admin/configuracoes` | Taxa de captação padrão |

---

## 5. Fluxos de uso

### 5.1 Fluxo da empresa solicitante

1. A empresa acessa a landing page e entende a proposta de valor.
2. Clica em **Solicitar hospedagem** (ou navega para `/solicitar-hospedagem`).
3. Preenche o formulário em 4 etapas: **Sua empresa → Sua equipe → Hospedagem → Contato e confirmação**.
4. O formulário aplica máscara de CNPJ e telefone, valida as datas (saída > entrada) e calcula as diárias automaticamente.
5. Ao enviar, recebe um protocolo (ex.: `SOL-000005`).

### 5.2 Fluxo do estabelecimento parceiro

1. Acessa `/seja-parceiro`.
2. Informa dados básicos, estrutura (tipos de quarto), condições comerciais, serviços e fotos.
3. O cadastro é criado com status **PENDENTE**.
4. A equipe interna aprova (ou recusa) em `/admin/parceiros`.

### 5.3 Fluxo administrativo (núcleo do negócio)

1. A solicitação aparece em `/admin/solicitacoes` com status **NOVA**.
2. O operador abre o detalhe, analisa os dados e muda o status conforme o andamento.
3. **Associa parceiros** à solicitação (gera uma *Negociação* por parceiro, com status e diária oferecida).
4. **Cadastra propostas** informando parceiro, hóspedes, diária e dias. O sistema calcula automaticamente:
   - `Hospedagem = hóspedes × diária × dias`
   - `Taxa de captação = Hospedagem × taxa configurada (padrão 10%)`
   - `Total negociado = Hospedagem + Taxa`
5. Ao **gerar contrato** a partir de uma proposta, o sistema cria o contrato, marca a proposta como **CONVERTIDA** e a solicitação como **CONTRATO_FECHADO**.

---

## 6. Endpoints da API

Todos os endpoints administrativos exigem o cookie de sessão (JWT) obtido em `POST /api/auth/login`.

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autentica e define o cookie `hl_admin` |
| POST | `/api/auth/logout` | Encerra a sessão |
| GET | `/api/auth/me` | Retorna o usuário autenticado |

### Público

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/requests` | Cria uma solicitação de hospedagem (com empresa) |
| POST | `/api/partners` | Solicita cadastro de parceiro (status PENDING) |

### Administrativo

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/dashboard` | Métricas do dashboard |
| GET | `/api/admin/requests` | Lista solicitações |
| GET | `/api/admin/requests/:id` | Detalhe da solicitação |
| PATCH | `/api/admin/requests/:id` | Atualiza status e observações internas |
| POST | `/api/admin/requests/:id/negotiations` | Associa um parceiro à solicitação |
| POST | `/api/admin/requests/:id/proposals` | Cria proposta (com cálculo automático) |
| GET | `/api/admin/partners` | Lista parceiros |
| GET | `/api/admin/partners/:id` | Detalhe do parceiro |
| PATCH | `/api/admin/partners/:id` | Atualiza parceiro (ex.: aprovar) |
| GET | `/api/admin/negotiations` | Lista negociações |
| PATCH | `/api/admin/negotiations/:id` | Atualiza status da negociação |
| GET | `/api/admin/contracts` | Lista contratos |
| POST | `/api/admin/contracts` | Converte proposta em contrato |
| PATCH | `/api/admin/contracts/:id` | Atualiza status do contrato |
| GET | `/api/admin/settings` | Lê a taxa de captação |
| PATCH | `/api/admin/settings` | Altera a taxa de captação |

O contrato completo está em [`docs/openapi.yaml`](./openapi.yaml).

---

## 7. Modelo de dados

Definido em `server/prisma/schema.prisma`.

| Entidade | Descrição |
|---|---|
| `Company` | Empresa solicitante |
| `AccommodationRequest` | Solicitação de hospedagem (protocolo, período, pessoas, preferências) |
| `AccommodationRequirement` | Serviços necessários de uma solicitação |
| `Partner` | Estabelecimento parceiro |
| `RoomType` | Configuração de quartos de um parceiro |
| `PartnerService` | Serviços disponíveis de um parceiro |
| `PartnerImage` | Fotos do parceiro |
| `Negotiation` | Vínculo entre solicitação e parceiro (status e diária) |
| `Proposal` | Proposta financeira (valores e taxa) |
| `Contract` | Contrato fechado a partir de uma proposta |
| `AdminUser` | Usuário do painel administrativo |
| `Setting` | Configurações (taxa de captação) |

### Campos principais

- **Company:** `legalName`, `tradeName`, `cnpj`, `contactName`, `contactRole`, `contactEmail`, `contactPhone`.
- **AccommodationRequest:** `protocol` (ex.: `SOL-000005`), `companyId`, `numberOfGuests`, `checkIn`, `checkOut`, `workLocation`, `accommodationPreference` (JSON), `budgetRange`, `notes`, `internalNotes`, `status`.
- **Partner:** `legalName`, `tradeName`, `cnpj`, `contactName`, `phone`, `whatsapp`, `email`, `address`, `availableCapacity`, `status`, `notes`.
- **RoomType:** `name`, `quantity`, `bedsPerRoom`, `priceType` (`DIARIA`/`PESSOA`/`QUARTO`/`SEMANAL`/`MENSAL`), `price`.
- **Proposal:** `amount`, `commission`, `totalAmount`, `commissionPercentage`, `numberOfGuests`, `numberOfDays`, `dailyRate`.
- **Contract:** `accommodationAmount`, `commissionPercentage`, `commissionAmount`, `totalAmount`, `status`.

---

## 8. Status e enums

> Os status são armazenados como `String` (não enums do banco) para manter a compatibilidade com SQLite e simplificar a migração para PostgreSQL. Os rótulos em português ficam em `client/src/lib/constants.ts`.

**Solicitação (`RequestStatus`):** `NOVA`, `EM_ANALISE`, `BUSCANDO_HOSPEDAGEM`, `PROPOSTA_ENVIADA`, `EM_NEGOCIACAO`, `APROVADA`, `CONTRATO_FECHADO`, `CANCELADA`.

**Parceiro (`PartnerStatus`):** `PENDING`, `ACTIVE`, `INACTIVE`.

**Negociação (`NegotiationStatus`):** `AGUARDANDO_RETORNO`, `DISPONIVEL`, `INDISPONIVEL`, `NEGOCIANDO`, `SELECIONADO`, `RECUSADO`.

**Proposta (`ProposalStatus`):** `ABERTA`, `ENVIADA`, `ACEITA`, `RECUSADA`, `CONVERTIDA`.

**Contrato (`ContractStatus`):** `AGUARDANDO_ASSINATURA`, `ATIVO`, `FINALIZADO`, `CANCELADO`.

**Serviços (`RequirementType`):** `BREAKFAST`, `LUNCH`, `DINNER`, `LAUNDRY`, `PARKING`, `WIFI`, `AIR_CONDITIONING`, `KITCHEN`, `RECEPTION_24H`, `OTHER`.

---

## 9. Regras de negócio

1. A empresa solicitante **não escolhe** a hospedagem pelo site; a equipe interna analisa e entra em contato.
2. Os estabelecimentos **não aparecem publicamente** no site nesta versão.
3. Toda negociação é **intermediada** pela empresa gestora.
4. A plataforma registra **qual parceiro originou cada proposta**.
5. A taxa padrão de captação é **10%** e é **configurável** em `/admin/configuracoes`.
6. A empresa intermediadora realiza **inicialmente a cobrança**.
7. A empresa fica **vinculada à negociação/contrato** para controle de comissão e recorrência.

---

## 10. Cenário de demonstração (seed)

O seed (`server/prisma/seed.ts`) cria:

- **Admin:** `admin@hospedalink.com.br` / `admin123`.
- **Parceiros:** Hotel Executivo Jataí (ativo), Alojamento Central (ativo), Hotel Business (pendente).
- **Cenário principal:** Construtora Horizonte Ltda. — 12 colaboradores, 01/10 a 21/10 (20 dias), café da manhã, lavanderia e estacionamento, preferência por quarto duplo. Parceiro selecionado: Hotel Executivo Jataí, a R$ 80/pessoa/dia:
  - Hospedagem: `12 × 20 × R$ 80 = R$ 19.200`
  - Taxa de captação (10%): `R$ 1.920`
  - Total negociado: `R$ 21.120`
- **Solicitações adicionais** para preencher o dashboard.

Novas solicitações recebem protocolos sequenciais. O backend possui retry para colisões de protocolo quando duas empresas enviam o formulário ao mesmo tempo.

---

## 11. Configurações

| Onde | O que |
|---|---|
| `/admin/configuracoes` | Taxa de captação padrão (armazenada em `Setting`) |
| `server/.env` | `DATABASE_URL`, `JWT_SECRET`, `PORT` |

---

## 12. Manutenção

Toda alteração no sistema (rotas, modelos, campos, enums, rótulos, validações ou endpoints) deve atualizar, **na mesma entrega**, a documentação, as interfaces front↔back e o Swagger. Veja o checklist completo em [`docs/CONTRIBUTING.md`](./CONTRIBUTING.md).

### Direção visual da landing page

A landing segue a direção **Central operacional local**. A comunicação deve parecer uma operação especializada de hospedagem corporativa, não um marketplace de turismo ou uma landing page SaaS genérica.

- Priorizar conteúdo operacional real: equipe, período, local do projeto e necessidades.
- Usar divisores, listas e hierarquia tipográfica antes de criar novos cards.
- Reservar o verde para ações e estados positivos.
- Evitar gradientes decorativos, métricas genéricas e componentes flutuantes sem função.
- Manter a linguagem direta, com foco em informar, consultar, negociar e apresentar.
