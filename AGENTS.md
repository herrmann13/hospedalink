# AGENTS.md — Regras para agentes e funcionamento do Hospeda Link

> Leia este arquivo inteiro antes de alterar qualquer coisa. Para detalhes de uso, rotas e modelo de dados, veja [`docs/uso-do-sistema.md`](docs/uso-do-sistema.md); o contrato da API está em [`docs/openapi.yaml`](docs/openapi.yaml); o checklist de manutenção, em [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md).

---

## 1. O que é o sistema

Central de hospedagem corporativa em Jataí-GO. Empresas que trazem equipes temporárias pedem hospedagem; a equipe interna da Hospeda Link negocia com hotéis, pousadas e alojamentos parceiros e ganha uma **taxa de captação** (comissão, padrão 10%) sobre o valor fechado.

Fluxo do negócio: **empresa solicita → admin associa parceiros (negociações) → cria propostas → converte em contrato.**

---

## 2. Regras de produto (não quebre)

### Site público (sem login)
- O visitante só pode: ver a landing, **navegar pelo catálogo de parceiros** (`/parceiros`, `/parceiros/:id`) e **solicitar hospedagem** (`/solicitar-hospedagem`).
- **Não existe cadastro público de parceiros.** Não recrie `/seja-parceiro` nem `POST /api/partners`.
- O catálogo mostra **apenas parceiros com status `ACTIVE`**. `PENDING` e `INACTIVE` respondem 404 no público.
- O catálogo **nunca expõe** CNPJ, razão social, responsável, telefone, WhatsApp, e-mail, observações internas ou status. Use sempre `serializePublicPartner` (server/src/lib/serialize.ts). O contato passa pela Hospeda Link — expor contatos quebra o modelo de comissão.
- Filtros do catálogo (e do admin): **categoria**, **busca**, **nº de pessoas** (`availableCapacity >= N`) e **comodidades** (o parceiro precisa ter *todas* as selecionadas). A lógica é compartilhada em `client/src/components/partners/PartnerFilters.tsx`; não duplique.

### Painel administrativo
- Acessível **somente digitando `/admin` na URL**. Nenhuma página pública pode ter link, botão ou menção ao admin.
- Todas as rotas `/api/admin/*` usam `requireAuth` (cookie JWT). Toda rota admin nova deve usar o mesmo middleware.
- Parceiros são cadastrados e editados **só pela equipe interna** (`/admin/parceiros/novo`, `/admin/parceiros/:id/editar`). Fotos são gerenciadas no detalhe do parceiro.
- Cada linha de `/admin/parceiros` tem um menu ⋮ (`RowActions`): Ver cadastro, Fotos, Editar, Aprovar (pendentes) e Excluir.
- **Excluir parceiro** só é permitido sem negociações, propostas ou contratos vinculados (senão a API responde 409 e o caminho é marcar como `INACTIVE`). Nunca contorne isso apagando o histórico comercial.

### Dados de exemplo
- O banco de produção **não tem dados de demonstração**. O seed cria só o admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD`) e a taxa de captação. Não reintroduza parceiros, empresas ou contratos fictícios no seed.

---

## 3. Stack e estrutura

| Camada | Tecnologia |
|---|---|
| Front (`client/`) | React 19, Vite, TypeScript, Tailwind v4, React Router 7, TanStack Query, React Hook Form + Zod, Phosphor Icons |
| Back (`server/`) | Bun + Express 5, Prisma 6, PostgreSQL, Zod, jose (JWT), bcryptjs |
| Fotos | Bucket S3-compatível do Railway via `Bun.S3Client` (`server/src/lib/storage.ts`) |
| Deploy | Railway (Dockerfile + `railway.json`), serviço `web` + serviço `Postgres` |

```
client/src/
  pages/               páginas públicas (Home, CatalogoParceiros, ParceiroPublico, SolicitarHospedagem…)
  pages/admin/         páginas do painel
  components/partners/ filtros e helpers compartilhados entre catálogo e admin
  components/admin/    PageHeader, Sidebar, RowActions…
  components/ui/       Button, Badge, Modal, fields
  lib/                 api.ts, types.ts, validators.ts, constants.ts, masks.ts
