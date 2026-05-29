const desktopConfig = window.AUTOZAP_START_CONFIG || window.AutoZapConfig || {};
const DESKTOP_STATE_KEY = "autozap_start_desktop_state";
const DESKTOP_EVENTS_KEY = "autozap_start_events";

const desktopSteps = [
  {
    title: "Monte sua loja",
    description: "Organize identidade, atendimento e estoque inicial em poucos passos.",
    navLabel: "Inicio",
    cta: "Comecar",
  },
  {
    title: "Nome e logo",
    description: "Informe a base da marca para criar uma apresentacao pronta para vender.",
    navLabel: "Identidade",
    cta: "Continuar",
  },
  {
    title: "Perfil da loja",
    description: "Escolha foco, categorias e modelo de atendimento.",
    navLabel: "Perfil comercial",
    cta: "Continuar",
  },
  {
    title: "Atendimento",
    description: "Defina dados basicos, garantia e observacoes importantes para o cliente.",
    navLabel: "Dados operacionais",
    cta: "Continuar",
  },
  {
    title: "Estoque inicial",
    description: "Escolha um fornecedor e selecione os primeiros produtos da loja.",
    navLabel: "Fornecedor e itens",
    cta: "Continuar",
  },
  {
    title: "Revisao final",
    description: "Confira a loja antes de salvar.",
    navLabel: "Revisao",
    cta: "Salvar loja",
  },
  {
    title: "Finalizar",
    description: "Informe seus dados para receber o proximo passo.",
    navLabel: "Contato",
    cta: "Salvar lead",
  },
];

const desktopState = {
  currentStep: 0,
  sessionToken: "",
  storeName: "TechCell",
  city: "",
  state: "",
  businessType: "Loja de celulares",
  capital: "R$ 1.000 a R$ 3.000",
  focus: "Acessorios",
  categories: ["Celulares", "Acessórios"],
  operationType: "Loja fisica",
  identity: {},
  imageDataUrl: "",
  imageNotice: "",
  colors: ["#087cff", "#07133f", "#0faa62", "#f5f9ff"],
  slogan: "Celulares, acessorios e assistencia sem complicacao.",
  instagramBio: "",
  whatsappDescription: "",
  googleBusinessDescription: "",
  cnpjCpf: "",
  warrantyPolicy: "7 dias",
  serviceMode: "WhatsApp e balcão",
  legalNotes: "",
  suppliers: [],
  selectedSupplierId: "",
  products: [],
  selectedProducts: [],
  total: 0,
  leadName: "",
  leadWhatsapp: "",
  leadEmail: "",
  saved: false,
};

Object.assign(desktopState, loadDesktopState());

function initDesktopStart() {
  redirectSmallScreensToMobile();
  bindDesktopEvents();
  renderDesktopNav();
  renderDesktopStep();
  renderDesktopPreview();
  ensureStartSession();
  trackDesktopEvent("desktop_loaded", { step: desktopState.currentStep });
}

function redirectSmallScreensToMobile() {
  const params = new URLSearchParams(window.location.search);
  if (window.innerWidth <= 520 && params.get("desktop") !== "1") {
    window.location.href = "./mobile.html";
  }
}

function bindDesktopEvents() {
  document.querySelector("#desktopBackBtn").addEventListener("click", goBack);
  document.querySelector("#desktopNextBtn").addEventListener("click", goNext);
  document.querySelector("#desktopContinueAutoZap").addEventListener("click", () => {
    trackDesktopEvent("continue_to_autozap_clicked", { source: "desktop_preview", href: getMainAutoZapUrl() });
  });
}

function renderDesktopNav() {
  const nav = document.querySelector("#desktopStepsNav");
  nav.innerHTML = "";
  desktopSteps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      index === desktopState.currentStep ? "active" : "",
      index < desktopState.currentStep ? "done" : "",
    ].filter(Boolean).join(" ");
    button.innerHTML = `<span>${index + 1}</span><strong>${step.title}</strong>`;
    button.addEventListener("click", () => {
      desktopState.currentStep = index;
      saveDesktopState();
      renderDesktopStep();
    });
    nav.appendChild(button);
  });
}

