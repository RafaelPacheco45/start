# GitHub Pages Ready

Status: preparado para publicacao estatica.

- Dominio recomendado: `https://start.autozap.log.br`.
- `.nojekyll` criado.
- `.gitignore` criado.
- Producao configurada para `https://aip.autozap.log.br`.
- `mockMode` permanece `false`; mock manual somente com `localStorage.USE_MOCK=1`.
- Fluxo mobile alinhado em 7 etapas.
- Sessao usa `POST /start/session`.
- Fornecedores usam `GET /start/suppliers`.
- Produtos usam `GET /start/suppliers/:id/products`.
- Lead usa `POST /start/lead`.
- `/start/admin/metrics` nao faz parte do healthcheck de publicacao.
- Botao `Continuar para AutoZap` aponta para `https://autozap.log.br`.
- `server/server.js` documentado como mock/dev local, sem dependencia em producao.
- `index.html`, `mobile.html` e `desktop.html` usam caminhos relativos.
- Nao ha chamada direta para OpenAI no frontend.
- Nao ha segredo no frontend.

Pendencias:

- Confirmar com o Core Server se `/start/diagnostic`, `/start/image`, `/ai/start-diagnostic` e `/ai/start-image` estao ativos para os fluxos de IA real.
- Confirmar URL especifica de cadastro/plano no AutoZap, caso exista alem de `https://autozap.log.br`.
