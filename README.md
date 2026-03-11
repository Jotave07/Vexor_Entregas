# VEXOR Entregas

Portal logistico inicial da VEXOR para o dominio `vexortech.cloud`, com foco em operacao interna e uso mobile por motoristas.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL

## Estrutura de pastas

```text
app/
  (auth)/login
  (backoffice)/dashboard
  (backoffice)/drivers
  (backoffice)/loads
  (backoffice)/orders
  (driver)/driver
  (driver)/driver/orders/[id]
  api/
components/
  auth/
  ui/
docs/
lib/
prisma/
```

## Perfis de acesso

- `ADMIN`: controle total do portal.
- `MANAGER`: gestao operacional.
- `OPERATOR`: expedicao e acompanhamento.
- `DRIVER`: consulta de cargas e atualizacao de entrega.

## Funcionalidades iniciais entregues

- autenticacao com cookie JWT
- painel operacional
- sincronizacao/listagem de motoristas
- listagem de pedidos faturados
- gestao visual de cargas
- portal do motorista com filtro por cadastro
- atualizacao de status com historico
- ocorrencias e comprovantes preparados em modelo e API
- endpoints de integracao preparados para Winthor via n8n
- fila de eventos para automacoes do n8n

## Como subir

1. Instale as dependencias com `npm install`.
2. Copie `.env.example` para `.env`.
3. Ajuste `DATABASE_URL` e `JWT_SECRET`.
4. Configure `WINTHOR_SHARED_SECRET` e `N8N_SHARED_SECRET`.
5. Rode `npx prisma generate`.
6. Rode `npx prisma migrate dev`.
7. Rode `npx prisma db seed`.
8. Inicie com `npm run dev`.

Exemplo de `DATABASE_URL` para PostgreSQL:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/vexor_entregas?schema=public"
WINTHOR_SHARED_SECRET="seu-token-do-fluxo-winthor"
N8N_SHARED_SECRET="seu-token-do-n8n"
```

## Fluxo recomendado com n8n e Winthor

- Winthor envia motoristas e pedidos para o portal por fluxos do n8n.
- O portal nao depende do ERP diretamente: recebe dados sincronizados via endpoints protegidos por token.
- O motorista altera status no portal.
- O portal gera eventos internos para o n8n decidir:
  - se o contato do cadastro no Winthor e valido
  - se deve devolver status ao ERP
  - se dispara automacoes de notificacao, auditoria ou excecao

## Endpoints de integracao

- `POST /api/integrations/winthor/drivers`
- `POST /api/integrations/winthor/orders`
- `GET /api/integrations/n8n/events`
- `POST /api/integrations/n8n/events/[id]/ack`
- `POST /api/integrations/n8n/webhooks/status`

## Deploy na Hostinger

Arquivos preparados para producao:

- `Dockerfile`
- `.dockerignore`
- `docker-compose.hostinger.yml`

### Variaveis de ambiente de producao

Use estas variaveis no container/app da Hostinger:

```env
DATABASE_URL="postgresql://VITOR:%23Joaovitor07@srv1479772.hstgr.cloud:32772/VEXOR_ENTREGAS?schema=public"
JWT_SECRET="defina-uma-chave-forte"
WINTHOR_SHARED_SECRET="token-do-fluxo-winthor"
N8N_SHARED_SECRET="token-do-fluxo-n8n"
NODE_ENV="production"
PORT="3000"
```

### Fluxo recomendado de deploy

1. Suba este projeto para um repositorio no GitHub.
2. Na Hostinger, crie um novo projeto/container para o app.
3. Use o `Dockerfile` deste repositorio para fazer o build.
4. Configure as variaveis de ambiente de producao.
5. Conecte o container a rede externa `n8n_default`.
6. Adicione as labels do Traefik ou use o `docker-compose.hostinger.yml`.
7. Implante o container.
8. Teste `https://vexortech.cloud`.

### Passos para enviar ao GitHub

No terminal do projeto, rode:

```powershell
cd "C:\Users\ADM\Desktop\Vexor Tracking"
git init
git add .
git commit -m "chore: prepare vexor entregas for hostinger deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

Se o Git ainda nao estiver instalado no Windows, instale o Git for Windows antes.

### O que nao enviar ao GitHub

- `.env`
- credenciais reais
- tokens de integracao

## Credenciais iniciais

- `admin@vexor.com.br` / `admin123`
- `motorista@vexor.com.br` / `driver123`