function renderDesktopStep() {
  const step = desktopSteps[desktopState.currentStep];
  const percent = Math.round((desktopState.currentStep / (desktopSteps.length - 1)) * 100);
  document.querySelector("#desktopStepKicker").textContent = `Etapa ${desktopState.currentStep + 1} de ${desktopSteps.length}`;
  document.querySelector("#desktopStepTitle").textContent = step.title;
  document.querySelector("#desktopStepDescription").textContent = step.description;
  document.querySelector("#desktopProgressLabel").textContent = `${percent}% concluido`;
  document.querySelector("#desktopProgressBar").style.width = `${percent}%`;
  document.querySelector("#desktopPreviewStep").textContent = `${desktopState.currentStep + 1}/${desktopSteps.length}`;
  document.querySelector("#desktopPreviewSelectedCount").textContent = String(desktopState.selectedProducts.length);
  document.querySelector("#desktopPreviewSession").textContent = desktopState.saved ? "Salva" : "Em criacao";
  document.querySelector("#desktopBackBtn").disabled = desktopState.currentStep === 0;
  document.querySelector("#desktopNextBtn").textContent = step.cta;
  document.querySelector("#desktopContinueAutoZap").href = getMainAutoZapUrl();

  const content = document.querySelector("#desktopStepContent");
  content.innerHTML = "";
  content.appendChild(renderers[desktopState.currentStep]());
  renderDesktopNav();
  renderDesktopPreview();
  saveDesktopState();
  trackDesktopEvent("step_viewed", { step: desktopState.currentStep, title: step.title });
}

async function goNext() {
  syncDesktopInputs();
  if (desktopState.currentStep === 0) {
    desktopState.currentStep += 1;
    renderDesktopStep();
    return;
  }
  if (desktopState.currentStep === 1 && !desktopState.identity.generatedIdentity) {
    const ok = await generateDesktopIdentity();
    if (!ok) return;
  }
  if (desktopState.currentStep === 4 && !desktopState.suppliers.length) {
    await loadDesktopSuppliers();
  }
  if (desktopState.currentStep === 6) {
    await saveDesktopLead();
    return;
  }
  desktopState.currentStep = Math.min(desktopSteps.length - 1, desktopState.currentStep + 1);
  renderDesktopStep();
}

function goBack() {
  syncDesktopInputs();
  desktopState.currentStep = Math.max(0, desktopState.currentStep - 1);
  renderDesktopStep();
}

async function ensureStartSession() {
  if (!AutoZapAPI.ensureStartSession) {
    const session = await AutoZapAPI.createAnonymousSession();
    desktopState.sessionToken = session && (session.sessionToken || session.token || session.id || session.anonymousSessionId) || "";
  } else {
    const session = await AutoZapAPI.ensureStartSession();
    desktopState.sessionToken = AutoZapAPI.getStartSessionToken ? AutoZapAPI.getStartSessionToken() : "";
    if (!desktopState.sessionToken && session) desktopState.sessionToken = session.sessionToken || session.token || session.id || session.anonymousSessionId || "";
  }
  document.querySelector("#desktopSessionStatus").textContent = desktopState.saved ? "Loja salva" : "Loja em criacao";
  document.querySelector("#desktopApiStatus").textContent = "Progresso";
  document.querySelector("#desktopPreviewSession").textContent = desktopState.saved ? "Salva" : "Em criacao";
  saveDesktopState();
}

async function generateDesktopIdentity() {
  syncDesktopInputs();
  showDesktopMessage("Gerando identidade textual...", "info");
  await ensureStartSession();
  const message = buildDesktopIdentityMessage();
  const identityResponse = await AutoZapAPI.generateIdentity({
    message,
    prompt: message,
    description: message,
    storeName: desktopState.storeName,
    idea: desktopState.storeName,
    focus: desktopState.focus,
    city: formatLocation(),
    state: desktopState.state,
    businessType: desktopState.businessType,
    source: "autozap-start",
  });
  if (identityResponse && identityResponse.ok && identityResponse.data) {
    Object.assign(desktopState, pickIdentity(identityResponse.data));
    desktopState.identity = { ...identityResponse.data, generatedIdentity: true };
  } else {
    desktopState.identity = { generatedIdentity: true, fallback: true };
    desktopState.slogan = desktopState.slogan || `${desktopState.businessType} com atendimento claro.`;
    desktopState.instagramBio = `${desktopState.storeName} | ${desktopState.focus}. Atendimento pelo WhatsApp.`;
    desktopState.whatsappDescription = `${desktopState.storeName}: celulares, acessorios e suporte com atendimento simples.`;
    showDesktopMessage(desktopApiMessage(identityResponse, "Nao foi possivel gerar a identidade agora. Mantivemos uma base inicial para voce continuar."), "warning");
  }

  const bioResponse = await AutoZapAPI.generateBio({
    storeName: desktopState.storeName,
    focus: desktopState.focus,
    city: formatLocation(),
    businessType: desktopState.businessType,
  });
  if (bioResponse && bioResponse.ok && bioResponse.data) Object.assign(desktopState, pickIdentity(bioResponse.data));

  await generateDesktopImage();
  renderDesktopPreview();
  renderDesktopStep();
  trackDesktopEvent("identity_generated", { storeName: desktopState.storeName, imageGenerated: Boolean(desktopState.imageDataUrl) });
  showDesktopMessage(desktopState.imageNotice || "Identidade gerada.", desktopState.imageNotice ? "warning" : "success");
  return true;
}

