# VEXOR Entregas

## Arquitetura inicial

- Frontend e backend unificados com `Next.js App Router`.
- Camada visual com `Tailwind CSS`, otimizada para desktop operacional e uso mobile do motorista.
- Persistencia com `Prisma + PostgreSQL`.
- Autenticacao por credenciais com cookie assinado em JWT.
- API interna e externa via `Route Handlers`, preparada para integracao com `Winthor` mediado pelo `n8n`.

## Modulos principais

- `auth`: login, sessao, controle de acesso por papel.
- `drivers`: base sincronizada do ERP com vinculo opcional de login no portal.
- `orders`: ingestao e acompanhamento de pedidos faturados do ERP.
- `loads`: montagem de cargas e vinculacao de pedidos.
- `delivery`: status, ocorrencias, comprovantes e historico auditavel.
- `integrations`: entrada Winthor via n8n, fila de eventos e retorno orquestrado ao ERP.

## Fluxo sugerido

1. O `n8n` recebe dados do Winthor e envia motoristas para `/api/integrations/winthor/drivers`.
2. O `n8n` envia pedidos faturados para `/api/integrations/winthor/orders`.
3. A operacao monta cargas em `/loads` e vincula motorista sincronizado.
4. O motorista acessa `/driver` e enxerga apenas cargas abertas em seu cadastro.
5. Status e ocorrencias sao enviados por `/api/driver/orders/[id]/status`.
6. O portal grava eventos de integracao e o `n8n` consome em `/api/integrations/n8n/events`.
7. O `n8n` toma decisoes de automacao e retorno ao Winthor com base em contato valido, regras e excecoes.

## Rotas principais

- `/login`
- `/dashboard`
- `/orders`
- `/loads`
- `/drivers`
- `/driver`
- `/driver/orders/[id]`
- `/api/orders`
- `/api/drivers`
- `/api/loads`
- `/api/integrations/winthor/drivers`
- `/api/integrations/winthor/orders`
- `/api/integrations/n8n/events`
- `/api/integrations/n8n/events/[id]/ack`
- `/api/integrations/n8n/webhooks/status`
