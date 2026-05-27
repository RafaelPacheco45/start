# AutoZap Start Integration Tests

Data: 2026-05-24

## Executados

- `node --check js/config.js`: OK
- `node --check js/api.js`: OK
- `node --check js/mobile.js`: OK
- `node --check js/desktop.js`: OK
- Servidor estatico local temporario em porta 4173: `index.html`, `mobile.html` e `desktop.html` responderam 200
- `GET https://aip.autozap.log.br/start/suppliers`: 200 OK
- `GET https://aip.autozap.log.br/start/suppliers/:id/products`: 200 OK no fornecedor testado, com lista vazia
- Busca por dominio antigo da API, variavel de chave OpenAI e prefixo de chave secreta: sem ocorrencias no codigo de producao.

## Checklist manual obrigatorio

1. Abrir localmente `index.html`, `mobile.html` e `desktop.html`.
2. Confirmar `API_BASE_URL = https://aip.autozap.log.br`.
3. Confirmar que fornecedores reais ativos aparecem na UI.
4. Selecionar fornecedor.
5. Confirmar `GET /start/suppliers/:id/products` com 200.
6. Confirmar que produtos reais aparecem na UI quando existirem no Core Server.
7. Selecionar produtos.
8. Alterar quantidade e remover produto.
9. Confirmar calculo total.
10. Salvar lead.
11. Confirmar `POST /start/lead` com sucesso ou erro amigavel.
12. Confirmar que `Continuar para AutoZap` leva para `https://autozap.log.br`.
13. Buscar no projeto antes do deploy e confirmar que a configuracao de producao nao usa endereco local, dominio antigo da API, variavel de chave OpenAI ou prefixo de chave secreta.

## Observacao da API em 2026-05-24

`/start/suppliers` respondeu 200, mas os primeiros fornecedores retornados estavam com `status: deleted`. A camada de API filtra `deleted`, `inactive` e `disabled`; se nao houver fornecedor ativo, a UI mostra `Nenhum fornecedor disponível no momento.`