async function generateDesktopImage() {
  desktopState.imageDataUrl = "";
  desktopState.imageNotice = "";
  if (!AutoZapAPI.generateStartImage) {
    desktopState.imageNotice = "Imagem automática indisponível agora. Usamos uma prévia provisória.";
    return false;
  }
  const imageResponse = await AutoZapAPI.generateStartImage({
    storeName: desktopState.storeName,
    description: desktopState.slogan,
    businessType: desktopState.businessType,
    focus: desktopState.focus,
    style: desktopState.identity.tone || "moderno, tecnologico, premium",
    colors: desktopState.colors,
  });
  if (imageResponse && imageResponse.ok && imageResponse.data && imageResponse.data.imageDataUrl) {
    desktopState.imageDataUrl = imageResponse.data.imageDataUrl;
    desktopState.imageModel = imageResponse.data.model || "";
    return true;
  }
  desktopState.imageNotice = imageResponse && imageResponse.status === 429
    ? (imageResponse.message || "Limite de geração de imagem atingido. Tente novamente em alguns minutos.")
    : (imageResponse && imageResponse.message) || "Imagem automática indisponível agora. Usamos uma prévia provisória.";
  return false;
}

async function loadDesktopSuppliers() {
  showDesktopMessage("Buscando fornecedores...", "info");
  await ensureStartSession();
  const response = await AutoZapAPI.apiGetStartSuppliers();
  if (response && response.ok) {
    desktopState.suppliers = response.suppliers || response.data || [];
    if (!desktopState.selectedSupplierId && desktopState.suppliers[0]) desktopState.selectedSupplierId = desktopState.suppliers[0].id;
    showDesktopMessage(desktopState.suppliers.length ? "Fornecedores carregados." : "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois.", desktopState.suppliers.length ? "success" : "warning");
    if (desktopState.selectedSupplierId) await loadDesktopProducts(desktopState.selectedSupplierId);
  } else {
    desktopState.suppliers = [];
    desktopState.products = [];
    showDesktopMessage(desktopApiMessage(response, "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois."), "error");
  }
  renderDesktopStep();
  renderDesktopPreview();
}

async function loadDesktopProducts(supplierId) {
  desktopState.selectedSupplierId = supplierId;
  desktopState.products = [];
  showDesktopMessage("Carregando produtos do fornecedor...", "info");
  const response = await AutoZapAPI.apiGetStartSupplierProducts(supplierId);
  if (response && response.ok) {
    desktopState.products = response.products || response.data || [];
    desktopState.selectedProducts = desktopState.selectedProducts.filter((selected) => desktopState.products.some((product) => product.id === selected.productId));
    showDesktopMessage(desktopState.products.length ? "Produtos carregados." : "Este fornecedor ainda nao possui produtos disponiveis.", desktopState.products.length ? "success" : "warning");
  } else {
    desktopState.products = [];
    desktopState.selectedProducts = [];
    showDesktopMessage(desktopApiMessage(response, "Não foi possível carregar produtos reais agora."), "error");
  }
  calculateDesktopTotal();
  renderDesktopStep();
  renderDesktopPreview();
}

function toggleDesktopProduct(productId) {
  const existing = desktopState.selectedProducts.find((item) => item.productId === productId);
  if (existing) {
    desktopState.selectedProducts = desktopState.selectedProducts.filter((item) => item.productId !== productId);
  } else {
    const product = desktopState.products.find((item) => item.id === productId);
    if (product) desktopState.selectedProducts.push(selectedFromProduct(product, 1));
  }
  calculateDesktopTotal();
  renderDesktopStep();
  renderDesktopPreview();
}

function updateDesktopProductQuantity(productId, qty) {
  const quantity = Math.max(1, Number(qty) || 1);
  desktopState.selectedProducts = desktopState.selectedProducts.map((item) => (
    item.productId === productId ? { ...item, quantity, total: item.price * quantity } : item
  ));
  calculateDesktopTotal();
  renderDesktopPreview();
}

