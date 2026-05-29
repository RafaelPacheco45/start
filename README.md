# AutoZap Start

AutoZap Start é uma experiência mobile-first para transformar a ideia de uma loja de celulares, acessórios ou assistência em uma operação inicial organizada.

A versão atual prepara o produto para backend real, IA real, salvamento de leads, controle anti-abuso e futura integração com o AutoZap principal.

## Como Rodar Localmente

Sem build:

```bash
python -m http.server 4173
```

Abra:

```text
http://localhost:4173/
```

Também é possível abrir diretamente:

- `mobile.html`
- `desktop.html`
- `admin.html`

## Deploy

Dominio recomendado:

```text
https://start.autozap.log.br
```

Os caminhos de CSS, JS e assets usam `./` para funcionar em GitHub Pages e em dominio estatico.

## Estrutura

```text
AutoZap Start/
├── index.html
├── mobile.html
├── desktop.html
├── admin.html
├── css/
│   ├── theme.css
│   ├── mobile.css
│   ├── desktop.css
│   └── admin.css
├── js/
│   ├── config.js
│   ├── router.js
│   ├── api.js
│   ├── mobile.js
│   ├── desktop.js
│   ├── admin.js
│   └── healthcheck.js
├── tools/
│   └── healthcheck.js
├── assets/
│   ├── autozap-logo.png
│   ├── autozap-logo-mark.png
│   ├── hero-autozap-start.png
│   └── start-hero-banner.png
└── server/
    ├── package.json
    ├── server.js
    ├── .env.example
    └── README.md
```

## Fluxo Mobile

O mobile continua sendo a experiencia principal e esta alinhado em 7 etapas:

1. Entrada da marca
2. Nome e logo
3. Diagnostico inicial
4. Base legal da loja
5. Estoque inicial recomendado
6. Previa final da loja
7. Salvamento da loja

O contato só é pedido no final com a mensagem:

> Salve sua loja para não perder seu progresso.

## Desktop

O desktop agora segue o mesmo fluxo real de 7 etapas do mobile em formato de ferramenta:

- sidebar com progresso, etapas e status de sessao/API;
- painel central com a etapa atual;
- painel direito com previa viva da loja;
- geracao de identidade textual pela API real;
- imagem real via `POST /start/image`;
- fallback visual com iniciais se a imagem falhar;
- fornecedores reais via `GET /start/suppliers`;
- produtos reais via `GET /start/suppliers/:id/products`;
- selecao de produtos, quantidade e total estimado;
- salvamento via `POST /start/lead`.

O desktop nao depende de `server/server.js` em producao e nao ativa mock automaticamente.

## Admin

`admin.html` simula um painel operacional com:

- sessões iniciadas;
- lojas criadas;
- leads;
- gerações de texto;
- gerações de imagem;
- custo estimado;
- conversões AutoZap;
- bloqueios por abuso;
- leads recentes;
- sessões recentes.

As rotas admin, incluindo `/start/admin/metrics`, nao fazem parte do healthcheck de publicacao do Start estatico.

## Config Global

`js/config.js` expõe:

```js
var AUTOZAP_API_BASE_URL = "https://aip.autozap.log.br";

window.AUTOZAP_START_CONFIG = {
  version: "0.3.0",
  basePath: "./",
  apiBaseUrl: AUTOZAP_API_BASE_URL,
  mockMode: false,
  turnstileSiteKey: "",
  limits: {
    anonymousVisualGenerations: 1,
    anonymousTextGenerations: 20,
    dailyLimit: 30
  }
}
```

## API

`js/api.js` centraliza chamadas para a API real e mantem mocks apenas para teste manual com `USE_MOCK=1`:

- `createAnonymousSession()`
- `generateIdentity(payload)`
- `generateLogo(payload)`
- `generateBio(payload)`
- `generatePosts(payload)`
- `generateStockPlan(payload)`
- `generateSalesScripts(payload)`
- `generateStorePreview(payload)`
- `saveLead(payload)`
- `exportToAutoZap(payload)`
- `getAdminMetrics()`
- `getRecentLeads()`
- `getRecentSessions()`

Com `mockMode: false`, a camada chama `https://aip.autozap.log.br` nas rotas `/start/*`. `localhost` nao ativa mock automaticamente.

Rotas publicas principais:

- `GET /health`
- `GET /start/suppliers`
- `GET /start/suppliers/:id/products`
- `POST /start/session`
- `POST /start/lead`
- `POST /start/image`

Nao use `GET /start/session`; a rota correta e `POST /start/session`.

