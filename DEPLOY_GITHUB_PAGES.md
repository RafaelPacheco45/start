# Deploy GitHub Pages

## Configuracao

- Site estatico: `index.html`, `mobile.html`, `desktop.html` e assets locais.
- Dominio recomendado: `start.autozap.log.br`.
- API real: `https://aip.autozap.log.br`.
- AutoZap principal: `https://autozap.log.br`.
- `server/server.js` nao entra no deploy de producao; ele e apenas mock/dev local.

## Passos

1. Publicar a branch configurada no GitHub Pages.
2. Garantir que o arquivo `.nojekyll` esteja na raiz.
3. Configurar o dominio customizado `start.autozap.log.br` no Pages.
4. Apontar o DNS do dominio para GitHub Pages.
5. Validar que `js/config.js` contem `apiBaseUrl: "https://aip.autozap.log.br"` e `mockMode: false`.

## Observacoes

- Os caminhos usam `basePath: "./"` para funcionar em deploy estatico.
- Nao ha chave OpenAI ou segredo no frontend.
- O fallback mock pode ser ativado manualmente em desenvolvimento com `localStorage.setItem("USE_MOCK", "1")`.