function calculateDesktopTotal() {
  desktopState.total = desktopState.selectedProducts.reduce((sum, product) => sum + Number(product.total || 0), 0);
  saveDesktopState();
  return desktopState.total;
}

async function saveDesktopLead() {
  syncDesktopInputs();
  desktopState.leadWhatsapp = sanitizeDesktopPhone(desktopState.leadWhatsapp);
  desktopState.leadEmail = sanitizeDesktopEmail(desktopState.leadEmail);
  if (!desktopState.leadWhatsapp && !desktopState.leadEmail) {
    showDesktopMessage("Informe WhatsApp ou e-mail para salvar sua loja.", "warning");
    return false;
  }
  await ensureStartSession();
  showDesktopMessage("Salvando sua loja...", "info");
  const response = await AutoZapAPI.saveLead({
    name: desktopState.leadName || desktopState.storeName,
    contact: desktopState.leadWhatsapp || desktopState.leadEmail,
    phone: desktopState.leadWhatsapp,
    email: desktopState.leadEmail,
    storeName: desktopState.storeName,
    city: desktopState.city,
    state: desktopState.state,
    capital: desktopState.capital,
    businessType: desktopState.businessType,
    operationType: desktopState.operationType,
    categories: desktopState.categories,
    identity: {
      storeName: desktopState.storeName,
      slogan: desktopState.slogan,
      logo: initialsFrom(desktopState.storeName),
      colors: desktopState.colors,
      instagramBio: desktopState.instagramBio,
      whatsappDescription: desktopState.whatsappDescription,
      googleBusinessDescription: desktopState.googleBusinessDescription,
      generatedIdentity: Boolean(desktopState.identity.generatedIdentity),
    },
    recommendedSupplier: selectedSupplier(),
    selectedSupplierId: desktopState.selectedSupplierId,
    selectedProducts: desktopState.selectedProducts,
    estimatedInitialStockValue: desktopState.total,
    finalSummary: buildDesktopFinalSummary(),
    warrantyPolicy: desktopState.warrantyPolicy,
    generatedIdentity: Boolean(desktopState.identity.generatedIdentity),
    progress: 100,
    source: "autozap-start",
  });
  if (response && response.ok) {
    desktopState.saved = true;
    saveDesktopState();
    renderDesktopPreview();
    showDesktopMessage("Loja salva. Agora voce pode continuar para o AutoZap.", "success");
    trackDesktopEvent("lead_saved", { storeName: desktopState.storeName, total: desktopState.total });
    return true;
  }
  showDesktopMessage(desktopApiMessage(response, "Não foi possível salvar sua loja agora. Confira sua conexão e tente novamente."), "error");
  return false;
}

function renderDesktopPreview() {
  const logo = document.querySelector("#desktopPreviewLogo");
  const initials = initialsFrom(desktopState.storeName);
  logo.classList.toggle("has-image", Boolean(desktopState.imageDataUrl));
  logo.style.backgroundImage = desktopState.imageDataUrl ? `url("${desktopState.imageDataUrl}")` : "";
  logo.textContent = desktopState.imageDataUrl ? "" : initials;
  document.querySelector("#desktopPreviewName").textContent = desktopState.storeName || "TechCell";
  document.querySelector("#desktopPreviewLocation").textContent = formatLocation() || "Cidade ainda nao informada";
  document.querySelector("#desktopPreviewSlogan").textContent = desktopState.slogan || "Celulares, acessorios e assistencia sem complicacao.";
  document.querySelector("#desktopPreviewBio").textContent = desktopState.instagramBio || desktopState.whatsappDescription || "A descricao da loja aparece aqui depois da identidade.";
  document.querySelector("#desktopPreviewStep").textContent = `${desktopState.currentStep + 1}/${desktopSteps.length}`;
  document.querySelector("#desktopPreviewSelectedCount").textContent = String(desktopState.selectedProducts.length);
  document.querySelector("#desktopPreviewSession").textContent = desktopState.saved ? "Salva" : "Em criacao";
  const colors = desktopState.colors && desktopState.colors.length ? desktopState.colors : ["#087cff", "#07133f", "#0faa62", "#f5f9ff"];
  document.querySelector("#desktopPreviewColors").innerHTML = colors.slice(0, 6).map((color) => `<i style="background:${escapeHtml(color)}"></i>`).join("");

  const supplier = selectedSupplier();
  document.querySelector("#desktopPreviewSupplier").textContent = supplier ? (supplier.supplierName || supplier.name) : "Nenhum fornecedor selecionado";
  document.querySelector("#desktopPreviewSupplierMeta").textContent = supplier ? [supplier.city, supplier.state, `${supplier.productCount || 0} produtos`].filter(Boolean).join(" · ") : "Escolha um fornecedor na etapa de estoque.";

  const products = document.querySelector("#desktopPreviewProducts");
  products.innerHTML = desktopState.selectedProducts.length
    ? desktopState.selectedProducts.slice(0, 5).map((product) => `<article><strong>${escapeHtml(product.name)}</strong><span>${product.quantity} x ${formatCurrency(product.price)}</span></article>`).join("")
    : `<span>Nenhum produto selecionado.</span>`;
  document.querySelector("#desktopPreviewTotal").textContent = formatCurrency(desktopState.total);
}

