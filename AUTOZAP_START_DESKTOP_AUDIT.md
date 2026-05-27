# AutoZap Start - Desktop Audit

Data: 2026-05-25

## Como o desktop funcionava

A versao desktop anterior era uma pagina de apresentacao com hero, blocos explicativos, simulador simples e um painel chamado `desktop-flow`.

Ela permitia:

- preencher ideia, cidade, capital, foco, categorias, margem e custo exemplo;
- chamar `AutoZapAPI.generateIdentity()`;
- chamar `AutoZapAPI.generateBio()`;
- chamar `AutoZapAPI.generateStockPlan()`;
- consultar fornecedores e produtos reais em parte do fluxo;
- exportar resumo via `AutoZapAPI.exportToAutoZap()`.

## Partes estaticas ou enganosas

Dentro da experiencia visual havia numeros e exemplos fixos:

- `R$ 2.400` como investimento;
- `44`, `73` ou outros totais fixos;
- `Distribuidora Tech Prime`;
- posts e categorias de exemplo;
- previa final estatica fora do fluxo real.

Esses dados podiam parecer resultado real da API mesmo antes de consulta ou selecao.

## Rotas reais usadas

A versao anterior usava parcialmente:

- `POST /ai/start-diagnostic` ou rota configurada de identidade;
- `POST /start/diagnostic` ou rota configurada de estoque;
- `GET /start/suppliers`;
- `GET /start/suppliers/:id/products`;
- `POST /start/lead` indiretamente no export.

## Rotas que o desktop deveria usar

O novo desktop deve usar a mesma base real do mobile:

- `POST /start/session`;
- `POST /ai/start-diagnostic` ou `POST /start/diagnostic`;
- `POST /start/image`;
- `GET /start/suppliers`;
- `GET /start/suppliers/:id/products`;
- `POST /start/lead`.

## Diferencas para o mobile

Antes, o mobile era o produto principal com 7 etapas claras. O desktop era mais proximo de landing/simulador:

- nao guiava o usuario etapa por etapa;
- nao tinha sidebar/progresso;
- nao tinha selecao forte de fornecedor e produtos;
- misturava conteudo editorial com app;
- mantinha muitas previas estaticas.

## Plano aplicado

- Recriar `desktop.html` como app em 3 paineis: sidebar, etapa central e preview.
- Recriar `css/desktop.css` para layout desktop/notebook/tablet.
- Reescrever `js/desktop.js` com `desktopState` e 7 etapas.
- Usar `AutoZapAPI` existente para sessao, IA, imagem, fornecedores, produtos e lead.
- Remover dados fixos enganosos de dentro do fluxo real.
- Manter fallback visual com iniciais se imagem ou IA falhar.
- Preservar mobile, `config.js`, `apiBaseUrl` e ausencia de segredo no frontend.
