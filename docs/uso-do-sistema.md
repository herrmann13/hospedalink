# Hospeda Link — Guia de Uso do Sistema

> Protótipo de uma central de hospedagem corporativa em Jataí-GO. A plataforma capta a demanda de empresas que precisam hospedar equipes temporárias, e a equipe interna negocia com hotéis, pousadas e alojamentos parceiros.

---

## 1. Visão geral

O **Hospeda Link** conecta empresas a estabelecimentos de hospedagem em Jataí. O fluxo central é:

**Empresa acessa o site → entende o serviço → preenche o formulário → a solicitação aparece no painel administrativo → o operador consulta parceiros → cadastra opções e valores → registra a negociação → fecha uma proposta → converte em contrato.**

O sistema exibe parceiros ativos em catálogo público, mas **não** faz reserva automática nem processa pagamento online. Toda negociação é intermediada pela equipe interna.

---

## 2. Arquitetura e tecnologias

| Camada | Tecnologia | Local |
|---|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 + React Router v7 + TanStack Query + React Hook Form + Zod + motion + Phosphor Icons | `client/` |
| Backend | Express 5 + Prisma + PostgreSQL + jose (JWT) + bcryptjs + Zod | `server/` |
| Gerenciador | Bun (runtime + package manager) | monorepo na raiz |

O banco é **PostgreSQL**, hospedado no Railway (serviço `Postgres`). O desenvolvimento local também conecta nesse banco pela URL pública (`DATABASE_PUBLIC_URL`). **Atenção:** os dados locais são os dados reais; evite testes destrutivos.

---

## 3. Como rodar

### Pré-requisitos