function showDesktopMessage(message, type = "info") {
  const target = document.querySelector("#desktopMessage");
  target.hidden = !message;
  target.textContent = message || "";
  target.className = `desktop-message ${type === "info" ? "" : type}`;
}

function syncDesktopInputs() {
  document.querySelectorAll("[data-state]").forEach((field) => {
    const key = field.dataset.state;
    if (!key) return;
    desktopState[key] = field.value;
  });
  const categories = Array.from(document.querySelectorAll("[data-category].active")).map((button) => button.dataset.category);
  if (categories.length) desktopState.categories = categories;
  const operation = document.querySelector("[data-operation].active");
  if (operation) desktopState.operationType = operation.dataset.operation;
  calculateDesktopTotal();
}

const renderers = [
  renderIntroStep,
  renderIdentityStep,
  renderDiagnosticStep,
  renderLegalStep,
  renderStockStep,
  renderFinalStep,
  renderSaveStep,
];

function renderIntroStep() {
  const root = el("div", "intro-panel");
  root.innerHTML = `
    <article class="intro-card intro-hero">
      <span class="preview-label">AutoZap Start</span>
      <strong>Transforme sua ideia em uma loja pronta para atender no WhatsApp.</strong>
      <p>Preencha as informacoes principais, escolha os primeiros produtos e revise tudo antes de salvar.</p>
    </article>
    <article class="intro-card intro-checklist">
      <strong>O que voce vai montar</strong>
      <ul>
        <li>Nome, slogan e visual da loja</li>
        <li>Perfil de atendimento e garantia</li>
        <li>Fornecedor, produtos e investimento inicial</li>
      </ul>
    </article>
  `;
  return root;
}

function renderIdentityStep() {
  const root = el("div", "form-grid");
  root.innerHTML = `
    <article class="field-card"><label>Nome ou ideia da loja<input data-state="storeName" value="${escapeAttr(desktopState.storeName)}" placeholder="Ex.: TechCell"></label></article>
    <article class="field-card"><label>Cidade<input data-state="city" value="${escapeAttr(desktopState.city)}" placeholder="São Paulo"></label></article>
    <article class="field-card"><label>Estado<input data-state="state" value="${escapeAttr(desktopState.state)}" placeholder="SP"></label></article>
    <article class="field-card"><label>Segmento<input data-state="businessType" value="${escapeAttr(desktopState.businessType)}" placeholder="Loja de celulares"></label></article>
    <article class="field-card full">
      <p>Crie uma apresentacao inicial com nome, slogan, bio e visual da marca.</p>
      <button data-action="generate-identity" class="primary inline-action" type="button">Gerar apresentacao</button>
    </article>
  `;
  bindStateInputs(root);
  root.querySelector("[data-action='generate-identity']").addEventListener("click", generateDesktopIdentity);
  return root;
}

function renderDiagnosticStep() {
  const root = el("div", "form-grid");
  root.innerHTML = `
    <article class="field-card"><label>Capital<select data-state="capital">${options(["Até R$ 1.000", "R$ 1.000 a R$ 3.000", "R$ 3.000 a R$ 8.000", "Acima de R$ 8.000"], desktopState.capital)}</select></label></article>
    <article class="field-card"><label>Foco<select data-state="focus">${options(["Acessorios", "Celulares", "Assistencia", "iPhone", "Peças"], desktopState.focus)}</select></label></article>
    <article class="field-card full">
      <strong>Categorias</strong>
      <div class="choice-row">${["Celulares", "Acessórios", "Películas", "Capinhas", "Carregadores", "Fones", "Peças", "Serviços"].map((category) => `<button class="${desktopState.categories.includes(category) ? "active" : ""}" data-category="${escapeAttr(category)}" type="button">${escapeHtml(category)}</button>`).join("")}</div>
    </article>
    <article class="field-card full">
      <strong>Operacao</strong>
      <div class="choice-row">${["Loja fisica", "Online", "WhatsApp", "Assistencia tecnica"].map((item) => `<button class="${desktopState.operationType === item ? "active" : ""}" data-operation="${escapeAttr(item)}" type="button">${escapeHtml(item)}</button>`).join("")}</div>
    </article>
  `;
  bindStateInputs(root);
  bindChoiceButtons(root);
  return root;
}

