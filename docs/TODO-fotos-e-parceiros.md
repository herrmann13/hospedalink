# TODO — preparar cadastro de parceiros e fotos

Checklist para habilitar o cadastro real de parceiros e o envio de fotos no Hospeda Link. **Não executar alterações de produção sem autorização explícita.**

Última verificação: 20/10/2026.

## Estado verificado

- [x] Railway `HospedaLink` / `production`: serviços `web` e `Postgres` online; `/api/health` respondeu `{"ok":true}`.
- [x] Banco acessível e sem registros comerciais: 0 parceiros, empresas, solicitações, negociações, propostas e contratos. Há 1 admin e 1 configuração, compatíveis com o seed esperado.
- [x] `main` local está sincronizada com `origin/main`, no commit `c84ffda`.
- [ ] **Deploy atualizado:** o deploy online está no commit `64134f2`, de 23/09/2026, diferente do `main` atual. Os metadados do deploy mencionam `empreenda-site`, enquanto o serviço aparece vinculado a `hospedalink`; confirmar a origem correta antes de publicar.
- [ ] **Bucket:** não há Railway Bucket listado em `production` e o serviço `web` não tem variáveis `S3_*`. O envio de fotos está desabilitado; a API deve responder 503 até configurar o armazenamento.

## 1. Confirmar e atualizar o deploy

- [ ] Conferir no Railway que o projeto e ambiente selecionados são `HospedaLink` / `production` (`railway status`).
- [ ] Confirmar que o serviço `web` está conectado ao repositório `herrmann13/hospedalink` e à branch `main` — não ao `empreenda-site`.
- [ ] Conferir que o próximo build/deploy usa o commit atual de `main` (`c84ffda` ou mais recente) e que a aplicação inicia sem erros.
- [ ] Verificar o status das migrations antes de publicar. Não usar `prisma db push`, `prisma migrate dev` ou `prisma migrate reset`.
- [ ] Publicar somente após autorização explícita. Antes de qualquer comando Railway, confirmar novamente projeto e ambiente. O deploy de produção pode aplicar migrations e executar o seed no start.
- [ ] Após publicar, confirmar deploy `SUCCESS`, `/api/health` saudável e login em `/admin`.

## 2. Configurar o armazenamento de fotos

- [ ] Criar um Railway Bucket no projeto/ambiente de produção. Escolher uma região próxima ao serviço `web`, conforme as opções disponíveis no Railway.
- [ ] Obter as credenciais S3 do bucket pelo fluxo seguro do Railway.
- [ ] Configurar **somente no serviço `web` de produção** estas variáveis:
  - `S3_BUCKET`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_ENDPOINT`
  - `S3_REGION`
- [ ] Não colocar credenciais em `client/`, arquivos versionados, documentação, mensagens ou logs. Não compartilhar a saída de comandos que exibam valores de variáveis/credenciais.
- [ ] Aplicar as variáveis e reiniciar/republicar `web` para que o processo inicialize o cliente S3 com a configuração nova.
- [ ] Confirmar no Railway que o bucket existe e que as cinco variáveis estão definidas — conferir nomes/status, nunca copiar valores secretos para o checklist.

## 3. Cadastrar o primeiro parceiro real

- [ ] Confirmar que um operador consegue entrar no painel em `/admin` com a conta já existente. Se não houver acesso, resolver a credencial pelo procedimento seguro; o seed não redefine a senha de um admin existente.
- [ ] Cadastrar o estabelecimento em `/admin/parceiros/novo`. O cadastro é interno: **não criar cadastro público de parceiros**.
- [ ] Usar informações reais e autorizadas: dados do estabelecimento e contato, endereço, categoria, capacidade, tipos de quarto, comodidades e observações internas.
- [ ] Escolher o status conscientemente: somente parceiros `ACTIVE` aparecem no catálogo público; `PENDING` e `INACTIVE` permanecem ocultos.
- [ ] Salvar o cadastro antes de adicionar fotos. A área de fotos fica na página de detalhe do parceiro.

## 4. Enviar e validar fotos

- [ ] Na página do parceiro, enviar uma foto real/autorizada para validar a integração antes de carregar o restante.
- [ ] Usar JPEG, PNG ou WEBP, com até 5 MB por arquivo e no máximo 10 fotos por parceiro.
- [ ] Confirmar que a foto aparece no painel e que abre pelo endpoint de imagem. As imagens ficam em bucket privado e são servidas por URL assinada temporária; não tornar o bucket público.
- [ ] Se o parceiro estiver `ACTIVE`, confirmar que aparece em `/parceiros` e que as fotos carregam. Verificar também que o catálogo não expõe CNPJ, contatos ou observações internas.
- [ ] Só então carregar as demais fotos autorizadas. A remoção de fotos é permanente no bucket; conferir antes de excluir.

## Critério de conclusão

- [ ] O Railway está publicando o `main` atual do repositório correto.
- [ ] O bucket de produção existe e as variáveis S3 estão configuradas no serviço `web`, sem segredos no código.
- [ ] Um parceiro real foi cadastrado pelo painel e pelo menos uma foto foi enviada e validada.
- [ ] Parceiro `ACTIVE` aparece no catálogo sem dados de contato; `PENDING`/`INACTIVE` continuam ocultos.

## Regras de segurança

- Não inserir parceiros, empresas, solicitações ou fotos fictícios no banco de produção.
- Não rodar seed, migrations ou testes que escrevam dados sem avaliar o impacto no banco de produção e obter autorização.
- Não excluir parceiro com negociações, propostas ou contratos vinculados; nesses casos, usar `INACTIVE`.
