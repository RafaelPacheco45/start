# AutoZap Start Flow Alignment

Data: 2026-05-25

## Decisao final

O fluxo mobile final tem 7 etapas.

Etapas atuais:

1. Abertura da experiencia
2. Nome e logo
3. Diagnostico inicial
4. Base legal da loja
5. Estoque inicial recomendado
6. Previa final da loja
7. Salvamento da loja

Essa estrutura substitui a versao anterior de 9 etapas porque canais, fornecedor, estoque e previa foram consolidados em telas mais densas. Nao foram adicionados elementos antigos apenas para satisfazer teste.

## Healthcheck

`tools/healthcheck.js` foi alinhado com a configuracao atual:

- versao esperada: `0.3.0`
- `mockMode` esperado: `false`
- etapas mobile esperadas: `7`

O healthcheck continua verificando arquivos principais, IDs usados diretamente por HTML/JS e funcoes essenciais da camada `AutoZapAPI`.

## Mobile

`mobile.html` foi mantido com 7 `section.step[data-step]` e o texto inicial do indicador passou para `Passo 1 de 7`.

IDs antigos removidos das referencias de `js/mobile.js`:

- `marginInput`
- `costInput`
- `suggestedPrice`
- `bioPreview`
- `waDescription`
- `marginLabel`
- `previewCapital`
- `previewMargin`
- `previewWarranty`
- `recommendedSupplierName`
- `recommendedSupplierCity`
- `recommendedSupplierDistance`
- `recommendedSupplierDelivery`
- `recommendedSupplierScore`
- `recommendedSupplierReason`
- `recommendedSupplierCategories`
- `operationSupplier`
- `operationItems`
- `previewSupplierName`
- `previewSupplierCity`
- `previewStockItems`
- `previewStockInvestment`

O codigo legado de margem/custo e preco sugerido foi removido porque esses controles nao existem mais no fluxo mobile atual. A margem padrao ainda permanece no estado da loja para resumo e exportacao.

A antiga renderizacao do card `recommendedSupplier*` foi substituida por `renderSuppliers()`, que atualiza o bloco real existente no HTML (`supplierPreview` e `nearestSupplierLabel`). Os cards finais de fornecedor e estoque continuam sendo atualizados por `renderInitialStockPlan()`.

## Desktop

`desktop.html` e `js/desktop.js` foram revisados. Nao ha dependencia critica de IDs inexistentes. As consultas por classe usadas no hero (`.store-top strong`, `.store-top small`, `.investment-card strong`) correspondem a elementos existentes no HTML.

## API real

O healthcheck atual valida a API publica em:

- `GET https://aip.autozap.log.br/health`
- `GET https://aip.autozap.log.br/start/suppliers`
- `POST https://aip.autozap.log.br/start/session`
- `OPTIONS https://aip.autozap.log.br/start/suppliers`

Nao ha teste de `GET /start/session`, porque a rota correta e `POST /start/session`.

Nao ha teste de `/start/admin/metrics`; essa rota foi tratada como criterio antigo de healthcheck/teste e nao deve bloquear o deploy estatico.

## Pendencias restantes

- Validar visualmente o fluxo completo em navegador quando a automacao/browser estiver disponivel.
- Implementar integracoes reais ainda listadas no README: IA real, imagem/logo real, banco de dados, Turnstile, analytics reais e integracao completa com AutoZap principal.