function renderLegalStep() {
  const root = el("div", "legal-grid");
  root.innerHTML = `
    <div class="form-grid">
      <article class="field-card"><label>CNPJ ou CPF opcional<input data-state="cnpjCpf" value="${escapeAttr(desktopState.cnpjCpf)}" placeholder="Opcional"></label></article>
      <article class="field-card"><label>Politica de garantia<select data-state="warrantyPolicy">${options(["7 dias", "30 dias", "90 dias", "A combinar"], desktopState.warrantyPolicy)}</select></label></article>
      <article class="field-card"><label>Forma de atendimento<select data-state="serviceMode">${options(["WhatsApp e balcão", "Somente WhatsApp", "Loja online", "Assistencia com agendamento"], desktopState.serviceMode)}</select></label></article>
      <article class="field-card"><label>Observacoes<textarea data-state="legalNotes" placeholder="Troca, nota fiscal, retirada, entrega...">${escapeHtml(desktopState.legalNotes)}</textarea></label></article>
    </div>
    <article class="summary-card">
      <strong>Resumo de atendimento</strong>
      <p>Essas informacoes ajudam a organizar trocas, garantia, retirada e contato com clientes.</p>
    </article>
  `;
  bindStateInputs(root);
  return root;
}

function renderStockStep() {
  const root = el("div", "stock-step");
  const suppliers = desktopState.suppliers.length
    ? desktopState.suppliers.map((supplier) => supplierCard(supplier)).join("")
    : `<div class="empty-state">Nenhum fornecedor carregado ainda.</div>`;
  const products = desktopState.products.length
    ? desktopState.products.map((product) => productCard(product)).join("")
    : `<div class="empty-state">${desktopState.selectedSupplierId ? "Este fornecedor ainda nao possui produtos disponiveis." : "Selecione um fornecedor para carregar produtos."}</div>`;
  root.innerHTML = `
    <div class="choice-row">
      <button data-action="load-suppliers" class="primary inline-action" type="button">Buscar fornecedores</button>
      <span class="pill active">${formatCurrency(desktopState.total)} selecionados</span>
    </div>
    <h3>Fornecedores</h3>
    <div class="supplier-list">${suppliers}</div>
    <h3>Produtos</h3>
    <div class="product-list">${products}</div>
  `;
  root.querySelector("[data-action='load-suppliers']").addEventListener("click", loadDesktopSuppliers);
  root.querySelectorAll("[data-supplier-id]").forEach((card) => {
    card.addEventListener("click", () => loadDesktopProducts(card.dataset.supplierId));
  });
  root.querySelectorAll("[data-product-id]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.matches("input")) return;
      toggleDesktopProduct(card.dataset.productId);
    });
  });
  root.querySelectorAll("[data-product-qty]").forEach((input) => {
    input.addEventListener("input", () => updateDesktopProductQuantity(input.dataset.productQty, input.value));
  });
  return root;
}

function renderFinalStep() {
  const supplier = selectedSupplier();
  const root = el("div", "final-grid");
  root.innerHTML = `
    <article class="final-card"><span class="preview-label">Identidade</span><strong>${escapeHtml(desktopState.storeName)}</strong><p>${escapeHtml(desktopState.slogan)}</p><p>${escapeHtml(desktopState.instagramBio || "Bio ainda nao gerada.")}</p></article>
    <article class="final-card"><span class="preview-label">Operacao</span><strong>${escapeHtml(desktopState.operationType)}</strong><p>${escapeHtml(formatLocation() || "Cidade nao informada")} · ${escapeHtml(desktopState.capital)}</p><p>${escapeHtml(desktopState.categories.join(", "))}</p></article>
    <article class="final-card"><span class="preview-label">Fornecedor</span><strong>${escapeHtml(supplier ? supplier.supplierName || supplier.name : "Nenhum fornecedor selecionado")}</strong><p>${escapeHtml(supplier ? [supplier.city, supplier.state].filter(Boolean).join(" - ") : "Carregue e selecione fornecedor na etapa anterior.")}</p></article>
    <article class="final-card"><span class="preview-label">Estoque</span><strong>${formatCurrency(desktopState.total)}</strong><p>${desktopState.selectedProducts.length} produto(s) selecionado(s).</p></article>
  `;
  return root;
}