- [Bun](https://bun.sh) (versão 1.3+)

### Instalação e execução

```bash
bun install          # instala as dependências dos dois workspaces
cp server/.env.example server/.env   # e preencha (veja abaixo)
bun run db:migrate   # aplica as migrations pendentes (normalmente nenhuma)
bun run dev          # sobe frontend (Vite :5173) e API (Express :3001)
```

### Scripts disponíveis

| Comando | O que faz |
|---|---|
| `bun run dev` | Sobe frontend + backend em modo desenvolvimento |
| `bun start` | Aplica as migrations (`prisma migrate deploy`), inicializa o seed se necessário e sobe o servidor de produção |
| `bun run build` | Gera o client de produção e o Prisma Client |
| `bun run db:migrate` | Aplica as migrations pendentes de `server/prisma/migrations` |
| `bun run db:seed` | Cria o admin inicial (se ainda não existir) e a taxa de captação padrão |

### Acessos

- **Site:** http://localhost:5173
- **Painel administrativo:** http://localhost:5173/admin
- **Login do admin:** e-mail de `ADMIN_EMAIL` (padrão `admin@hospedalink.com.br`) e senha de `ADMIN_PASSWORD`, definidos no Railway

O `server/.env` contém `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` e `PORT`. Este arquivo é ignorado pelo git (`.env*`) e deve ser recriado em um clone novo. Use `server/.env.example` como referência (versionado, com todas as variáveis comentadas). Para obter a URL do banco: `railway variables --service Postgres` (campo `DATABASE_PUBLIC_URL`). Em produção, `JWT_SECRET` e `CLIENT_ORIGIN` são obrigatórios. O segredo deve ser uma chave longa e aleatória, e `CLIENT_ORIGIN` deve conter apenas a URL pública do frontend.

No Railway, o projeto usa `railway.json`, serve o build do React pelo Express e expõe `/api/health` como health check. As variáveis de produção devem ser configuradas no serviço, nunca no frontend.

---

### Variáveis de ambiente

| Variável | Obrigatória | Railway (`web`) | Local (`server/.env`) |
|---|---|---|---|
| `DATABASE_URL` | Sim | `${{Postgres.DATABASE_URL}}` (rede interna) | `DATABASE_PUBLIC_URL` do serviço Postgres |
| `JWT_SECRET` | Sim | Chave aleatória (`openssl rand -hex 32`) | Chave aleatória própria |
| `CLIENT_ORIGIN` | Em produção | `https://web-production-cc741.up.railway.app` | `http://localhost:5173` |
| `PORT` | Não | Definida pelo Railway | `3001` |
| `ADMIN_EMAIL` | Não | `admin@hospedalink.com.br` | Mesmo valor |
| `ADMIN_PASSWORD` | No primeiro seed | Senha forte (mín. 12 caracteres) | Não necessária depois do primeiro seed |
| `S3_BUCKET` | Para fotos | Nome do bucket (Railway Bucket) | Mesmo bucket |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Para fotos | Credenciais do bucket (`railway bucket credentials`) | Mesmas credenciais |
| `S3_ENDPOINT` / `S3_REGION` | Para fotos | Endpoint S3 e região do bucket | Mesmos valores |
| `NODE_ENV` | — | `production` (definida no `Dockerfile`) | — |

### Alterando o schema (migrations)

O banco usa **Prisma Migrate**; não use `prisma db push` nem `prisma migrate dev`/`reset`, pois o banco do dev é o de produção.

1. Edite `server/prisma/schema.prisma`.
2. Gere o SQL comparando o banco atual com o schema:
   ```bash
   mkdir server/prisma/migrations/<N>_<descricao>
   bun run --cwd server db:migrate:diff > server/prisma/migrations/<N>_<descricao>/migration.sql
   ```
3. Revise o SQL (atenção a `DROP COLUMN`/`DROP TABLE`, que apagam dados).
4. Faça commit da migration. O deploy no Railway aplica automaticamente (`bun start` → `prisma migrate deploy`). Para aplicar antes, rode `bun run db:migrate`.

---

## 4. Rotas da aplicação

### Públicas

| Rota | Descrição |
|---|---|
| `/` | Landing page (hero, como funciona, benefícios, para empresas, parceiros, diferenciação) |
| `/solicitar-hospedagem` | Formulário de solicitação em 4 etapas |
| `/parceiros` | Catálogo público de parceiros ativos: abas por categoria, busca por nome/endereço, filtros por nº de pessoas e comodidades |
| `/parceiros/:id` | Detalhe público do parceiro (fotos, acomodações, preços, comodidades). Sem contatos, CNPJ ou observações internas |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |

### Administrativas (requerem login)

> O painel não tem link em nenhuma página pública: acesse digitando `/admin` na URL (redireciona para `/admin/login`).

| Rota | Descrição |
|---|---|
| `/admin/login` | Login da equipe interna |
| `/admin` | Dashboard com métricas da operação |
| `/admin/solicitacoes` | Lista de solicitações |
| `/admin/solicitacoes/:id` | Detalhe da solicitação (status, negociações, propostas, contrato) |
| `/admin/parceiros` | Lista de parceiros com abas por categoria, busca (nome, endereço, responsável, CNPJ) e filtros por nº de pessoas, status e comodidades |
| `/admin/parceiros` (menu ⋮ de cada linha) | Ver cadastro, Fotos, Editar, Aprovar (pendentes) e Excluir |
| `/admin/parceiros/novo` | Cadastro de parceiro (somente pela equipe interna) |
| `/admin/parceiros/:id` | Detalhe do parceiro (aprovação, categoria, quartos, serviços, upload/remoção de fotos) |
| `/admin/parceiros/:id/editar` | Edição completa do parceiro |
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

O detalhe de um parceiro leva ao formulário com `?parceiro=<id>`. O formulário consulta o cadastro público e permite remover essa preferência. Ao enviar, inclui o nome e a referência do parceiro em `notes`, visíveis nas observações da solicitação no painel. É uma preferência declarada pelo solicitante, não uma reserva ou negociação automaticamente vinculada. O contrato da API e o schema do banco permanecem os mesmos.

Preços e capacidade são referenciais, sujeitos à confirmação para o período solicitado. Catálogo vazio ou sem resultados oferece acesso à cotação; falhas de carregamento permitem nova tentativa. Termos e privacidade abrem em nova aba para preservar o formulário. O retorno é pelo contato informado; não há WhatsApp oficial configurado no site.

### 5.2 Fluxo de parceiros

Não existe cadastro público de parceiros. A equipe interna:

1. Acessa `/admin/parceiros` → **Novo parceiro** e informa dados básicos, categoria, status, vagas, tipos de quarto, comodidades e observações internas.
2. Na página do parceiro, adiciona até 10 fotos (JPEG, PNG ou WEBP, até 5 MB cada), armazenadas no bucket S3 do Railway.
3. Parceiros com status **ATIVO** aparecem no catálogo público `/parceiros`; **PENDENTE** e **INATIVO** ficam ocultos.

O visitante navega pelo catálogo, filtra por categoria, quantidade de pessoas e comodidades, e segue para **Solicitar hospedagem**.

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
| GET | `/api/partners` | Catálogo: parceiros ativos (sem contatos/CNPJ/observações) |
| GET | `/api/partners/:id` | Detalhe público de um parceiro ativo |
| GET | `/api/partner-images/:id` | Redireciona (302) para URL assinada da foto no bucket |

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
| POST | `/api/admin/partners` | Cadastra parceiro |
| PUT | `/api/admin/partners/:id` | Atualiza todos os dados do parceiro (substitui quartos e comodidades) |
| PATCH | `/api/admin/partners/:id` | Atualiza parceiro (ex.: aprovar, alterar categoria) |
| DELETE | `/api/admin/partners/:id` | Exclui parceiro, quartos, comodidades e fotos (409 se houver negociações, propostas ou contratos) |
| POST | `/api/admin/partners/:id/images` | Envia uma foto (corpo binário, `Content-Type: image/jpeg|png|webp`, máx. 5 MB) |
| DELETE | `/api/admin/partners/:id/images/:imageId` | Remove uma foto (do banco e do bucket) |
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
- **AccommodationRequest:** `protocol` (ex.: `SOL-000005`), `companyId`, `numberOfGuests`, `checkIn`, `checkOut`, `workLocation`, `accommodationPreference` (array de texto), `budgetRange`, `notes`, `internalNotes`, `status`.
- **Partner:** `legalName`, `tradeName`, `cnpj`, `contactName`, `phone`, `whatsapp`, `email`, `address`, `category`, `availableCapacity`, `status`, `notes`.
- **RoomType:** `name`, `quantity`, `bedsPerRoom`, `priceType` (`DIARIA`/`PESSOA`/`QUARTO`/`SEMANAL`/`MENSAL`), `price`.
- **Proposal:** `amount`, `commission`, `totalAmount`, `commissionPercentage`, `numberOfGuests`, `numberOfDays`, `dailyRate`.
- **Contract:** `accommodationAmount`, `commissionPercentage`, `commissionAmount`, `totalAmount`, `status`.

---

## 8. Status e enums

> Os status são armazenados como `String` (não enums do banco) para manter a portabilidade entre bancos. Os rótulos em português ficam em `client/src/lib/constants.ts`.

**Solicitação (`RequestStatus`):** `NOVA`, `EM_ANALISE`, `BUSCANDO_HOSPEDAGEM`, `PROPOSTA_ENVIADA`, `EM_NEGOCIACAO`, `APROVADA`, `CONTRATO_FECHADO`, `CANCELADA`.

**Parceiro (`PartnerStatus`):** `PENDING`, `ACTIVE`, `INACTIVE`.

**Categoria do parceiro (`PartnerCategory`):** `HOTEL`, `POUSADA`, `ALOJAMENTO`, `APART_HOTEL`, `HOSTEL`, `CASA` (padrão `HOTEL`).

**Negociação (`NegotiationStatus`):** `AGUARDANDO_RETORNO`, `DISPONIVEL`, `INDISPONIVEL`, `NEGOCIANDO`, `SELECIONADO`, `RECUSADO`.

**Proposta (`ProposalStatus`):** `ABERTA`, `ENVIADA`, `ACEITA`, `RECUSADA`, `CONVERTIDA`.

**Contrato (`ContractStatus`):** `AGUARDANDO_ASSINATURA`, `ATIVO`, `FINALIZADO`, `CANCELADO`.

**Serviços (`RequirementType`):** `BREAKFAST`, `LUNCH`, `DINNER`, `LAUNDRY`, `PARKING`, `WIFI`, `AIR_CONDITIONING`, `KITCHEN`, `RECEPTION_24H`, `PRIVATE_BATHROOM`, `TV`, `MINIBAR`, `DAILY_CLEANING`, `BED_LINEN`, `EARLY_BREAKFAST`, `PACKED_MEAL`, `LARGE_VEHICLE_PARKING`, `MEETING_ROOM`, `ACCESSIBILITY`, `INVOICE`, `OTHER`.

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

## 10. Dados iniciais (seed)

O seed (`server/prisma/seed.ts`) roda no `bun start` e é idempotente. Ele cria apenas:

- **Admin:** e-mail `ADMIN_EMAIL` (padrão `admin@hospedalink.com.br`) com senha `ADMIN_PASSWORD` (obrigatória, mínimo de 12 caracteres).
- **Taxa de captação padrão:** 10% (`Setting.commissionRate`).

Não há dados de demonstração: parceiros, empresas e solicitações são cadastrados pelos fluxos reais.

Novas solicitações recebem protocolos sequenciais. O backend possui retry para colisões de protocolo quando duas empresas enviam o formulário ao mesmo tempo.

---

## 11. Configurações

| Onde | O que |
|---|---|
| `/admin/configuracoes` | Taxa de captação padrão (armazenada em `Setting`) |
| `server/.env` / Railway | `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN`, `PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `S3_*` |

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
