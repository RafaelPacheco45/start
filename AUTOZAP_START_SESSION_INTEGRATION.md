# AutoZap Start - Session and Image Integration

Data: 2026-05-25

## Sessao Start

O frontend usa a API real em `https://aip.autozap.log.br` e nao altera `API_BASE_URL`.

- `ensureStartSession()` cria ou reutiliza sessao com `POST /start/session`.
- A sessao e salva em `localStorage["autozap_start_session"]`.
- `getStartSessionToken()` extrai o token salvo.
- `apiRequest(..., { startSession: true })` envia `x-start-session`.
- Se `/start/image` retornar `401 start_session_required`, a sessao local e limpa, renovada uma vez e a imagem e tentada novamente.

## Imagem real

`AutoZapAPI.generateStartImage(payload)` chama `POST /start/image` com:

```json
{
  "prompt": "...",
  "storeName": "...",
  "description": "...",
  "style": "...",
  "colors": [],
  "source": "autozap-start"
}
```

A funcao aceita respostas nos formatos:

- `{ "imageBase64": "...", "mimeType": "image/png" }`
- `{ "ok": true, "imageBase64": "...", "mimeType": "image/png" }`
- `{ "data": { "imageBase64": "...", "mimeType": "image/png" } }`

E retorna para a UI:

```json
{
  "imageDataUrl": "data:image/png;base64,...",
  "model": "gpt-image-1"
}
```

## Fallback

O fluxo de identidade primeiro gera o diagnostico textual e depois tenta gerar a imagem real. Se a imagem falhar, o fluxo nao trava:

- a UI usa as iniciais da loja como previa visual;
- o estado local registra `imageGenerationNotice`;
- a mensagem exibida e: `Imagem automática indisponível agora. Usamos uma prévia provisória.`

Para `429 start_image_rate_limited`, a mensagem exibida e:

`Limite de geração de imagem atingido. Tente novamente em alguns minutos.`

Nao ha retry em loop; apenas uma renovacao de sessao para `401 start_session_required`.

## Debug

Com `localStorage.DEBUG_API = "1"`, o console mostra endpoint, status, `hasStartSession`, modelo e `imageReceived`.

`imageBase64` nao e impresso inteiro no console.

## Backend

- Rotas habilitadas: `POST /start/image` e `POST /ai/start-image`.
- O Start usa `/start/image` no fluxo mobile.
- Modelo backend: `gpt-image-1`.
- Rate limit backend: 3 imagens por sessao/IP em 10 minutos.

