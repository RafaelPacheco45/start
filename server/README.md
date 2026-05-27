# AutoZap Start API Mock

Backend opcional para preparar a integração real do AutoZap Start.

## Rodar

```bash
cd server
npm install
npm run dev
```

API local:

```text
http://localhost:3001/api/start/health
```

## Endpoints

- `GET /api/start/health`
- `POST /api/start/session`
- `POST /api/start/identity`
- `POST /api/start/logo`
- `POST /api/start/posts`
- `POST /api/start/stock-plan`
- `POST /api/start/leads`
- `POST /api/start/export-autozap`

## Segurança Preparada

O servidor tem mocks de:

- `rateLimitMock`
- `detectRiskMock`
- `usageGuardMock`
- `verifyTurnstileMock`

O Turnstile ainda não é exibido no frontend. No futuro, envie o token no payload e valide em `verifyTurnstileMock`.

## IA Real

Os endpoints retornam mocks estruturados. Quando a IA real entrar, mantenha o contrato `{ ok, data }` e substitua apenas a lógica interna dos handlers.
