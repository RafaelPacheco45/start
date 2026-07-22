/**
 * AutoZap Start platform shell.
 * Plain JS by design: GitHub Pages deploys this site without a build step.
 *
 * @typedef {"landing"|"intro"|"brand-name"|"city"|"style"|"products"|"colors"|"logo-style"|"brand-message"|"slogan"|"generating"|"presentation"|"formalization"|"inventory"|"plans"|"autozap"|"completed"} StartState
 */
(function(){
  "use strict";

  var STORAGE_KEY = "autozap_start_platform_state_v1";
  var USAGE_KEY = "autozap_start_platform_usage_v1";
  var FREE_GENERATION_LIMIT = 1;
  var GOV_MEI_URL = "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor";
  var AUTOZAP_URL = "https://autozap.log.br";

  var stateOrder = [
    "brand-name",
    "city",
    "style",
    "products",
    "colors",
    "logo-style",
    "brand-message",
    "slogan",
    "presentation",
    "formalization",
    "inventory",
    "plans",
    "autozap",
    "completed"
  ];

  var generationMessages = [
    "Analisando sua ideia.",
    "Criando o conceito da marca.",
    "Escolhendo a tipografia.",
    "Montando a paleta de cores.",
    "Gerando o logotipo.",
    "Preparando seus materiais.",
    "Criando a apresentacao da sua loja.",
    "Finalizando sua identidade visual."
  ];

  var styleOptions = [
    ["Moderna", "Visual limpo, digital e direto."],
    ["Premium", "Aparencia sofisticada e segura."],
    ["Tecnologica", "Energia inovadora para aparelhos e acessorios."],
    ["Minimalista", "Poucos elementos, alto contraste e clareza."],
    ["Jovem", "Marca viva para redes sociais e ofertas."],
    ["Popular", "Proxima, simples e focada em preco."],
    ["Elegante", "Tom refinado para atendimento consultivo."],
    ["Urbana", "Estilo forte para loja de rua e bairro."]
  ];

  var productOptions = [
    "Smartphones novos",
    "Smartphones usados",
    "Acessorios",
    "Peliculas",
    "Capas",
    "Carregadores",
    "Fones",
    "Assistencia tecnica"
  ];

  var paletteOptions = [
    { name: "Azul confianca", colors: ["#2f6bff", "#07133f", "#0faa62"] },
    { name: "Preto premium", colors: ["#111827", "#3b82f6", "#f8fafc"] },
    { name: "Verde crescimento", colors: ["#0faa62", "#052e22", "#60a5fa"] },
    { name: "Urbana", colors: ["#2563eb", "#0f172a", "#f97316"] }
  ];

  var logoStyles = ["Simbolo", "Monograma", "Nome completo", "Icone tecnologico", "Minimalista", "Emblema"];
  var messageOptions = ["Confianca", "Tecnologia", "Preco baixo", "Exclusividade", "Rapidez", "Proximidade", "Modernidade"];
  var investmentOptions = ["Ate R$ 500", "Ate R$ 1.000", "Ate R$ 2.500", "Ate R$ 5.000", "Valor personalizado"];
  var planConfig = [
    {
      id: "store",
      name: "Loja",
      priceLabel: "Preco configuravel",
      description: "Loja virtual para apresentar produtos e receber interessados.",
      benefits: ["Vitrine de produtos", "Pagina responsiva", "CTA de atendimento"],
      cta: "Selecionar Loja",
      available: true
    },
    {
      id: "presence",
      name: "Presenca",
      priceLabel: "Preco configuravel",
      description: "Loja virtual com site institucional para fortalecer a marca.",
      benefits: ["Loja virtual", "Site portfolio", "Pagina sobre a loja"],
      cta: "Selecionar Presenca",
      available: true,
      highlight: true
    },
    {
      id: "complete",
      name: "Negocio Completo",
      priceLabel: "Preco configuravel",
      description: "Pacote com presenca online e um mes do plano basico AutoZap incluido.",
      benefits: ["Loja virtual", "Site institucional", "1 mes de AutoZap basico"],
      cta: "Selecionar pacote",
      available: true
    }
  ];

  var app = document.querySelector("#startApp");
  var shell = document.querySelector(".app-shell");
  var landing = document.querySelector("[data-landing]");
  var builder = document.querySelector("[data-builder]");
  var intro = document.querySelector("[data-intro]");

  var project = loadProject();
  bindLanding();
  restoreIfNeeded();

  function defaultProject() {
    return {
      state: "landing",
      completed: {},
      skipped: {},
      brand: {
        name: "",
        city: "",
        uf: "",
        style: "",
        products: [],
        colors: paletteOptions[0].colors.slice(),
        logoStyle: "",
        message: "",
        slogan: ""
      },
      identity: null,
      formalization: "available",
      inventory: {
        investment: "",
        categories: [],
        address: "",
        notes: "",
        suggestion: null
      },
      selectedPlan: "",
      usage: loadUsage(),
      error: ""
    };
  }

  function loadProject() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Object.assign(defaultProject(), saved || {});
    } catch (error) {
      return defaultProject();
    }
  }

  function saveProject() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }

  function loadUsage() {
    try {
      return Object.assign({ identityGenerations: 0, deviceId: createDeviceId(), updatedAt: "" }, JSON.parse(localStorage.getItem(USAGE_KEY) || "{}"));
    } catch (error) {
      return { identityGenerations: 0, deviceId: createDeviceId(), updatedAt: "" };
    }
  }

  function saveUsage() {
    project.usage.updatedAt = new Date().toISOString();
    localStorage.setItem(USAGE_KEY, JSON.stringify(project.usage));
  }

  function createDeviceId() {
    return "azs_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function bindLanding() {
    document.querySelectorAll("[data-action='start-project']").forEach(function(button) {
      button.addEventListener("click", function() {
        startIntro();
      });
    });
  }

  function restoreIfNeeded() {
    if (project.state && project.state !== "landing") {
      showBuilder(project.state);
    }
  }

  function startIntro() {
    project.state = "intro";
    saveProject();
    shell.dataset.mode = "transition";
    intro.hidden = false;
    setTimeout(function() {
      var title = intro.querySelector("[data-intro-title]");
      var subtitle = intro.querySelector("[data-intro-subtitle]");
      title.textContent = "Bem-vindo ao AutoZap Start.";
      subtitle.textContent = "Vamos construir sua loja.";
    }, 150);
    setTimeout(function() {
      intro.hidden = true;
      showBuilder(nextUnfinishedState());
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : 2100);
  }

  function showBuilder(nextState) {
    landing.hidden = true;
    builder.hidden = false;
    shell.dataset.mode = "builder";
    project.state = nextState;
    saveProject();
    render();
  }

  function nextUnfinishedState() {
    return project.state && project.state !== "landing" && project.state !== "intro" ? project.state : "brand-name";
  }

  function render() {
    if (project.state === "generating") return renderGenerating();
    builder.innerHTML = layout(stepContent(project.state));
    bindBuilderEvents();
  }

  function layout(content) {
    var index = Math.max(0, stateOrder.indexOf(project.state));
    var total = stateOrder.length;
    var progress = Math.round(((index + 1) / total) * 100);
    return [
      '<section class="builder-layout" style="--progress:' + progress + '%">',
      '<header class="builder-top">',
      '<div class="builder-brand"><img src="./assets/autozap-logo-mark.png" alt=""><span>AutoZap Start</span></div>',
      '<div class="progress-wrap"><div class="progress-meta"><span>' + labelForState(project.state) + '</span><span>' + progress + '%</span></div><div class="progress-track"><i></i></div></div>',
      '<button class="ghost-action" type="button" data-action="save-exit">Continuar depois</button>',
      '</header>',
      '<div class="builder-body">',
      content,
      '</div>',
      '</section>'
    ].join("");
  }

  function stepContent(stateName) {
    var map = {
      "brand-name": renderBrandName,
      "city": renderCity,
      "style": renderStyle,
      "products": renderProducts,
      "colors": renderColors,
      "logo-style": renderLogoStyle,
      "brand-message": renderBrandMessage,
      "slogan": renderSlogan,
      "presentation": renderPresentation,
      "formalization": renderFormalization,
      "inventory": renderInventory,
      "plans": renderPlans,
      "autozap": renderAutoZap,
      "completed": renderCompleted
    };
    return (map[stateName] || renderBrandName)();
  }

  function header(kicker, title, description, compact) {
    return '<section class="step-card ' + (compact ? "compact" : "") + '"><div class="step-copy"><span class="step-kicker">' + escapeHtml(kicker) + '</span><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(description) + '</p></div>';
  }

  function actions(nextLabel, allowBack) {
    return '<div class="builder-actions">' +
      (allowBack ? '<button class="builder-secondary" type="button" data-action="back">Voltar</button>' : '') +
      '<button class="builder-primary" type="button" data-action="next">' + escapeHtml(nextLabel || "Continuar") + '</button>' +
      '</div></section>';
  }

  function renderBrandName() {
    var suggestions = suggestedNames();
    return header("Identidade visual gratuita", "Qual sera o nome da sua loja?", "Digite um nome ou escolha uma sugestao. Voce podera corrigir antes da geracao final.", true) +
      '<div class="field-stack"><label>Nome da loja<input data-field="brand.name" value="' + escapeAttr(project.brand.name) + '" placeholder="Ex: SmartCell"></label></div>' +
      '<div class="suggestion-row">' + suggestions.map(function(name) { return '<button class="chip" type="button" data-set-name="' + escapeAttr(name) + '">' + escapeHtml(name) + '</button>'; }).join("") + '</div>' +
      '<button class="ghost-action" type="button" data-action="new-suggestions">Gerar novas sugestoes</button>' +
      errorBox() +
      actions("Continuar", false);
  }

  function renderCity() {
    return header("Localizacao", "Em qual cidade sua loja vai atuar?", "Essa informacao ajuda a adaptar textos, apresentacao e estrategia local.", true) +
      '<div class="field-stack"><label>Cidade<input data-field="brand.city" value="' + escapeAttr(project.brand.city) + '" placeholder="Ex: Sao Paulo"></label><label>Estado<select data-field="brand.uf">' + options(["", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"], project.brand.uf, "Selecione") + '</select></label></div>' +
      errorBox() +
      actions("Continuar", true);
  }

  function renderStyle() {
    return header("Estilo", "Como voce imagina sua loja?", "Escolha uma direcao visual. Essa escolha guia logo, cores, linguagem e mockups.") +
      '<div class="option-grid">' + styleOptions.map(function(item) { return optionCard("brand.style", item[0], item[1], project.brand.style === item[0]); }).join("") + '</div>' +
      errorBox() +
      actions("Continuar", true);
  }

  function renderProducts() {
    return header("Produtos", "Quais produtos voce pretende vender?", "Selecione tudo que fizer sentido para o primeiro momento da loja.") +
      '<div class="option-grid">' + productOptions.map(function(item) { return optionCard("brand.products", item, "Selecionar categoria", project.brand.products.indexOf(item) >= 0, true); }).join("") + '</div>' +
      errorBox() +
      actions("Continuar", true);
  }

  function renderColors() {
    return header("Cores", "Escolha as cores da sua marca.", "Use uma paleta pronta ou ajuste manualmente cor principal, secundaria e destaque.") +
      '<div class="palette-grid">' + paletteOptions.map(function(palette, index) { return '<button class="palette-card ' + (samePalette(project.brand.colors, palette.colors) ? "active" : "") + '" type="button" data-palette="' + index + '"><div class="swatches">' + palette.colors.map(swatch).join("") + '</div><strong>' + escapeHtml(palette.name) + '</strong><small>Paleta configuravel para a identidade.</small></button>'; }).join("") + '</div>' +
      '<div class="color-controls"><label>Principal<input type="color" data-color-index="0" value="' + escapeAttr(project.brand.colors[0]) + '"></label><label>Secundaria<input type="color" data-color-index="1" value="' + escapeAttr(project.brand.colors[1]) + '"></label><label>Destaque<input type="color" data-color-index="2" value="' + escapeAttr(project.brand.colors[2]) + '"></label></div>' +
      actions("Continuar", true);
  }

  function renderLogoStyle() {
    return header("Logotipo", "Qual estilo de logotipo voce prefere?", "Essa escolha define a versao principal e a versao reduzida da marca.") +
      '<div class="option-grid">' + logoStyles.map(function(item) { return optionCard("brand.logoStyle", item, "Estilo de logo", project.brand.logoStyle === item); }).join("") + '</div>' +
      errorBox() +
      actions("Continuar", true);
  }

  function renderBrandMessage() {
    return header("Mensagem", "Qual mensagem sua marca deve transmitir?", "Escolha a percepcao principal que o cliente deve sentir ao ver sua loja.") +
      '<div class="option-grid">' + messageOptions.map(function(item) { return optionCard("brand.message", item, "Tom de comunicacao", project.brand.message === item); }).join("") + '</div>' +
      errorBox() +
      actions("Continuar", true);
  }

  function renderSlogan() {
    return header("Slogan", "Quer adicionar um slogan?", "Digite o seu, escolha uma sugestao ou pule. O download continua gratuito.", true) +
      '<div class="field-stack"><label>Slogan<input data-field="brand.slogan" value="' + escapeAttr(project.brand.slogan) + '" placeholder="Ex: Tecnologia perto de voce"></label></div>' +
      '<div class="suggestion-row">' + suggestedSlogans().map(function(text) { return '<button class="chip" type="button" data-set-slogan="' + escapeAttr(text) + '">' + escapeHtml(text) + '</button>'; }).join("") + '</div>' +
      '<div class="builder-actions"><button class="builder-secondary" type="button" data-action="back">Voltar</button><button class="builder-secondary" type="button" data-action="skip-slogan">Pular</button><button class="builder-primary" type="button" data-action="generate">Gerar identidade</button></div></section>';
  }

  function renderGenerating() {
    builder.innerHTML = '<section class="generation-screen"><div class="generation-card" style="--generation-progress:0%"><div class="brand-orbit"><span>' + escapeHtml(initials(project.brand.name)) + '</span></div><h2>Construindo sua identidade visual.</h2><p data-generation-message>' + generationMessages[0] + '</p><div class="generation-bar"><i></i></div><small>Mock visual inicial. Pronto para substituir por geracao real quando a API estiver disponivel.</small></div></section>';
    var index = 0;
    var card = builder.querySelector(".generation-card");
    var message = builder.querySelector("[data-generation-message]");
    var timer = setInterval(function() {
      index += 1;
      card.style.setProperty("--generation-progress", Math.min(100, Math.round((index / generationMessages.length) * 100)) + "%");
      message.textContent = generationMessages[Math.min(generationMessages.length - 1, index)];
      if (index >= generationMessages.length) {
        clearInterval(timer);
        generateIdentityMock();
        goTo("presentation");
      }
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 80 : 620);
  }

  function renderPresentation() {
    var identity = getIdentity();
    return header("Identidade pronta", "Sua identidade visual esta pronta.", "Veja a marca aplicada em contextos diferentes. Os downloads abaixo sao gratuitos.") +
      '<div class="presentation-grid"><div class="brand-board" style="--brand-primary:' + escapeAttr(identity.colors[0]) + '"><div class="generated-logo">' + escapeHtml(identity.logo) + '</div><h3>' + escapeHtml(identity.name) + '</h3><p>' + escapeHtml(identity.slogan) + '</p><div class="swatches">' + identity.colors.map(swatch).join("") + '</div><small>Tipografia sugerida: ' + escapeHtml(identity.typography) + '</small></div>' +
      '<div class="mockup-grid">' + ["Logo principal", "Perfil do Instagram", "Capa de rede social", "Cartao de visita", "Banner", "Pagina de loja virtual"].map(function(item) { return '<article class="mockup-card"><strong>' + item + '</strong><small>Modelo visual simulado, preparado para mockups reais.</small></article>'; }).join("") + '</div></div>' +
      '<div class="summary-panel"><strong>Tela-resumo</strong><p>Marca: ' + escapeHtml(identity.name) + ' | Paleta: ' + identity.colors.map(escapeHtml).join(", ") + ' | Slogan: ' + escapeHtml(identity.slogan) + '</p><div class="download-actions"><button class="builder-primary" type="button" data-download="identity">Baixar identidade visual</button><button class="builder-secondary" type="button" data-download="logo">Baixar logotipo</button><button class="builder-secondary" type="button" data-download="materials">Baixar materiais</button></div></div>' +
      actions("Continuar projeto", true);
  }

  function renderFormalization() {
    return header("Etapa opcional", "Quer deixar sua loja pronta para crescer?", "Entenda o MEI de forma simples. A abertura e opcional, gratuita pelo Governo Federal e nao e feita pelo AutoZap.") +
      '<article class="formalization-card"><span class="status-pill">Opcional</span><p>O MEI pode ajudar com CNPJ, emissao de nota fiscal, acesso a fornecedores, organizacao financeira e credibilidade comercial. Consulte as regras oficiais antes de abrir.</p><div class="builder-actions"><button class="builder-secondary" type="button" data-action="mei-info">Entender como funciona</button><a class="builder-primary" href="' + GOV_MEI_URL + '" target="_blank" rel="noreferrer">Abrir meu MEI</a><button class="builder-secondary" type="button" data-action="skip-formalization">Pular esta etapa</button></div></article>' +
      actions("Continuar para estoque", true);
  }

  function renderInventory() {
    return header("Primeiro estoque", "Monte uma sugestao inicial de pedido.", "Este modulo esta preparado para integracao com o Portal do Fornecedor. Pagamento e Pix devem ser feitos diretamente ao fornecedor.") +
      '<div class="inventory-card"><label>Quanto pretende investir?<select data-field="inventory.investment">' + options(investmentOptions, project.inventory.investment, "Selecione uma faixa") + '</select></label><div class="chip-row">' + productOptions.map(function(item) { return '<button class="chip ' + (project.inventory.categories.indexOf(item) >= 0 ? "active" : "") + '" type="button" data-inventory-category="' + escapeAttr(item) + '">' + escapeHtml(item) + '</button>'; }).join("") + '</div><label>Endereco para entrega futura<textarea data-field="inventory.address" placeholder="Informe depois ou deixe observacoes iniciais.">' + escapeHtml(project.inventory.address) + '</textarea></label><button class="ghost-action" type="button" data-action="mock-stock">Gerar sugestao mockada</button>' + inventorySuggestion() + '<p class="helper-note">Mock identificado: fornecedores, itens e pedidos serao conectados ao Portal do Fornecedor quando a integracao real estiver disponivel.</p></div>' +
      actions("Continuar", true);
  }

  function renderPlans() {
    return header("Presenca online", "Voce tem interesse em criar sua presenca online?", "Produtos digitais opcionais, configuraveis e de compra unica. Sem preco fixo no codigo.") +
      '<div class="plan-grid">' + planConfig.map(function(plan) { return '<article class="plan-card ' + (plan.highlight ? "highlight" : "") + '"><span class="status-pill">' + escapeHtml(plan.priceLabel) + '</span><strong>' + escapeHtml(plan.name) + '</strong><small>' + escapeHtml(plan.description) + '</small><ul>' + plan.benefits.map(function(benefit) { return '<li>' + escapeHtml(benefit) + '</li>'; }).join("") + '</ul><button class="builder-secondary" type="button" data-plan="' + escapeAttr(plan.id) + '">' + escapeHtml(plan.cta) + '</button></article>'; }).join("") + '</div>' +
      '<div class="builder-actions"><button class="builder-secondary" type="button" data-action="back">Voltar</button><button class="builder-secondary" type="button" data-action="skip-plans">Pular</button><button class="builder-primary" type="button" data-action="next">Continuar</button></div></section>';
  }

  function renderAutoZap() {
    return header("Ecossistema AutoZap", "Agora que voce entrou para esse mercado, conheca a plataforma criada para ajudar sua loja a crescer.", "O AutoZap pode ajudar com atendimento, clientes, vendas, automacao, marketing, catalogo, rotina comercial e inteligencia artificial.") +
      '<article class="autozap-card"><span class="status-pill">Proximo passo opcional</span><p>O AutoZap aparece aqui somente depois da criacao da base da loja. A prioridade do Start e ajudar voce a comecar.</p><div class="builder-actions"><a class="builder-primary" href="' + AUTOZAP_URL + '" target="_blank" rel="noreferrer">Conhecer o AutoZap</a></div></article>' +
      actions("Finalizar", true);
  }

  function renderCompleted() {
    var items = [
      ["Identidade visual criada", "done"],
      ["Formalizacao analisada", project.skipped.formalization ? "skipped" : "available"],
      ["Estoque montado", project.inventory.suggestion ? "done" : "available"],
      ["Presenca online analisada", project.skipped.plans ? "skipped" : "available"],
      ["AutoZap apresentado", "done"]
    ];
    return header("Concluido", "Sua loja comecou aqui.", "Voce pode baixar seus materiais, revisar o projeto ou continuar depois.") +
      '<div class="timeline-grid">' + items.map(function(item) { return '<article class="timeline-card" data-status="' + item[1] + '"><strong>' + escapeHtml(item[0]) + '</strong><small>' + statusLabel(item[1]) + '</small></article>'; }).join("") + '</div>' +
      '<div class="download-actions"><button class="builder-primary" type="button" data-download="identity">Baixar identidade visual</button><button class="builder-secondary" type="button" data-action="review">Ver meu projeto</button><button class="builder-secondary" type="button" data-action="save-exit">Continuar depois</button><a class="builder-secondary" href="' + AUTOZAP_URL + '" target="_blank" rel="noreferrer">Conhecer o AutoZap</a></div></section>';
  }

  function bindBuilderEvents() {
    builder.querySelectorAll("[data-field]").forEach(function(field) {
      field.addEventListener("input", function() {
        setPath(project, field.dataset.field, field.value);
        saveProject();
      });
    });
    builder.querySelectorAll("[data-option-field]").forEach(function(button) {
      button.addEventListener("click", function() {
        var field = button.dataset.optionField;
        var value = button.dataset.optionValue;
        if (button.dataset.multi === "true") toggleArray(getPath(project, field), value);
        else setPath(project, field, value);
        project.error = "";
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-palette]").forEach(function(button) {
      button.addEventListener("click", function() {
        project.brand.colors = paletteOptions[Number(button.dataset.palette)].colors.slice();
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-color-index]").forEach(function(input) {
      input.addEventListener("input", function() {
        project.brand.colors[Number(input.dataset.colorIndex)] = input.value;
        saveProject();
      });
    });
    builder.querySelectorAll("[data-set-name]").forEach(function(button) {
      button.addEventListener("click", function() {
        project.brand.name = button.dataset.setName;
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-set-slogan]").forEach(function(button) {
      button.addEventListener("click", function() {
        project.brand.slogan = button.dataset.setSlogan;
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-inventory-category]").forEach(function(button) {
      button.addEventListener("click", function() {
        toggleArray(project.inventory.categories, button.dataset.inventoryCategory);
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-plan]").forEach(function(button) {
      button.addEventListener("click", function() {
        project.selectedPlan = button.dataset.plan;
        saveProject();
        render();
      });
    });
    builder.querySelectorAll("[data-download]").forEach(function(button) {
      button.addEventListener("click", function() { downloadProject(button.dataset.download); });
    });
    builder.querySelectorAll("[data-action]").forEach(function(button) {
      button.addEventListener("click", function(event) {
        handleAction(button.dataset.action, event);
      });
    });
  }

  function handleAction(action) {
    if (action === "next") return next();
    if (action === "back") return back();
    if (action === "generate") return startGeneration();
    if (action === "skip-slogan") { project.brand.slogan = project.brand.slogan || ""; return startGeneration(); }
    if (action === "new-suggestions") return render();
    if (action === "skip-formalization") { project.skipped.formalization = true; return goTo("inventory"); }
    if (action === "skip-plans") { project.skipped.plans = true; return goTo("autozap"); }
    if (action === "mock-stock") { project.inventory.suggestion = buildStockSuggestion(); saveProject(); return render(); }
    if (action === "mei-info") { window.open(GOV_MEI_URL, "_blank", "noreferrer"); return; }
    if (action === "review") return goTo("presentation");
    if (action === "save-exit") {
      saveProject();
      alert("Progresso salvo neste navegador.");
    }
  }

  function next() {
    if (!validate(project.state)) return render();
    markDone(project.state);
    var index = stateOrder.indexOf(project.state);
    goTo(stateOrder[Math.min(stateOrder.length - 1, index + 1)]);
  }

  function back() {
    var index = stateOrder.indexOf(project.state);
    goTo(stateOrder[Math.max(0, index - 1)]);
  }

  function goTo(nextState) {
    project.state = nextState;
    project.error = "";
    saveProject();
    render();
  }

  function startGeneration() {
    if (!validate("slogan")) return render();
    if (!canGenerateIdentity()) {
      project.error = "Este navegador ja realizou a criacao gratuita inicial. A estrutura esta preparada para validar conta, e-mail, sessao, dispositivo e identificador interno no backend.";
      return render();
    }
    project.usage.identityGenerations += 1;
    saveUsage();
    project.state = "generating";
    saveProject();
    render();
  }

  function canGenerateIdentity() {
    return project.identity || Number(project.usage.identityGenerations || 0) < FREE_GENERATION_LIMIT;
  }

  function validate(stateName) {
    project.error = "";
    if (stateName === "brand-name" && project.brand.name.trim().length < 2) project.error = "Informe ou selecione um nome para a loja.";
    if (stateName === "city" && (!project.brand.city.trim() || !project.brand.uf)) project.error = "Informe cidade e estado.";
    if (stateName === "style" && !project.brand.style) project.error = "Escolha um estilo visual.";
    if (stateName === "products" && !project.brand.products.length) project.error = "Selecione pelo menos um tipo de produto.";
    if (stateName === "logo-style" && !project.brand.logoStyle) project.error = "Escolha um estilo de logotipo.";
    if (stateName === "brand-message" && !project.brand.message) project.error = "Escolha a mensagem principal da marca.";
    saveProject();
    return !project.error;
  }

  function generateIdentityMock() {
    var name = project.brand.name.trim() || "SmartCell";
    project.identity = {
      name: name,
      logo: initials(name),
      colors: project.brand.colors.slice(),
      typography: project.brand.style === "Premium" ? "Inter + serif display" : "Inter Bold",
      slogan: project.brand.slogan || suggestedSlogans()[0],
      files: ["brand-summary.json", "logo.txt", "social-materials.txt"],
      mock: true
    };
    markDone("slogan");
    saveProject();
  }

  function getIdentity() {
    return project.identity || {
      name: project.brand.name || "SmartCell",
      logo: initials(project.brand.name || "SmartCell"),
      colors: project.brand.colors,
      typography: "Inter Bold",
      slogan: project.brand.slogan || "Tecnologia perto de voce.",
      files: [],
      mock: true
    };
  }

  function buildStockSuggestion() {
    return {
      orderId: "AZS-" + Date.now().toString(36).toUpperCase(),
      supplier: "Fornecedor parceiro configuravel",
      items: (project.inventory.categories.length ? project.inventory.categories : project.brand.products).slice(0, 5).map(function(category, index) {
        return { category: category, quantity: (index + 1) * 6 };
      }),
      paymentNote: "Pagamento diretamente ao fornecedor. Pix do fornecedor.",
      mock: true
    };
  }

  function inventorySuggestion() {
    var suggestion = project.inventory.suggestion;
    if (!suggestion) return "";
    return '<div class="summary-panel"><span class="status-pill">Sugestao mockada</span><strong>Pedido ' + escapeHtml(suggestion.orderId) + '</strong><p>Fornecedor: ' + escapeHtml(suggestion.supplier) + '</p><ul>' + suggestion.items.map(function(item) { return '<li>' + escapeHtml(item.category) + ': ' + item.quantity + ' unidades</li>'; }).join("") + '</ul><small>' + escapeHtml(suggestion.paymentNote) + '</small></div>';
  }

  function downloadProject(type) {
    var identity = getIdentity();
    var payload = {
      type: type,
      generatedAt: new Date().toISOString(),
      note: "Download gratuito simulado. Estrutura pronta para arquivos reais.",
      brand: project.brand,
      identity: identity,
      inventory: project.inventory
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "autozap-start-" + type + ".json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function optionCard(field, value, description, active, multi) {
    return '<button class="option-card ' + (active ? "active" : "") + '" type="button" data-option-field="' + escapeAttr(field) + '" data-option-value="' + escapeAttr(value) + '" data-multi="' + (multi ? "true" : "false") + '"><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(description) + '</small></button>';
  }

  function suggestedNames() {
    var roots = ["SmartCell", "PrimeCell", "ZapCell Store", "ConnectCell", "Cell Mais", "NovaCell"];
    return roots.sort(function() { return Math.random() - .5; }).slice(0, 4);
  }

  function suggestedSlogans() {
    var city = project.brand.city || "voce";
    return [
      "Tecnologia perto de " + city + ".",
      "Seu celular em boas maos.",
      "Acessorios e atendimento sem complicacao.",
      "Conectando voce ao que importa."
    ];
  }

  function labelForState(stateName) {
    var labels = {
      "brand-name": "Nome",
      "city": "Cidade",
      "style": "Estilo",
      "products": "Produtos",
      "colors": "Cores",
      "logo-style": "Logo",
      "brand-message": "Mensagem",
      "slogan": "Slogan",
      "presentation": "Identidade pronta",
      "formalization": "Formalizacao opcional",
      "inventory": "Estoque",
      "plans": "Produtos digitais",
      "autozap": "AutoZap",
      "completed": "Final"
    };
    return labels[stateName] || "Projeto";
  }

  function statusLabel(status) {
    return { done: "Concluido", skipped: "Ignorado", available: "Disponivel" }[status] || "Pendente";
  }

  function markDone(stateName) {
    project.completed[stateName] = true;
  }

  function errorBox() {
    return project.error ? '<div class="error-box">' + escapeHtml(project.error) + '</div>' : "";
  }

  function options(items, selected, emptyLabel) {
    var html = emptyLabel ? '<option value="">' + escapeHtml(emptyLabel) + '</option>' : "";
    return html + items.filter(Boolean).map(function(item) {
      return '<option ' + (item === selected ? "selected" : "") + '>' + escapeHtml(item) + '</option>';
    }).join("");
  }

  function swatch(color) {
    return '<i style="background:' + escapeAttr(color) + '"></i>';
  }

  function samePalette(a, b) {
    return a.join("|").toLowerCase() === b.join("|").toLowerCase();
  }

  function toggleArray(array, value) {
    var index = array.indexOf(value);
    if (index >= 0) array.splice(index, 1);
    else array.push(value);
  }

  function setPath(target, path, value) {
    var parts = path.split(".");
    var cursor = target;
    parts.slice(0, -1).forEach(function(part) { cursor = cursor[part]; });
    cursor[parts[parts.length - 1]] = value;
  }

  function getPath(target, path) {
    return path.split(".").reduce(function(cursor, part) { return cursor && cursor[part]; }, target);
  }

  function initials(value) {
    return String(value || "AZ").split(/\s+/).filter(Boolean).slice(0, 2).map(function(word) { return word.charAt(0); }).join("").toUpperCase() || "AZ";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }
})();