function renderSaveStep() {
  const root = el("div", "save-grid");
  root.innerHTML = `
    <article class="field-card"><label>Nome<input data-state="leadName" value="${escapeAttr(desktopState.leadName)}" placeholder="Seu nome"></label></article>
    <article class="field-card"><label>WhatsApp<input data-state="leadWhatsapp" value="${escapeAttr(desktopState.leadWhatsapp)}" placeholder="(00) 00000-0000"></label></article>
    <article class="field-card"><label>E-mail opcional<input data-state="leadEmail" value="${escapeAttr(desktopState.leadEmail)}" placeholder="voce@email.com"></label></article>
    <article class="summary-card">
      <strong>Proximo passo recomendado</strong>
      <p>Depois de salvar, continue para o AutoZap principal para estruturar atendimento, vendas, estoque e financeiro.</p>
      <button data-action="save-lead" class="primary" type="button">Salvar loja</button>
    </article>
  `;
  bindStateInputs(root);
  root.querySelector("[data-action='save-lead']").addEventListener("click", saveDesktopLead);
  return root;
}

function supplierCard(supplier) {
  const active = desktopState.selectedSupplierId === supplier.id;
  return `
    <article class="supplier-card ${active ? "active" : ""}" data-supplier-id="${escapeAttr(supplier.id)}">
      <strong>${escapeHtml(supplier.supplierName || supplier.name)}</strong>
      <small>${escapeHtml([supplier.city, supplier.state].filter(Boolean).join(" - ") || "Local nao informado")}</small>
      <div class="supplier-meta"><span>${Number(supplier.productCount || 0)} produtos</span><span>${escapeHtml(supplier.deliveryTime || "prazo a combinar")}</span></div>
    </article>
  `;
}

function productCard(product) {
  const selected = desktopState.selectedProducts.find((item) => item.productId === product.id);
  return `
    <article class="product-card ${selected ? "active" : ""}" data-product-id="${escapeAttr(product.id)}">
      <strong>${escapeHtml(product.name)}</strong>
      <small>${escapeHtml(product.category || "Produto")}</small>
      <div class="product-meta"><span>${formatCurrency(product.price)}</span><span>${Number(product.stock || product.quantity || 0)} em estoque</span></div>
      ${selected ? `<div class="qty-row"><span>Quantidade</span><input data-product-qty="${escapeAttr(product.id)}" type="number" min="1" value="${selected.quantity}"></div>` : `<span class="pill">Selecionar</span>`}
    </article>
  `;
}

function bindStateInputs(root) {
  root.querySelectorAll("[data-state]").forEach((field) => {
    field.addEventListener("input", () => {
      desktopState[field.dataset.state] = field.value;
      calculateDesktopTotal();
      renderDesktopPreview();
      saveDesktopState();
    });
  });
}

function bindChoiceButtons(root) {
  root.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.toggle("active");
      const categories = Array.from(root.querySelectorAll("[data-category].active")).map((item) => item.dataset.category);
      desktopState.categories = categories.length ? categories : [button.dataset.category];
      if (!categories.length) button.classList.add("active");
      renderDesktopPreview();
      saveDesktopState();
    });
  });
  root.querySelectorAll("[data-operation]").forEach((button) => {
    button.addEventListener("click", () => {
      root.querySelectorAll("[data-operation]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      desktopState.operationType = button.dataset.operation;
      saveDesktopState();
    });
  });
}

function selectedFromProduct(product, quantity) {
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Number(product.price || 0);
  return {
    supplierId: desktopState.selectedSupplierId,
    productId: product.id,
    name: product.name,
    price,
    quantity: qty,
    total: price * qty,
  };
}

function selectedSupplier() {
  return desktopState.suppliers.find((supplier) => supplier.id === desktopState.selectedSupplierId) || null;
}

function pickIdentity(data) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  return {
    storeName: source.storeName || source.name || desktopState.storeName,
    slogan: source.slogan || source.tagline || desktopState.slogan,
    colors: Array.isArray(source.colors) && source.colors.length ? source.colors : desktopState.colors,
    instagramBio: source.instagramBio || desktopState.instagramBio,
    whatsappDescription: source.whatsappDescription || source.googleDescription || desktopState.whatsappDescription,
    googleBusinessDescription: source.googleBusinessDescription || source.googleDescription || desktopState.googleBusinessDescription,
  };
}

