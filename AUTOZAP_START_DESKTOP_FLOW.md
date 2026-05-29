# AutoZap Start - Desktop Flow

Data: 2026-05-25

## Status

O desktop agora segue as mesmas 7 etapas do mobile:

1. Entrada da marca
2. Nome e logo
3. Diagnostico inicial
4. Base legal da loja
5. Estoque inicial recomendado
6. Previa final da loja
7. Salvamento da loja

## Estrutura da tela

`desktop.html` agora funciona como app desktop:

- sidebar esquerda com marca, progresso, status da API/sessao e lista de etapas;
- painel central com conteudo da etapa atual e botoes Voltar/Proximo;
- painel direito com previa viva da loja, imagem/logo, fornecedor, produtos, total e botao para AutoZap.

## Estado

`js/desktop.js` centraliza o fluxo em `desktopState`, incluindo:

- etapa atual;
- sessao Start;
- identidade da loja;
- imagem gerada;
- dados de diagnostico;
- base legal;
- fornecedores;
- produtos;
- produtos selecionados;
- total;
- dados de lead.

## Rotas integradas

O desktop usa `AutoZapAPI` e a base `https://aip.autozap.log.br`:

- `POST /start/session`;
- `POST /ai/start-diagnostic` ou rota configurada para diagnostico textual;
- `POST /start/image`;
- `GET /start/suppliers`;
- `GET /start/suppliers/:id/products`;
- `POST /start/lead`.

## Fallbacks

- Se diagnostico textual falhar, o desktop usa uma identidade provisoria baseada nos campos preenchidos.
- Se imagem falhar, a previa continua com iniciais da loja.
- Se fornecedores falharem, a etapa mostra erro especifico e nao renderiza fornecedores fake em producao.
- Se produtos falharem, a selecao fica vazia e o fluxo continua revisavel.

## Teste manual

1. Abrir `http://localhost:4173/desktop.html`.
2. Rodar no console:

```js
localStorage.removeItem("USE_MOCK")
localStorage.setItem("DEBUG_API", "1")
```

3. Avancar pelas 7 etapas.
4. Gerar identidade.
5. Confirmar imagem real ou fallback com iniciais.
6. Carregar fornecedores.
7. Selecionar fornecedor e produtos.
8. Salvar lead.
9. Continuar para `https://autozap.log.br`.