`/start/admin/metrics` foi removido dos testes obrigatorios de publicacao. Ele nao deve bloquear GitHub Pages.

## Geração Real de Imagem

O fluxo mobile de identidade chama `POST /start/image` depois do diagnostico textual.

- A chamada usa sessao Start via header `x-start-session`.
- A sessao e criada com `POST /start/session` e salva em `localStorage["autozap_start_session"]`.
- A resposta aceita `imageBase64` e `mimeType`, incluindo o formato `{ ok: true, imageBase64, mimeType }`.
- A UI converte a resposta em `data:image/png;base64,...` e exibe na previa/logo.
- Se a imagem falhar, o fluxo continua com iniciais da loja e mostra: `Imagem automática indisponível agora. Usamos uma prévia provisória.`
- Se a imagem passar do timeout, o fluxo continua com iniciais da loja e mostra: `A imagem demorou mais que o esperado. Usamos uma prévia provisória, mas você pode tentar novamente.`
- Se o backend retornar `429 start_image_rate_limited`, a UI mostra: `Limite de geração de imagem atingido. Tente novamente em alguns minutos.`
- O backend limita a 3 imagens por sessao/IP em 10 minutos.
- Timeouts: chamadas comuns usam `requestTimeoutMs` de 15000 ms, diagnostico usa `diagnosticRequestTimeoutMs` de 30000 ms e imagem usa `imageRequestTimeoutMs` de 60000 ms, porque a geracao real de imagem pode demorar mais que as chamadas comuns.
- Com `DEBUG_API=1`, o console mostra endpoint, timeout usado, status, aborto por timeout, recebimento de imagem, sessao e modelo, mas nao imprime o `imageBase64` inteiro.

## Backend Opcional

Backend de desenvolvimento local em Node.js + Express:

```bash
cd server
npm install
npm run dev
```

Endpoints preparados:

- `GET /api/start/health`
- `POST /api/start/session`
- `POST /api/start/identity`
- `POST /api/start/logo`
- `POST /api/start/posts`
- `POST /api/start/stock-plan`
- `POST /api/start/leads`
- `POST /api/start/export-autozap`

## Anti-Abuso

Preparado no frontend:

- `anonymousSessionId`
- `generationCount`
- `textGenerationCount`
- `imageGenerationCount`
- `dailyUsage`
- `riskLevel`

Preparado no backend:

- `rateLimitMock`
- `detectRiskMock`
- `usageGuardMock`

Regra de desenvolvimento local:

- visitante anônimo: 1 geração visual completa;
- texto: limite maior;
- limite atingido retorna `LIMIT_REACHED`.

## Turnstile

Cloudflare Turnstile ainda não aparece no frontend.

Preparado:

- `turnstileSiteKey` no config;
- `TURNSTILE_SECRET_KEY` no `.env.example`;
- `verifyTurnstileMock()` no backend.

## Exportação AutoZap

`exportToAutoZap(payload)` gera um pacote com:

- identidade;
- cores;
- cidade e capital;
- produtos e serviços;
- canais digitais;
- posts;
- scripts comerciais;
- plano de estoque;
- contexto de IA;
- `source: "autozap-start"`.

O JSON aparece no console, modal e está preparado para `POST /api/start/export-autozap`.

## Healthcheck

```bash
node tools/healthcheck.js
```

O healthcheck valida:

- arquivos HTML/CSS/JS locais;
- sintaxe dos JS principais com `node --check`;
- `version: "0.3.0"`;
- `mockMode: false`;
- 7 etapas mobile;
- API publica em `https://aip.autozap.log.br`;
- `POST /start/session`, sem testar `GET /start/session`;
- CORS de `/start/suppliers`.

Saída esperada:

```text
AutoZap Start Healthcheck OK
```

## Teste Manual Desktop

```js
localStorage.removeItem("USE_MOCK")
localStorage.setItem("DEBUG_API", "1")
```

Abrir:

```text
http://localhost:4173/desktop.html
```

Validar:

- 7 etapas no desktop;
- `POST /start/session`;
- diagnostico textual por rota real configurada;
- `POST /start/image`;
- `GET /start/suppliers`;
- `GET /start/suppliers/:id/products`;
- selecao de produtos e total estimado;
- `POST /start/lead`;
- fallback com iniciais se imagem falhar;
- timeout de imagem maior que o padrao para acomodar a geracao real.

## Próximas Integrações

- IA textual real;
- banco de dados;
- Cloudflare Turnstile;
- analytics reais;
- integração com AutoZap principal;
- autenticação opcional depois do valor percebido.