function trackDesktopEvent(eventName, payload = {}) {
  const event = {
    eventName,
    payload,
    source: "desktop",
    step: desktopState.currentStep,
    environment: desktopShouldUseMock() ? "mock" : "real-api",
    createdAt: new Date().toISOString(),
  };
  try {
    const events = JSON.parse(localStorage.getItem(DESKTOP_EVENTS_KEY)) || [];
    events.push(event);
    localStorage.setItem(DESKTOP_EVENTS_KEY, JSON.stringify(events.slice(-200)));
  } catch (error) {
    localStorage.setItem(DESKTOP_EVENTS_KEY, JSON.stringify([event]));
  }
  console.log("[AutoZap Start analytics]", eventName, event);
}

function desktopShouldUseMock() {
  const useMock = String(localStorage.getItem("USE_MOCK") || "").toLowerCase();
  return desktopConfig.mockMode === true || useMock === "1" || useMock === "true";
}

function desktopApiMessage(error, fallback = "Não foi possível concluir agora.") {
  const status = Number(error && error.status);
  if (!status && error && (error.status === 0 || error.fetchFailed)) return "Não foi possível conectar agora. Tente novamente em alguns instantes.";
  if (status === 400 || status === 422) return "Dados incompletos ou inválidos.";
  if (status === 401) return "Sua sessao expirou. Atualize a pagina e tente novamente.";
  if (status === 404) return "Nao encontramos essa informacao no momento.";
  if (status === 429) return error && (error.message || error.error) || "Limite de uso atingido. Tente novamente em alguns minutos.";
  if (status >= 500) return "Erro interno no servidor.";
  return error && (error.error || error.message) || fallback;
}

function buildDesktopFinalSummary() {
  const supplier = selectedSupplier();
  return {
    storeName: desktopState.storeName,
    slogan: desktopState.slogan,
    city: formatLocation(),
    operationType: desktopState.operationType,
    capital: desktopState.capital,
    categories: desktopState.categories,
    supplier,
    selectedItemsTotal: desktopState.selectedProducts.reduce((sum, product) => sum + Number(product.quantity || 0), 0),
    estimatedInvestment: desktopState.total,
    selectedProducts: desktopState.selectedProducts,
    instagramPreview: {
      handle: `@${slugify(desktopState.storeName)}.oficial`,
      bio: desktopState.instagramBio,
    },
  };
}

function loadDesktopState() {
  try {
    const saved = JSON.parse(localStorage.getItem(DESKTOP_STATE_KEY)) || {};
    if (!desktopShouldUseMock()) {
      saved.suppliers = [];
      saved.products = [];
      saved.selectedSupplierId = "";
      saved.selectedProducts = [];
      saved.total = 0;
    }
    return saved;
  } catch (error) {
    return {};
  }
}

function saveDesktopState() {
  localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(desktopState));
}

function resetDesktopProgress() {
  if (!window.confirm("Limpar o progresso salvo neste navegador?")) return;
  localStorage.removeItem(DESKTOP_STATE_KEY);
  window.location.reload();
}

function formatLocation() {
  return [desktopState.city, desktopState.state].filter(Boolean).join(" - ");
}

function buildDesktopIdentityMessage() {
  const storeName = safeDesktopText(desktopState.storeName) || "uma loja de celulares";
  const city = safeDesktopText(desktopState.city) || "sua cidade";
  const state = safeDesktopText(desktopState.state);
  const businessType = safeDesktopText(desktopState.businessType) || "assistência e venda de celulares";
  const focus = safeDesktopText(desktopState.focus) || "venda, atendimento e presença digital";
  return [
    `Crie uma identidade inicial para ${storeName}.`,
    `Segmento: ${businessType}.`,
    `Localização: ${city}${state ? `/${state}` : ""}.`,
    `Objetivo: ${focus}.`,
    "Gere nome, slogan, tom de comunicação, descrição curta para WhatsApp e sugestões visuais simples.",
    "Responda de forma estruturada com campos como Nome, Slogan, Tom, WhatsApp e Visual.",
  ].join(" ");
}

function safeDesktopText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeDesktopEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizeDesktopPhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function getMainAutoZapUrl() {
  return desktopConfig.mainAutoZapUrl || "https://autozap.log.br";
}

function initialsFrom(value) {
  return String(value || "TechCell").split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "TC";
}

function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function options(items, selected) {
  return items.map((item) => `<option ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}

initDesktopStart();