server/
  prisma/schema.prisma, prisma/migrations/, prisma/seed.ts
  src/routes/          public.ts, auth.ts, admin/*.ts
  src/lib/             serialize.ts, statuses.ts, partnerInput.ts, storage.ts, prisma.ts, jwt.ts
```

---

## 4. Regras de código

1. **Idioma:** código pode ter nomes em inglês, mas todo texto visível ao usuário é **pt-BR**.
2. **Validação dupla:** toda entrada é validada no front (Zod em `validators.ts`) **e** no back (Zod no endpoint). Nunca confie só no front.
3. **Serializers explícitos:** respostas da API passam por funções de `serialize.ts`. Nunca retorne entidade Prisma direto nem com spread (`...entity`).
4. **Enums como `String`:** status, categorias e serviços são texto no banco. Valores permitidos ficam em `server/src/lib/statuses.ts` (Zod), `client/src/lib/types.ts` e rótulos em `client/src/lib/constants.ts`.
5. **Mudou contrato? Atualize tudo na mesma entrega** (ver `docs/CONTRIBUTING.md`): `types.ts`, `validators.ts`, `constants.ts`, rotas, `serialize.ts`, `schema.prisma` + migration, `docs/uso-do-sistema.md` e `docs/openapi.yaml`.
6. **Reaproveite antes de criar:** filtros (`PartnerFilters`), menu de ações (`RowActions`), `Modal`, `Button` (variantes `primary`, `secondary`, `outline`, `ghost`, `accent`, `danger`), `Field/Input/Select`.
7. **Dropdowns dentro de tabelas** devem usar portal (como `RowActions`), senão o `overflow` da tabela corta o menu.
8. **Nada de `alert`/`confirm` do navegador.** Use `Modal` para confirmações.
9. **Upload de imagem:** corpo binário com `Content-Type: image/jpeg|png|webp`, máx. 5 MB, 10 fotos por parceiro. O tipo real é conferido pelos bytes (`detectImageType`). O banco guarda a **chave** do objeto; o front recebe `/api/partner-images/:id`, que redireciona para uma URL assinada temporária. O bucket não é público.
10. **Valores monetários** são `Float` em reais, formatados com `formatBRL`.

---

## 5. Banco de dados — regras críticas

- **O `server/.env` local aponta para o Postgres de PRODUÇÃO** (via proxy TCP público do Railway). Tudo que você roda localmente mexe em dados reais.
- **Proibido:** `prisma db push`, `prisma migrate dev`, `prisma migrate reset`, `--force-reset`, `DROP`/`TRUNCATE` em tabelas reais, ou scripts que apaguem dados.
- **Mudança de schema:**
  1. Edite `server/prisma/schema.prisma`.
  2. `mkdir server/prisma/migrations/<N>_<descricao>`
  3. `bun run --cwd server db:migrate:diff > server/prisma/migrations/<N>_<descricao>/migration.sql`
  4. **Revise o SQL** (cuidado com `DROP COLUMN`/`DROP TABLE`; confirme que a tabela afetada está vazia antes).
  5. `bun run db:migrate` aplica; o deploy também aplica (`prisma migrate deploy` no `bun start`).
- **Testes que escrevem dados:** crie um banco temporário no mesmo servidor (`CREATE DATABASE hl_tmp` via `prisma db execute --url`), aponte `DATABASE_URL` para ele, rode `db:migrate` + `db:seed`, teste, e faça `DROP DATABASE hl_tmp` no fim. Nunca teste escrita no banco `railway`.
- Indexe chaves estrangeiras e campos filtrados (`@@index`) — o Postgres não cria índices de FK automaticamente.

---

## 6. Variáveis de ambiente

Modelo versionado em `server/.env.example`. Em produção ficam no serviço `web` do Railway; **nunca** em `client/`, no bundle Vite ou em arquivos versionados.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Postgres. Railway: `${{Postgres.DATABASE_URL}}`; local: `DATABASE_PUBLIC_URL` do serviço Postgres |
| `JWT_SECRET` | Assinatura do login (64+ caracteres aleatórios) |
| `CLIENT_ORIGIN` | Origem(ns) permitidas no CORS; obrigatória em produção |
| `PORT` | Definida pelo Railway; local `3001` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin inicial criado pelo seed (só se o e-mail ainda não existir; senha ≥ 12 caracteres) |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT`, `S3_REGION` | Bucket das fotos. Sem elas o sistema funciona, mas o upload responde 503 |

**Nunca imprima segredos** (senhas, chaves, URLs com credenciais) em logs, saídas de comando ou mensagens. Ao inspecionar variáveis, mostre só nomes ou o host.

---

## 7. Comandos

```bash
bun install                      # dependências (use --frozen-lockfile em CI/deploy)
bun run dev                      # front :5173 + API :3001 (API usa server/.env)
bun run build                    # prisma generate + tsc + vite build — rode antes de entregar
bun run db:migrate               # aplica migrations pendentes
bun run db:seed                  # cria o admin inicial se não existir
bun run --cwd server db:migrate:status
bun run --cwd server db:migrate:diff   # SQL da diferença banco → schema
```

Checagem de tipos: `cd client && bunx tsc -b` e `cd server && bunx tsc --noEmit -p .` (há erros antigos conhecidos em `auth.ts`/`bcryptjs`; não introduza novos).

---

## 8. Deploy (Railway)

- **Antes de qualquer comando `railway`, rode `railway status`** e confirme `Project: HospedaLink` / `Environment: production`. Esta pasta já esteve vinculada por engano ao projeto `construction-monitor`; se acontecer de novo: `railway link -p HospedaLink -e production`.
- O serviço `web` **não** faz deploy automático no push. Publicar é `railway up --service web --detach` — ação de produção: **só com autorização explícita do usuário**.
- Ao alterar variáveis do `web` sem querer redeploy imediato, use `--skip-deploys`.
- O start em produção roda: `prisma migrate deploy` → seed (idempotente) → servidor. O health check é `/api/health`.
- `railway.json` (Config as Code) está obsoleto e deixa de funcionar em **01/12/2026**; migrar com `railway config migrate`.

---

## 9. Git

- Commits em português, no formato `tipo: descrição` (`feat:`, `fix:`, `chore:`, `refactor:`).
- Nunca commite `.env`, bancos locais, `client/tsconfig.tsbuildinfo` ou credenciais. Confira `git diff --cached --name-only` antes de commitar.
- Commit e push só quando o usuário pedir.

---

## 10. Checklist antes de dizer "pronto"

- [ ] `bun run build` passa.
- [ ] Regras da seção 2 continuam valendo (sem link para admin, sem cadastro público, catálogo sem contatos e só com ativos).
- [ ] Contrato atualizado em todos os lugares (seção 4, item 5), incluindo `docs/openapi.yaml` e `docs/uso-do-sistema.md`.
- [ ] Mudança de schema tem migration revisada; nenhum comando destrutivo foi usado.
- [ ] Testes que escrevem dados rodaram em banco temporário, e ele foi removido.
- [ ] Nenhum segredo aparece no diff, em logs ou na resposta.
- [ ] Informe com honestidade o que **não** foi testado (ex.: telas não abertas no navegador, upload sem bucket).
