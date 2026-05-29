# AutoZap Start - Production Hardening

Data: 2026-05-24

## 1. Onde existem mocks

- `js/mobile.js`
  - `localSuppliers`: fornecedores demonstrativos.
  - `supplierProducts`: produtos demonstrativos.
  - `getMockProductsForSelectedCategories()`: monta produtos demonstrativos por categoria.
- `js/api.js`
  - Geradores locais para identidade, logo, bio, posts, estoque, scripts, preview, lead e exportacao.
  - Esses caminhos agora so entram quando mock esta explicitamente ativo.
- `js/desktop.js`
  - Lista demonstrativa de fornecedores no desktop, agora restrita a mock explicito.
- `server/server.js`
  - Mock local de desenvolvimento. Nao e dependencia de producao nem de GitHub Pages.

## 2. Onde mock pode ser acionado

Mock so deve ser acionado quando:

- `window.AUTOZAP_START_CONFIG.mockMode === true`
- ou `localStorage.USE_MOCK === "1"`
- ou `localStorage.USE_MOCK === "true"`

`localhost`, `127.0.0.1` e host vazio nao ativam mock automaticamente.

## 3. Onde localhost forcava fallback

- Antes: `js/mobile.js` tinha `devHosts.includes(window.location.hostname)` dentro de `canUseDevelopmentMockFallback()`.
- Corrigido: a funcao agora ignora hostname e verifica apenas `mockMode === true` ou `USE_MOCK`.

## 4. Onde produtos fake ainda podem aparecer

- Apenas com mock explicito em `js/mobile.js`, via `supplierProducts` e `getMockProductsForSelectedCategories()`.
- Em producao, se `store.availableProducts` estiver vazio, `getProductsForSelectedCategories()` retorna `[]`.
- Se a API retornar fornecedor sem produtos, a UI mostra: "Este fornecedor ainda nao possui produtos disponiveis."

## 5. Onde fornecedor fake ainda pode aparecer

- Apenas com mock explicito em `js/mobile.js`, via `localSuppliers`.
- Apenas com mock explicito em `js/desktop.js`, na lista demonstrativa de fornecedores.
- Em producao, se a API retornar lista vazia ou falhar, a UI mostra estado vazio/erro real.

## 6. Onde lead pode salvar local sem avisar

- Antes: `AutoZapAPI.saveLead()` gravava em `localStorage` quando a API nao retornava sucesso.
- Corrigido: em producao, `saveLead()` chama `/start/lead` e retorna erro se falhar. Nao grava local e nao mostra sucesso falso.
- `localStorage.autozap_start_leads` so e usado quando mock explicito esta ativo.

## 7. Onde desktop/mobile divergem

- Mobile tem fluxo completo com selecao de fornecedores/produtos e lead.
- Desktop e uma experiencia resumida; agora tambem consulta fornecedores/produtos reais quando mock nao esta ativo.
- Ambos usam a mesma regra de mock explicito e o mesmo destino final `https://autozap.log.br`.

## 8. O que foi corrigido

- `js/api.js`
  - `shouldUseMock()` agora so aceita `mockMode === true`, `USE_MOCK=1` ou `USE_MOCK=true`.
  - `post()` e `get()` nao convertem falha da API real em mock.
  - `saveLead()` nao salva local nem finge sucesso em producao.
  - `apiSaveStartLead()` chama somente `/start/lead`.
  - `exportToAutoZap()` nao salva export local em producao se a API falhar.
- `js/mobile.js`
  - Removido fallback automatico por localhost.
  - Fornecedores/produtos fake so aparecem com mock explicito.
  - Estados vazios reais para fornecedores e produtos.
  - Eventos usam `environment: "real-api"` ou `"mock"` em vez de `mock: true`.
  - Dados antigos de fornecedores/produtos salvos localmente sao ignorados quando mock nao esta ativo.
- `js/desktop.js`
  - Eventos deixam de usar `mock: true`.
  - Lista demonstrativa de fornecedores so aparece com mock explicito.
  - Botao final permanece apontando para `https://autozap.log.br`.
- `mobile.html` e `desktop.html`
  - Textos visiveis que diziam "mockada", "simulados" ou "distancia simulada" foram ajustados.
- `js/healthcheck.js` e `js/admin.js`
  - Metadados alinhados para API real e mock explicito.

## Limpeza segura de estado local

Para um teste limpo no navegador:

```js
localStorage.removeItem("USE_MOCK")
localStorage.removeItem("autozap_start_progress")
localStorage.removeItem("autozap_start_events")
localStorage.removeItem("autozap_start_leads")
```

Tambem pode ser util limpar o progresso atualmente usado pelo fluxo:

```js
localStorage.removeItem("autozap_start_store")
localStorage.removeItem("autozap_start_exports")
localStorage.removeItem("autozap_start_session")
localStorage.removeItem("autozap_start_usage")
```

## GitHub Pages

- `.nojekyll` existe.
- Caminhos de assets/scripts continuam relativos.
- Producao nao depende de `server/server.js`.
- Dominio recomendado: `start.autozap.log.br`.
- API real mantida: `https://aip.autozap.log.br`.

