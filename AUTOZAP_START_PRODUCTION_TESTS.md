# AutoZap Start - Production Tests

Data: 2026-05-25

## Preparacao

Abrir o DevTools e limpar estado antigo:

```js
localStorage.removeItem("USE_MOCK")
localStorage.removeItem("autozap_start_progress")
localStorage.removeItem("autozap_start_events")
localStorage.removeItem("autozap_start_leads")
localStorage.removeItem("autozap_start_store")
localStorage.removeItem("autozap_start_exports")
localStorage.removeItem("autozap_start_session")
localStorage.removeItem("autozap_start_usage")
```

## API publica

Base obrigatoria:

```text
https://aip.autozap.log.br
```

Rotas esperadas no teste de producao:

- `GET /health`
- `GET /start/suppliers`
- `POST /start/session`
- `OPTIONS /start/suppliers`
- `GET /start/suppliers/:id/products` quando houver fornecedor selecionado
- `POST /start/image` ao gerar identidade visual real
- `POST /start/lead` para salvar lead

Nao testar `GET /start/session`; a rota correta e `POST /start/session`.

Nao testar `/start/admin/metrics`; essa rota era de healthcheck/teste antigo e nao faz parte do criterio de publicacao do Start estatico.

## Checklist obrigatorio

1. `USE_MOCK` ausente
   - Confirmar no console: `localStorage.getItem("USE_MOCK") === null`.

2. Abrir em localhost ou no dominio publicado
   - Local: `http://localhost:4173/`
   - Producao recomendada: `https://start.autozap.log.br`

3. Confirmar que localhost nao ativa mock
   - A UI nao deve renderizar `Distribuidora Paulista Cell`, `Rio Mobile Atacado`, `SulTech Distribuidora` ou produtos demonstrativos.

4. Confirmar chamada real de sessao
   - Network deve mostrar `POST https://aip.autozap.log.br/start/session`.

5. Confirmar chamada real de fornecedores
   - Network deve mostrar `GET https://aip.autozap.log.br/start/suppliers`.

6. Confirmar chamada real de imagem
   - Garanta `localStorage.removeItem("USE_MOCK")`.
   - Garanta `localStorage.removeItem("autozap_start_session")`.
   - Ative `localStorage.setItem("DEBUG_API", "1")`.
   - Clique em `Gerar identidade`.
   - Network deve mostrar `POST https://aip.autozap.log.br/start/session`.
   - Network deve mostrar `POST https://aip.autozap.log.br/ai/start-diagnostic` ou `POST https://aip.autozap.log.br/start/diagnostic`.
   - Network deve mostrar `POST https://aip.autozap.log.br/start/image`.
   - A resposta de imagem pode conter `imageBase64`, `mimeType` e `model`.
   - O console de debug nao deve imprimir o `imageBase64` inteiro.
   - A previa/logo deve exibir a imagem retornada.

7. Confirmar fallback de imagem
   - Se `/start/image` retornar `501`, `500`, falha de rede/CORS ou payload sem `imageBase64`, a UI deve manter o fluxo e mostrar as iniciais da loja.
   - A mensagem discreta deve ser: `Imagem automática indisponível agora. Usamos uma prévia provisória.`
   - Se retornar `429 start_image_rate_limited`, mostrar: `Limite de geração de imagem atingido. Tente novamente em alguns minutos.`
   - Nao deve haver novas tentativas em loop.

8. API retorna fornecedores ativos
   - Fornecedores reais aparecem.
   - Nenhum fornecedor de `localSuppliers` aparece.

9. API retorna lista vazia
   - Aparece estado vazio real: "Nenhum fornecedor disponivel no momento."
   - Nao aparece fornecedor fake.

10. Fornecedor ativo selecionado
   - O fornecedor usado no fluxo deve ter `id` real retornado pela API.

11. Confirmar chamada real de produtos
   - Network deve mostrar `GET https://aip.autozap.log.br/start/suppliers/:id/products`.

12. API retorna produtos vazios
   - Aparece: "Este fornecedor ainda nao possui produtos disponiveis."

13. Produtos fake nao aparecem com `USE_MOCK` ausente
   - Confirmar que nao aparecem SKUs demonstrativos como `cel-01`, `ace-01`, `pel-01`, `cap-01`, `car-01`.

14. Salvar lead
   - Network deve mostrar `POST https://aip.autozap.log.br/start/lead`.
   - Com sucesso: mostrar confirmacao.
   - Com falha: mostrar "Nao foi possivel salvar sua solicitacao agora."
   - Em producao, nao gravar em `autozap_start_leads` e nao mostrar sucesso falso.

15. Ativar mock manual
   - Console:
     ```js
     localStorage.setItem("USE_MOCK", "1")
     location.reload()
     ```
   - Confirmar que fornecedores/produtos demonstrativos aparecem somente nesse modo.

16. Remover mock manual
   - Console:
     ```js
     localStorage.removeItem("USE_MOCK")
     location.reload()
     ```
   - Confirmar que volta a chamar a API real.

17. Botao continuar
   - Confirmar que leva para `https://autozap.log.br`.

18. Healthcheck local
   - Rodar:
     ```powershell
     node tools/healthcheck.js
     ```
   - Saida esperada:
     ```text
     AutoZap Start Healthcheck OK
     ```

## Teste desktop

1. Abrir `http://localhost:4173/desktop.html`.
2. Console:
   ```js
   localStorage.removeItem("USE_MOCK")
   localStorage.setItem("DEBUG_API", "1")
   ```
3. Avancar pelas 7 etapas:
   - Entrada da marca
   - Nome e logo
   - Diagnostico inicial
   - Base legal da loja
   - Estoque inicial recomendado
   - Previa final da loja
   - Salvamento da loja
4. Confirmar no Network:
   - `POST https://aip.autozap.log.br/start/session`
   - `POST https://aip.autozap.log.br/ai/start-diagnostic` ou `POST https://aip.autozap.log.br/start/diagnostic`
   - `POST https://aip.autozap.log.br/start/image`
   - `GET https://aip.autozap.log.br/start/suppliers`
   - `GET https://aip.autozap.log.br/start/suppliers/:id/products`
   - `POST https://aip.autozap.log.br/start/lead`
5. Confirmar que produtos selecionados atualizam quantidade e total.
6. Confirmar que falha de imagem usa iniciais da loja e nao trava o fluxo.
7. Confirmar que `Continuar para AutoZap` aponta para `https://autozap.log.br`.

17. Busca no projeto
   - Rodar:
     ```powershell
     rg -n "api\.autozap\.log\.br|OPENAI_API_KEY|sk-|mock: true|lead_saved_mock" .
     ```
   - Resultado esperado:
     - `api.autozap.log.br`, `OPENAI_API_KEY`, `sk-`, `mock: true` e `lead_saved_mock` nao devem existir no frontend de producao.
     - `https://aip.autozap.log.br` deve existir em `js/config.js` e documentacao.

## GitHub Pages

- Confirmar que `.nojekyll` existe.
- Confirmar que assets, CSS e JS usam caminhos relativos.
- Confirmar que producao nao carrega `server/server.js`.
- Publicar preferencialmente em `start.autozap.log.br`.
- Manter `apiBaseUrl` como `https://aip.autozap.log.br`.
- Manter `mockMode: false`.
