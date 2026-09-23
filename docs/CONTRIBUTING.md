# Contribuindo — Regras de manutenção do projeto

> Estas regras são **obrigatórias** para qualquer alteração no sistema. Leia antes de editar qualquer arquivo de código.

---

## Regra de manutenção (obrigatória)

Toda e qualquer alteração no sistema — **rotas, modelos, campos, enums de status, rótulos, validações ou endpoints** — deve atualizar, **na MESMA entrega**:

1. **Documentação** — [`docs/uso-do-sistema.md`](./uso-do-sistema.md) (guia de uso, fluxos, modelo de dados, status, scripts).
2. **Interfaces front ↔ back** — os tipos e validadores do front e os schemas/rotas do back:
   - `client/src/lib/types.ts`
   - `client/src/lib/validators.ts`
   - `client/src/lib/constants.ts` (rótulos e listas de opções)
   - `server/src/routes/*` (schemas de entrada e respostas)
   - `server/src/lib/serialize.ts` (serialização das entidades)
   - `server/prisma/schema.prisma` (modelo de dados)
3. **Swagger/OpenAPI** — [`docs/openapi.yaml`](./openapi.yaml) (o contrato de API).

**Não considere uma tarefa concluída enquanto qualquer um dos três estiver desatualizado.**

---

## Checklist antes de marcar como pronto

- [ ] Novo endpoint documentado no `docs/openapi.yaml` e no `docs/uso-do-sistema.md`.
- [ ] Novo campo ou enum refletido em `client/src/lib/types.ts` e nos schemas do back.
- [ ] Novo status ou rótulo atualizado em `client/src/lib/constants.ts`.
- [ ] Validação nova refletida em `client/src/lib/validators.ts` e no schema do endpoint.
- [ ] Consentimentos, datas e valores devem ser validados novamente no backend, mesmo quando já validados no frontend.
- [ ] Serialização atualizada em `server/src/lib/serialize.ts` quando a forma dos dados muda.
- [ ] Respostas da API usam serializers explícitos; não retornar entidades Prisma com spread (`...entity`).
- [ ] Segredos e variáveis de produção ficam no Railway, nunca em `client/`, no bundle Vite ou em arquivos versionados.
- [ ] Fluxos e comandos descritos no guia de uso seguem válidos.

---

## Convenções

- **Idioma:** o código e os textos visíveis usam português (pt-BR).
- **Stack:** React + Vite (client) e Express + Prisma (server), com Bun como runtime/gerenciador.
- **Status como `String`:** os enums de status são armazenados como texto (não enums do banco) para compatibilidade com SQLite e futura migração para PostgreSQL. O valor permitido fica documentado no `schema.prisma` (comentário) e em `constants.ts`.
- **Validação dupla:** toda entrada é validada no front (Zod) e no back (Zod no endpoint). Não confie só no front.
- **Formato de valores monetários:** números em reais são armazenados como `Float` e formatados com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.

---

## Como validar uma alteração

```bash
bun run build     # compila front e gera o Prisma Client
bun run db:reset  # recria o banco com o seed atualizado (se o schema mudou)
bun run dev       # testa o fluxo ponta a ponta
```
