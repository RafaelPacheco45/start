# AutoZap Start Integration Audit

Data: 2026-05-24

## Estado anterior e pontos de mock

1. `mockMode` esta centralizado em `js/config.js` e lido em `js/api.js`. A producao usa `mockMode: false`; mock fica disponivel apenas via `mockMode === true`, `localStorage.USE_MOCK=1` ou `localStorage.USE_MOCK=true`.
2. `apiBaseUrl` fica em `js/config.js` e agora aponta para `https://aip.autozap.log.br`.
3. `localSuppliers` e `supplierProducts` fake continuam em `js/mobile.js`, mas agora so podem renderizar com mock explicitamente ativo.
4. O fluxo mobile escolhe fornecedor em `loadStartSuppliers`, `findRecommendedSupplier`, `generateRecommendedSupplier`, `renderRecommendedSupplier` e `renderSuppliers`.
5. O fluxo desktop usa fornecedores em `generateDesktopStock` e `renderDesktopFlow`; em producao ele tenta carregar `/start/suppliers` antes de usar qualquer plano mockado.
6. `saveLead` e chamado no mobile por `saveStoreAndExport` e implementado em `js/api.js` via `apiSaveStartLead`.
7. O server mock local esta em `server/server.js` e expoe somente rotas antigas `/api/start/*` para desenvolvimento.
8. Endpoints antigos `/api/start` ainda existem em `server/server.js`, `server/README.md`, `README.md` e em `devFallbackRoutes` de `js/config.js`.

## Endpoints reais usados

- `POST /start/session`
- `GET /start/suppliers`
- `GET /start/suppliers/:id/products`
- `POST /start/lead`
- `POST /start/diagnostic`, se existir
- `POST /start/image`, se existir
- Fallbacks IA documentados: `/ai/start-diagnostic` e `/ai/start-image`, se existirem no Core Server.

## O que fica mockado temporariamente

- Identidade, bio, posts, scripts, diagnostico visual e imagem continuam com mock local se as rotas reais retornarem `404/501` ou se `USE_MOCK=1`.
- `server/server.js` permanece como mock/dev local e nao e necessario para GitHub Pages.
- Fornecedores/produtos fake ficam apenas como fallback de desenvolvimento. Em producao, se a API nao retornar fornecedores ativos, a UI mostra `Nenhum fornecedor disponível no momento.`

