# AutoZap Start - Error Diagnostics

Data: 2026-05-24

## API real

Base mantida:

```txt
https://aip.autozap.log.br
```

Mock continua desativado por padrao. Para ativar manualmente:

```js
localStorage.setItem("USE_MOCK", "1")
location.reload()
```

Para voltar ao fluxo real:

```js
localStorage.removeItem("USE_MOCK")
location.reload()
```

## Endpoints chamados

- `POST /start/session`
  - Contexto de erro: `start_session_failed`
  - Falha nao bloqueia o fluxo; o Start continua sem sessao anonima real.
- `GET /start/suppliers`
  - Contexto de erro: `suppliers_load_failed`
  - Lista vazia mostra estado vazio real.
- `GET /start/suppliers/:id/products`
  - Contexto de erro: `supplier_products_load_failed`
  - Lista vazia mostra estado vazio real.
- `POST /start/lead`
  - Contexto de erro: `lead_save_failed`
  - Falha nao finge sucesso e preserva os dados preenchidos para nova tentativa.
- `POST /start/diagnostic` e `/ai/start-diagnostic`
  - Contexto de erro: `diagnostic_failed`
- `POST /start/image` e `/ai/start-image`
  - Contexto de erro: `image_failed`

## Como ativar DEBUG_API

No console do navegador:

```js
localStorage.setItem("DEBUG_API", "1")
location.reload()
```

Para desativar:

```js
localStorage.removeItem("DEBUG_API")
```

Com `DEBUG_API=1`, cada chamada registra:

- metodo
- endpoint
- URL final
- status HTTP
- response body sanitizado
- caller
- contexto de erro
- se mock esta ativo

Campos sensiveis como token, segredo, senha, authorization e API key sao mascarados.

## Mensagens por erro

- Falha de rede/CORS/status `0`: `Não foi possível acessar a API. Verifique conexão/CORS.`
- `400` ou `422`: `Dados incompletos ou inválidos.`
- `404`: `Recurso não encontrado na API.`
- `500+`: `Erro interno no servidor.`
- fornecedores vazios: `Nenhum fornecedor disponível no momento.`
- produtos vazios: `Este fornecedor ainda não possui produtos disponíveis.`
- lead falhou: `Não foi possível salvar sua solicitação agora.`

## Como identificar CORS

1. Ative `DEBUG_API`.
2. Abra DevTools > Console e Network.
3. Recarregue a pagina com `USE_MOCK` ausente.
4. Se o console mostrar status `network-error`, `timeout` ou status `0`, e o Network exibir a chamada bloqueada, trate como falha de acesso/CORS.
5. Confira a origem usada no teste, por exemplo `file://`, `http://localhost:4173` ou o dominio publicado. A API pode liberar CORS apenas para origens especificas.

Observacao desta rodada:

- `GET https://aip.autozap.log.br/start/suppliers` sem header `Origin` respondeu `200` com fornecedores.
- A mesma rota com `Origin: http://localhost:4173` respondeu `403` sem `Access-Control-Allow-Origin`.
- `OPTIONS /start/suppliers` com origem local tambem respondeu `403`.
- Isso indica que o modal em teste local pode ser causado por bloqueio de origem/CORS, nao por ausencia de fornecedores.

## Como testar fornecedores

1. Garanta mock desligado:

```js
localStorage.removeItem("USE_MOCK")
localStorage.setItem("DEBUG_API", "1")
location.reload()
```

2. No Network, confirme:

```txt
GET https://aip.autozap.log.br/start/suppliers
```

3. Se retornar `[]`, a tela deve mostrar:

```txt
Nenhum fornecedor disponível no momento.
```

4. Se falhar por CORS/rede, o console deve mostrar `suppliers_load_failed` e status `0` ou `network-error`.

## Como testar produtos

1. Garanta que a API retornou ao menos um fornecedor ativo.
2. No Network, confirme:

```txt
GET https://aip.autozap.log.br/start/suppliers/:id/products
```

3. Se retornar `[]`, a tela deve mostrar:

```txt
Este fornecedor ainda não possui produtos disponíveis.
```

4. Se falhar por CORS/rede, o console deve mostrar `supplier_products_load_failed`.

## Como testar lead

1. Preencha WhatsApp ou e-mail na etapa final.
2. Clique em salvar.
3. No Network, confirme:

```txt
POST https://aip.autozap.log.br/start/lead
```

4. Se responder `200/201`, a UI mostra sucesso.
5. Se responder `400/422`, a UI mostra `Dados incompletos ou inválidos.`
6. Se responder `500+`, a UI mostra `Erro interno no servidor.`
7. Se falhar por rede/CORS, a UI mostra `Não foi possível acessar a API. Verifique conexão/CORS.`
8. Em qualquer falha, os dados preenchidos permanecem no formulario para tentar novamente.
