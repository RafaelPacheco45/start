const steps = Array.from(document.querySelectorAll(".step"));
const nextButton = document.querySelector("#nextBtn");
const backButton = document.querySelector("#backBtn");
const progressSegments = document.querySelector("#progressSegments");
const stepLabel = document.querySelector("#stepLabel");
const progressPercent = document.querySelector("#progressPercent");
const modalRoot = document.querySelector("#modalRoot");
const config = window.AUTOZAP_START_CONFIG || window.AutoZapConfig || {};
const EVENTS_KEY = "autozap_start_events";
const FLOW_STARTED_AT = Date.now();

const defaultStore = {
  currentStep: 0,
  storeName: "",
  slogan: "Celulares, acessórios e assistência sem complicação.",
  city: "",
  capital: "Até R$ 1.000",
  operationType: "Loja física",
  focus: "Acessórios",
  focusAreas: ["Acessórios"],
  categories: ["Celulares", "Acessórios"],
  logo: "TC",
  logoImageDataUrl: "",
  logoImageUrl: "",
  imageDataUrl: "",
  imageGenerationNotice: "",
  colors: ["#087cff", "#07133f", "#0faa62", "#f5f9ff"],
  instagramBio: "TechCell | acessórios, celulares e assistência. Atendimento rápido pelo WhatsApp.",
  whatsappDescription: "Venda de celulares, acessórios e serviços com atendimento simples e garantia clara.",
  googleBusinessDescription: "",
  posts: [],
  scripts: {},
  warrantyPolicy: "7 dias",
  margin: 35,
  stockPlan: null,
  recommendedSupplier: null,
  selectedSupplierId: "",
  availableSuppliers: [],
  availableProducts: [],
  initialStockPlan: null,
  itemCost: 50,
  selectedProducts: [],
  quoteRequested: false,
  continueToAutoZapClicked: false,
  leadEmail: "",
  leadWhatsapp: "",
  generatedIdentity: false,
};

let store = loadLocalProgress();
let supplierLoadAttempted = false;

const localSuppliers = [
  {
    id: "sp-centro",
    name: "Distribuidora Paulista Cell",
    cityKeywords: ["sao paulo", "são paulo", "sp", "campinas", "osasco", "guarulhos", "santos"],
    distance: "12 km",
  },
  {
    id: "rj-centro",
    name: "Rio Mobile Atacado",
    cityKeywords: ["rio", "rio de janeiro", "rj", "niteroi", "niterói"],
    distance: "18 km",
  },
  {
    id: "sul-prime",
    name: "SulTech Distribuidora",
    cityKeywords: ["curitiba", "porto alegre", "florianopolis", "florianópolis", "pr", "rs", "sc"],
    distance: "24 km",
  },
  {
    id: "brasil-hub",
    name: "Brasil Cell Hub",
    cityKeywords: [],
    distance: "envio nacional",
  },
];

const supplierProducts = {
  Celulares: [
    { id: "cel-01", name: "Smartphone Android 128GB", price: 899, photo: "CEL" },
    { id: "cel-02", name: "Smartphone Android 256GB", price: 1299, photo: "5G" },
    { id: "cel-03", name: "iPhone seminovo vitrine", price: 1890, photo: "IOS" },
  ],
  Acessórios: [
    { id: "ace-01", name: "Kit limpeza premium", price: 18, photo: "KIT" },
    { id: "ace-02", name: "Suporte veicular", price: 35, photo: "SUP" },
  ],
  Películas: [
    { id: "pel-01", name: "Película 3D transparente", price: 12, photo: "3D" },
    { id: "pel-02", name: "Película privacidade", price: 18, photo: "PRI" },
    { id: "pel-03", name: "Película câmera traseira", price: 9, photo: "CAM" },
  ],
  Capinhas: [
    { id: "cap-01", name: "Capinha silicone premium", price: 22, photo: "CAP" },
    { id: "cap-02", name: "Capinha anti-impacto", price: 32, photo: "AIR" },
    { id: "cap-03", name: "Capinha transparente", price: 16, photo: "CLR" },
  ],
  Carregadores: [
    { id: "car-01", name: "Carregador turbo USB-C", price: 39, photo: "20W" },
    { id: "car-02", name: "Cabo USB-C reforçado", price: 19, photo: "USB" },
    { id: "car-03", name: "Fonte dupla entrada", price: 34, photo: "2X" },
  ],
  Fones: [
    { id: "fon-01", name: "Fone Bluetooth básico", price: 59, photo: "BT" },
    { id: "fon-02", name: "Fone com fio P2", price: 24, photo: "P2" },
  ],
  Peças: [
    { id: "pec-01", name: "Conector de carga", price: 28, photo: "USB" },
    { id: "pec-02", name: "Bateria reposição", price: 76, photo: "BAT" },
  ],
  Serviços: [
    { id: "ser-01", name: "Aplicação de película", price: 15, photo: "APP" },
    { id: "ser-02", name: "Diagnóstico técnico", price: 30, photo: "TEC" },
  ],
};

const stepCtas = [
  "Começar minha loja",
  "Criar minha identidade",
  "Montar diagnóstico",
  "Conferir formalização",
  "Ver minha loja pronta",
  "Salvar minha loja",
  "Salvar minha loja grátis",
];

function trackEvent(eventName, payload = {}) {
  const event = {
    eventName,
    payload,
    step: getCurrentStep(),
    createdAt: new Date().toISOString(),
    source: "mobile",
    environment: canUseDevelopmentMockFallback() ? "mock" : "real-api",
  };
  try {
    const events = JSON.parse(localStorage.getItem(EVENTS_KEY)) || [];
    events.push(event);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-200)));
  } catch (error) {
    localStorage.setItem(EVENTS_KEY, JSON.stringify([event]));
  }
  console.log("[AutoZap Start analytics]", eventName, event);
}

function messageForApiFailure(error, fallback = "Não foi possível concluir agora.") {
  const status = Number(error && error.status);
  const context = error && error.context;
  if (!status && (error && (error.fetchFailed || error.status === 0))) return "Não foi possível acessar a API. Verifique conexão/CORS.";
  if (context === "lead_save_failed") return "Não foi possível salvar sua solicitação agora.";
  if (context === "suppliers_load_failed") return status || error.fetchFailed ? "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois." : "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois.";
  if (context === "supplier_products_load_failed") return status || error.fetchFailed ? "Não foi possível carregar produtos reais agora." : "Este fornecedor ainda não possui produtos disponíveis.";
  if (status === 400 || status === 422) return "Dados incompletos ou inválidos.";
  if (status === 404) return "Recurso não encontrado na API.";
  if (status >= 500) return "Erro interno no servidor.";
  return (error && (error.message || error.error)) || fallback;
}

function apiFailureFromResponse(response, fallbackMessage, fallbackContext) {
  const error = new Error(messageForApiFailure(response, fallbackMessage));
  error.status = response && response.status !== undefined ? response.status : 0;
  error.endpoint = response && response.endpoint;
  error.body = response && (response.body || response.raw);
  error.context = (response && response.context) || fallbackContext || "";
  error.caller = response && response.caller;
  error.fetchFailed = !error.status;
  return error;
}

function throwIfApiFailed(response, fallbackMessage, fallbackContext) {
  if (!response || response.ok === false || !response.data) {
    throw apiFailureFromResponse(response || {}, fallbackMessage, fallbackContext);
  }
}

function extractAiText(response) {
  if (!response) return "";
  if (typeof response === "string") return response;
  if (typeof response.text === "string") return response.text;
  if (typeof response.message === "string") return response.message;
  if (typeof response.content === "string") return response.content;
  if (typeof response.result === "string") return response.result;
  if (typeof response.output === "string") return response.output;
  if (typeof response.answer === "string") return response.answer;
  if (typeof response.data === "string") return response.data;
  if (typeof response.data?.text === "string") return response.data.text;
  if (typeof response.data?.message === "string") return response.data.message;
  if (typeof response.data?.content === "string") return response.data.content;
  if (typeof response.diagnostic === "string") return response.diagnostic;
  if (typeof response.diagnostic?.text === "string") return response.diagnostic.text;
  return "";
}

function buildIdentityMessage(source = {}) {
  const storeName = safeText(source.storeName) || safeText(source.name) || "uma loja de celulares";
  const city = safeText(source.city) || "sua cidade";
  const state = safeText(source.state);
  const businessType = safeText(source.businessType) || safeText(source.segment) || safeText(source.operationType) || "assistência e venda de celulares";
  const focus = safeText(source.focus) || "venda, atendimento e presença digital";
  return [
    `Crie uma identidade inicial para ${storeName}.`,
    `Segmento: ${businessType}.`,
    `Localização: ${city}${state ? `/${state}` : ""}.`,
    `Objetivo: ${focus}.`,
    "Gere nome, slogan, tom de comunicação, descrição curta para WhatsApp e sugestões visuais simples.",
    "Responda de forma estruturada com campos como Nome, Slogan, Tom, WhatsApp e Visual.",
  ].join(" ");
}

function createLocalIdentityFallback(source = {}) {
  const storeName = safeText(source.storeName) || "TechCell";
  const city = safeText(source.city) || "sua cidade";
  const businessType = safeText(source.businessType) || "celulares e acessórios";
  return {
    storeName,
    slogan: `${businessType} com atendimento claro em ${city}.`,
    colors: defaultStore.colors,
    tone: "direto, próximo e confiável",
    whatsappDescription: `${storeName}: ${businessType}, orçamento claro e atendimento pelo WhatsApp.`,
    fallback: true,
    generatedIdentity: true,
  };
}

function normalizeIdentityForMobile(data, fallback = {}) {
  const text = extractAiText(data);
  if (localStorage.getItem("DEBUG_API") === "1") {
    console.log("[AutoZap Start AI mobile]", {
      responseKeys: data && typeof data === "object" ? Object.keys(data).slice(0, 30) : [],
      hasText: Boolean(text),
      textLength: text.length,
    });
  }
  const source = data && typeof data === "object" && !Array.isArray(data) ? data : {};
  const fallbackName = safeString(source.storeName || source.name || fallback.storeName || "TechCell", "TechCell");
  const fallbackFocus = safeString(fallback.businessType || store.focus || "celulares e acessórios", "celulares e acessórios");
  const fallbackCity = safeString(fallback.city || store.city || "sua cidade", "sua cidade");
  return {
    ...source,
    storeName: safeString(source.storeName || source.name || fallbackName, fallbackName),
    slogan: safeString(source.slogan || source.tagline || `${fallbackFocus} com atendimento claro em ${fallbackCity}.`, `${fallbackFocus} com atendimento claro.`),
    colors: Array.isArray(source.colors) && source.colors.length ? source.colors : defaultStore.colors,
    tone: safeString(source.tone || source.voice || "direto, próximo e confiável", "direto, próximo e confiável"),
    fallback: Boolean(source.fallback) || !safeString(source.storeName || source.name || source.slogan, ""),
  };
}

function getProgressMessage(step) {
  if (step <= 1) return "Sua loja está começando";
  if (step === 2) return "Diagnóstico em construção";
  if (step === 3) return "Base de segurança criada";
  if (step === 4) return "Estoque inicial sugerido";
  if (step === 5) return "Sua loja está quase pronta";
  return "Sua loja está pronta para salvar";
}

function loadLocalProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("autozap_start_store")) || {};
    if (saved.currentStep === undefined && saved.progress !== undefined) saved.currentStep = saved.progress;
    const merged = { ...defaultStore, ...saved };
    if (!canUseDevelopmentMockFallback()) {
      merged.availableSuppliers = [];
      merged.availableProducts = [];
      merged.recommendedSupplier = null;
      merged.selectedSupplierId = "";
      merged.selectedProducts = [];
    }
    if (!Array.isArray(merged.focusAreas) || !merged.focusAreas.length) merged.focusAreas = [merged.focus || "Acessórios"];
    merged.focus = merged.focusAreas.join(", ");
    return merged;
  } catch (error) {
    return { ...defaultStore };
  }
}

function saveLocalProgress() {
  store.currentStep = getCurrentStep();
  localStorage.setItem("autozap_start_store", JSON.stringify(store));
}

function getCurrentStep() {
  return Math.max(0, steps.findIndex((step) => step.classList.contains("active")));
}

function setStep(index) {
  const current = getCurrentStep();
  const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, stepIndex) => {
    step.classList.remove("active", "leaving", "from-right", "from-left");
    if (stepIndex === current && stepIndex !== safeIndex) step.classList.add("leaving");
    if (stepIndex === safeIndex) {
      step.classList.add("active", safeIndex > current ? "from-right" : "from-left");
    }
  });
  const phone = document.querySelector(".phone");
  phone.classList.toggle("splash", safeIndex === 0);
  phone.classList.toggle("final-preview", safeIndex === 5);
  nextButton.textContent = stepCtas[safeIndex] || "Próximo passo";
  nextButton.style.display = safeIndex === steps.length - 1 ? "none" : "";
  backButton.style.visibility = safeIndex === 0 ? "hidden" : "visible";
  updateProgress();
  saveLocalProgress();
  trackEvent("step_viewed", { step: safeIndex, progress: Math.round((safeIndex / (steps.length - 1)) * 100) });
  if (safeIndex === 4) trackEvent("stock_plan_viewed", { stockPlan: store.initialStockPlan });
  if (safeIndex === 5) {
    trackEvent("final_preview_viewed", { storeName: store.storeName, supplier: store.recommendedSupplier });
    trackEvent("preview_viewed", { storeName: store.storeName, categories: store.categories });
    trackEvent("instagram_preview_viewed", { storeName: store.storeName, handle: `@${slugify(store.storeName)}.oficial` });
  }
  window.setTimeout(() => steps.forEach((step) => step.classList.remove("leaving")), 260);
}

async function nextStep() {
  const current = getCurrentStep();
  if (current === 0) trackEvent("start_clicked", { source: "mobile" });
  if (current === 1 && !store.generatedIdentity) {
    const generated = await generateMockIdentity();
    if (!generated) return;
  }
  if (current === 3) {
    await loadStartSuppliers({ force: true });
    trackEvent("supplier_selected", { supplier: store.recommendedSupplier });
    generateInitialStockRecommendation();
  }
  if (current === 4) {
    const stockGenerated = await withLoading("Montando o estoque inicial...", generateStockSimulation);
    if (!stockGenerated) return;
  }
  if (current === 2) trackEvent("diagnosis_completed", { city: store.city, capital: store.capital, focus: store.focus });
  if (current === 5) generateStorePreview();
  if (current < steps.length - 1) {
    setStep(current + 1);
    return;
  }
  await saveStoreAndExport();
}

function prevStep() {
  setStep(getCurrentStep() - 1);
}

function updateProgress() {
  const current = getCurrentStep();
  const percent = Math.round((current / (steps.length - 1)) * 100);
  const visualPercent = current === 5 ? 100 : percent;
  progressSegments.innerHTML = "";
  steps.forEach((_, index) => {
    const item = document.createElement("i");
    item.classList.toggle("filled", current === 5 || index <= current);
    progressSegments.appendChild(item);
  });
  stepLabel.textContent = current === 0 ? "" : current === 5 ? "Prévia final" : `Passo ${current + 1} de ${steps.length}`;
  progressPercent.textContent = current === 0 ? "Monte sua loja de celulares com IA" : `${getProgressMessage(current)} · ${visualPercent}%`;
}

async function generateMockIdentity() {
  syncFormState();
  const result = await withLoading("Criando identidade da loja...", async () => {
    let imageNotice = "";
    const idea = safeText(document.querySelector("#storeIdea").value);
    const storeName = idea || safeText(store.storeName) || "uma loja de celulares";
    const city = safeText(store.city) || "sua cidade";
    const state = safeText(store.state);
    const businessType = safeText(store.businessType) || safeText(store.operationType) || safeText(store.focus) || "assistência e venda de celulares";
    const message = buildIdentityMessage({ ...store, storeName, name: storeName, city, state, businessType, focus: store.focus });
    let identityResponse = null;
    if (!message || message.length < 20) {
      identityResponse = { ok: true, data: createLocalIdentityFallback({ storeName, city, businessType }), localFallback: true };
    } else {
      identityResponse = await AutoZapAPI.generateIdentity({
      message,
      prompt: message,
      description: message,
      storeName,
      idea,
      focus: store.focus,
      city: store.city,
      state,
      businessType,
      source: "autozap-start",
      });
    }
    throwIfApiFailed(identityResponse, "Não foi possível gerar identidade agora.", "diagnostic_failed");
    const identity = normalizeIdentityForMobile(identityResponse.data, { storeName, city, businessType });
    if (identity.fallback) {
      imageNotice = "A IA respondeu em um formato inesperado. Usamos uma identidade inicial provisória.";
      trackEvent("identity_text_fallback", {
        responseKeys: identityResponse.data && typeof identityResponse.data === "object" ? Object.keys(identityResponse.data).slice(0, 20) : [],
      });
    }
    store.storeName = identity.storeName;
    store.slogan = identity.slogan;
    store.colors = identity.colors;
    store.generatedIdentity = true;

    store.logo = initialsFrom(store.storeName);
    store.logoImageDataUrl = "";
    store.logoImageUrl = "";
    store.imageDataUrl = "";
    store.imageGenerationNotice = "";
    if (AutoZapAPI.generateStartImage) {
      const imageResponse = await AutoZapAPI.generateStartImage({
        storeName: store.storeName,
        description: store.slogan,
        businessType: store.focus,
        style: identity.tone || "moderno, tecnológico, premium",
        colors: store.colors,
      });
      if (imageResponse && imageResponse.ok && imageResponse.data && imageResponse.data.imageDataUrl) {
        store.logoImageDataUrl = imageResponse.data.imageDataUrl;
        store.logoImageUrl = imageResponse.data.imageDataUrl;
        store.imageDataUrl = imageResponse.data.imageDataUrl;
        store.imageModel = imageResponse.data.model || "";
      } else {
        imageNotice = imageResponse && imageResponse.status === 429
          ? (imageResponse.message || "Limite de geração de imagem atingido. Tente novamente em alguns minutos.")
          : (imageResponse && imageResponse.message) || "Imagem automática indisponível agora. Usamos uma prévia provisória.";
        store.imageGenerationNotice = imageNotice;
        trackEvent("identity_image_fallback", {
          status: imageResponse && imageResponse.status,
          context: imageResponse && imageResponse.context,
          message: imageNotice,
        });
      }
    }

    const bioResponse = await AutoZapAPI.generateBio({ storeName: store.storeName, focus: store.focus, city: store.city });
    if (bioResponse && bioResponse.ok && bioResponse.data && typeof bioResponse.data === "object" && !Array.isArray(bioResponse.data)) {
      Object.assign(store, bioResponse.data);
    } else if (bioResponse && bioResponse.ok === false) {
      throwIfApiFailed(bioResponse, "Não foi possível gerar textos agora.", "diagnostic_failed");
    }
    await generateMockPosts();
    await generateSalesScripts();
    renderStoreData();
    saveLocalProgress();
    trackEvent("identity_generated", { storeName: store.storeName, logo: store.logo, imageGenerated: Boolean(store.logoImageDataUrl || store.imageDataUrl) });
    return { imageNotice };
  });
  renderIdentityNotice(result && result.imageNotice ? result.imageNotice : "");
  return Boolean(result);
}

async function generateMockPosts() {
  const response = await AutoZapAPI.generatePosts({ storeName: store.storeName, focus: store.focus, city: store.city });
  throwIfApiFailed(response, "Não foi possível gerar posts agora.", "diagnostic_failed");
  store.posts = response.data;
  renderPosts();
  saveLocalProgress();
}

async function generateSalesScripts() {
  const response = await AutoZapAPI.generateSalesScripts({ storeName: store.storeName });
  throwIfApiFailed(response, "Não foi possível gerar scripts agora.", "diagnostic_failed");
  store.scripts = response.data;
  saveLocalProgress();
}

async function generateStockSimulation() {
  syncFormState();
  const response = await AutoZapAPI.generateStockPlan({ categories: store.categories, capital: store.capital });
  throwIfApiFailed(response, "Não foi possível gerar estoque agora.", "diagnostic_failed");
  store.stockPlan = response.data;
  renderStockPlan();
  saveLocalProgress();
  return store.stockPlan;
}

function generateStorePreview() {
  syncFormState();
  generateRecommendedSupplier();
  generateInitialStockRecommendation();
  renderStoreData();
  renderCatalogPreview();
  renderPosts();
  renderFinalSummary();
  saveLocalProgress();
}

function canUseDevelopmentMockFallback() {
  const useMock = String(localStorage.getItem("USE_MOCK") || "").toLowerCase();
  return config.mockMode === true || useMock === "1" || useMock === "true";
}

async function loadStartSuppliers({ force = false } = {}) {
  if (supplierLoadAttempted && !force) return store.availableSuppliers || [];
  supplierLoadAttempted = true;
  store.supplierLoadError = "";
  if (!canUseDevelopmentMockFallback() && AutoZapAPI.apiGetStartSuppliers) {
    const response = await AutoZapAPI.apiGetStartSuppliers();
    if (response.ok && response.suppliers && response.suppliers.length) {
      store.availableSuppliers = response.suppliers;
      store.recommendedSupplier = pickSupplierForCity(response.suppliers);
      store.selectedSupplierId = store.recommendedSupplier.id;
      await loadStartSupplierProducts(store.selectedSupplierId, { force: true });
      renderRecommendedSupplier();
      renderStockPlan();
      saveLocalProgress();
      return response.suppliers;
    }
    store.supplierLoadError = response.ok ? "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois." : messageForApiFailure(response, "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois.");
    store.availableSuppliers = [];
    store.recommendedSupplier = null;
    store.selectedSupplierId = "";
    store.availableProducts = [];
    store.selectedProducts = [];
    renderRecommendedSupplier();
    renderStockPlan();
    saveLocalProgress();
    return [];
  }
  store.availableSuppliers = localSuppliers.map((supplier) => supplierToUi(supplier));
  store.recommendedSupplier = findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital });
  store.selectedSupplierId = store.recommendedSupplier.id;
  store.availableProducts = getMockProductsForSelectedCategories(store.selectedSupplierId);
  return store.availableSuppliers;
}

async function loadStartSupplierProducts(supplierId, { force = false } = {}) {
  if (!supplierId) {
    store.availableProducts = [];
    return [];
  }
  if (!force && store.availableProducts && store.availableProducts.some((product) => product.supplierId === supplierId)) return store.availableProducts;
  store.productsLoadError = "";
  if (!canUseDevelopmentMockFallback() && AutoZapAPI.apiGetStartSupplierProducts) {
    const response = await AutoZapAPI.apiGetStartSupplierProducts(supplierId);
    if (response.ok && response.products) {
      store.availableProducts = response.products;
      store.selectedProducts = normalizeSelectedProducts(store.selectedProducts).filter((selected) => response.products.some((product) => product.id === selected.productId));
      saveLocalProgress();
      return response.products;
    }
    store.productsLoadError = response.ok ? "Este fornecedor ainda não possui produtos disponíveis." : messageForApiFailure(response, "Este fornecedor ainda não possui produtos disponíveis.");
    store.availableProducts = [];
    store.selectedProducts = [];
    saveLocalProgress();
    return [];
  }
  store.availableProducts = getMockProductsForSelectedCategories(supplierId);
  return store.availableProducts;
}

function pickSupplierForCity(suppliers) {
  const city = normalizeText(store.city || "");
  const state = normalizeText((store.city || "").split("-").pop() || "");
  return suppliers.find((supplier) => city && normalizeText(`${supplier.city} ${supplier.state}`).includes(city))
    || suppliers.find((supplier) => state && normalizeText(supplier.state).includes(state))
    || suppliers[0];
}

function supplierToUi(supplier) {
  const name = supplier.name || supplier.supplierName || "Fornecedor";
  const cityState = [supplier.city, supplier.state].filter(Boolean).join(" - ");
  return {
    ...supplier,
    supplierName: supplier.supplierName || name,
    city: cityState || supplier.city || "Envio nacional",
    distance: supplier.distance || "API real",
    categories: supplier.categories && supplier.categories.length ? supplier.categories : store.categories.slice(0, 6),
    deliveryTime: supplier.deliveryTime || "a combinar",
    reliabilityScore: supplier.reliabilityScore || (supplier.verified ? 95 : 88),
    recommendedReason: supplier.recommendedReason || "Fornecedor real carregado do Core Server.",
  };
}

function findRecommendedSupplier(userData = {}) {
  if (store.availableSuppliers && store.availableSuppliers.length) return supplierToUi(pickSupplierForCity(store.availableSuppliers));
  if (!canUseDevelopmentMockFallback()) {
    return {
      id: "",
      supplierName: store.supplierLoadError || "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois.",
      city: "",
      distance: "",
      categories: [],
      deliveryTime: "",
      reliabilityScore: 0,
      recommendedReason: store.supplierLoadError || "Não foi possível carregar fornecedores agora. Você ainda pode continuar e ajustar depois.",
    };
  }
  const city = normalizeText(userData.city || "");
  const capital = userData.capital || "R$ 1.000 a R$ 3.000";
  const categories = userData.categories && userData.categories.length ? userData.categories : ["Capinhas", "Películas", "Carregadores", "Fones"];
  const base = localSuppliers.find((supplier) => supplier.cityKeywords.some((keyword) => city.includes(normalizeText(keyword)))) || localSuppliers[localSuppliers.length - 1];
  const premium = capital.includes("8.000") || capital.includes("Acima");
  return {
    id: base.id,
    supplierName: base.name === "Distribuidora Paulista Cell" ? "Distribuidora Tech Prime" : base.name,
    city: base.id === "sp-centro" ? "Campinas - SP" : base.id === "rj-centro" ? "Rio de Janeiro - RJ" : base.id === "sul-prime" ? "Curitiba - PR" : "Envio nacional",
    distance: base.id === "sp-centro" ? "8,4 km" : base.distance,
    categories: categories.slice(0, 6),
    deliveryTime: premium ? "1 dia útil" : "1 a 2 dias úteis",
    reliabilityScore: premium ? 94 : 91,
    recommendedReason: "Escolhemos este fornecedor porque ele atende sua região e possui produtos de entrada com bom giro.",
  };
}

function generateRecommendedSupplier() {
  syncFormState();
  store.recommendedSupplier = findRecommendedSupplier({
    city: store.city,
    focus: store.focus,
    categories: store.categories,
    capital: store.capital,
    operationType: store.operationType,
  });
  store.selectedSupplierId = store.recommendedSupplier.id;
  renderRecommendedSupplier();
  saveLocalProgress();
  return store.recommendedSupplier;
}

function generateInitialStockPlan(userData = {}, supplierData = {}) {
  const capital = userData.capital || "R$ 1.000 a R$ 3.000";
  const capitalValue = capitalToNumber(capital);
  const recommendedInvestment = Math.round(capitalValue * 0.8);
  const categories = userData.categories && userData.categories.length ? userData.categories : supplierData.categories || ["Capinhas", "Películas"];
  const items = categories.map((category) => {
    const quantityMap = { Películas: 30, Capinhas: 25, Carregadores: 10, Fones: 8, Celulares: 3, Acessórios: 12, Peças: 8, Serviços: 1 };
    return { category, quantity: quantityMap[category] || 10 };
  });
  if (!items.some((item) => item.category === "Serviços")) items.push({ category: "Kit básico de atendimento", quantity: 1 });
  return {
    capital,
    recommendedInvestment,
    items,
    estimatedMargin: categories.includes("Películas") ? "35% a 55%" : "25% a 45%",
    averageTicket: formatCurrency(Math.max(35, Math.round(recommendedInvestment / Math.max(18, items.reduce((sum, item) => sum + item.quantity, 0))))),
    riskLevel: recommendedInvestment > 6000 ? "Risco moderado" : "Baixo risco",
    strategy: "Começar com itens de giro rápido e ajustar depois conforme a procura dos clientes.",
  };
}

function generateInitialStockRecommendation() {
  if (!store.recommendedSupplier) generateRecommendedSupplier();
  store.initialStockPlan = generateInitialStockPlan({
    capital: store.capital,
    categories: store.categories,
  }, store.recommendedSupplier);
  trackEvent("stock_plan_generated", { stockPlan: store.initialStockPlan });
  renderInitialStockPlan();
  saveLocalProgress();
  return store.initialStockPlan;
}

async function generateChannelTexts() {
  syncFormState();
  const response = await AutoZapAPI.generateBio({ storeName: store.storeName, focus: store.focus, city: store.city });
  throwIfApiFailed(response, "Não foi possível gerar textos agora.", "diagnostic_failed");
  Object.assign(store, response.data);
  await generateMockPosts();
  renderStoreData();
  saveLocalProgress();
}

async function saveStoreAndExport() {
  syncFormState();
  trackEvent("save_store_clicked", { storeName: store.storeName, hasWhatsapp: Boolean(store.leadWhatsapp), hasEmail: Boolean(store.leadEmail) });
  if (!store.leadEmail && !store.leadWhatsapp) {
    showModal({
      type: "info",
      title: "Informe um contato",
      text: "Use WhatsApp ou e-mail para proteger tudo que você criou.",
      actions: [{ label: "Entendi", close: true }],
    });
    return;
  }
  const result = await withLoading("Salvando sua loja...", async () => {
    const leadResponse = await AutoZapAPI.saveLead(buildLeadPayload());
    if (leadResponse && leadResponse.ok === false) {
      const leadError = messageForApiFailure(leadResponse, "Não foi possível salvar sua loja agora. Confira sua conexão e tente novamente.");
      document.querySelector("#saveMessage").textContent = leadError;
      document.querySelector("#saveMessage").hidden = false;
      return { leadSaved: false, error: leadError, response: leadResponse };
    }
    document.querySelector("#saveMessage").textContent = "Loja salva com sucesso. Próximo passo: continuar para o AutoZap.";
    document.querySelector("#saveMessage").hidden = false;
    trackEvent("lead_saved", { storeName: store.storeName, contactType: store.leadWhatsapp ? "whatsapp" : "email" });
    const exportResponse = await exportToAutoZap();
    return { leadSaved: true, exportResponse };
  });
  if (!result) return;
  if (result && result.leadSaved === false) {
    showModal({
      type: "error",
      title: "Não foi possível salvar sua loja",
      text: result.error || "Tente novamente em instantes.",
      actions: [{ label: "Fechar", close: true }],
    });
    return;
  }
  showModal({
    type: "success",
    title: "Sua loja foi salva com sucesso.",
    text: "Próximo passo: continuar para o AutoZap.",
    json: result && result.exportResponse && result.exportResponse.data ? (result.exportResponse.data.payload || result.exportResponse.data) : null,
    actions: [
      { label: "Conhecer o AutoZap", href: getMainAutoZapUrl(), track: "export_autozap_clicked" },
      { label: "Ver resumo", close: true },
    ],
  });
}

function exportToAutoZap() {
  const products = store.categories.filter((category) => category !== "Serviços");
  const services = store.categories.includes("Serviços") ? ["Assistência técnica", "Aplicação de película"] : ["Aplicação de película"];
  const finalSummary = buildFinalSummary();
  return AutoZapAPI.exportToAutoZap({
    storeName: store.storeName,
    slogan: store.slogan,
    logo: store.logo,
    colors: store.colors,
    city: store.city,
    capital: store.capital,
    storeType: store.operationType,
    products,
    services,
    categories: store.categories,
    warrantyPolicy: store.warrantyPolicy,
    instagramBio: store.instagramBio,
    whatsappDescription: store.whatsappDescription,
    googleBusinessDescription: store.googleBusinessDescription,
    marketingPosts: store.posts,
    salesScripts: store.scripts,
    stockPlan: store.stockPlan,
    recommendedSupplier: store.recommendedSupplier,
    initialStockPlan: store.initialStockPlan,
    selectedProducts: normalizeSelectedProducts(store.selectedProducts),
    finalSummary,
    progress: Math.round((getCurrentStep() / (steps.length - 1)) * 100),
    generatedIdentity: store.generatedIdentity,
    aiContext: {
      focus: store.focus,
      focusAreas: store.focusAreas,
      nearestSupplier: store.recommendedSupplier,
      selectedProducts: normalizeSelectedProducts(store.selectedProducts),
      stockPlan: store.stockPlan,
      margin: store.margin,
      scripts: store.scripts,
      source: canUseDevelopmentMockFallback() ? "AutoZap Start dev" : "AutoZap Start real-api",
      usage: AutoZapAPI.getUsage(),
    },
  });
}

function buildLeadPayload() {
  const selectedProducts = normalizeSelectedProducts(store.selectedProducts);
  const finalSummary = buildFinalSummary();
  const recommendedSupplier = store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital });
  return {
    name: store.storeName,
    phone: store.leadWhatsapp,
    email: store.leadEmail,
    contact: store.leadWhatsapp || store.leadEmail,
    contactType: store.leadWhatsapp ? "whatsapp" : "email",
    storeName: store.storeName,
    city: store.city,
    state: "",
    capital: store.capital,
    businessType: store.operationType,
    operationType: store.operationType,
    categories: store.categories,
    identity: {
      storeName: store.storeName,
      slogan: store.slogan,
      logo: store.logo,
      colors: store.colors,
      instagramBio: store.instagramBio,
      whatsappDescription: store.whatsappDescription,
      googleBusinessDescription: store.googleBusinessDescription,
      generatedIdentity: Boolean(store.generatedIdentity),
    },
    recommendedSupplier,
    selectedSupplierId: (recommendedSupplier && recommendedSupplier.id) || store.selectedSupplierId,
    selectedProducts,
    estimatedInitialStockValue: getSelectedProductsTotal() || finalSummary.estimatedInvestment,
    finalSummary,
    diagnostic: {
      capital: store.capital,
      focus: store.focus,
      categories: store.categories,
      margin: store.margin,
      operationType: store.operationType,
    },
    progress: Math.round((getCurrentStep() / (steps.length - 1)) * 100),
    generatedIdentity: store.generatedIdentity,
    source: "autozap-start",
  };
}

function getMainAutoZapUrl() {
  return config.mainAutoZapUrl || "https://autozap.log.br";
}

function getOnlineStoreHelpUrl() {
  const message = `Olá, quero ajuda para criar uma loja online/site para a ${visualStoreName()}.`;
  return config.onlineStoreHelpUrl || `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function getOnlineStoreQuoteUrl() {
  const message = "Olá, quero um orçamento para criar minha loja online com a AutoZap Start.";
  return config.onlineStoreQuoteUrl || config.onlineStoreHelpUrl || `https://wa.me/?text=${encodeURIComponent(message)}`;
}

function syncFormState() {
  store.city = document.querySelector("#cityInput").value.trim();
  store.capital = document.querySelector("#capitalInput").value;
  store.focusAreas = Array.from(document.querySelectorAll('[data-choice="focus"] button.selected')).map((button) => button.dataset.value);
  if (!store.focusAreas.length) store.focusAreas = ["Acessórios"];
  store.focus = store.focusAreas.join(", ");
  store.leadEmail = sanitizeEmail(document.querySelector("#leadEmail").value);
  store.leadWhatsapp = sanitizePhone(document.querySelector("#leadWhatsapp").value);
}

function renderStoreData() {
  const displayName = visualStoreName();
  const logo = store.logo || initialsFrom(displayName);
  renderLogoTarget("#logoLetters", logo);
  document.querySelector("#logoName").textContent = displayName;
  renderLogoTarget("#previewLogo", logo);
  document.querySelector("#previewName").textContent = displayName;
  document.querySelector("#previewCity").textContent = store.city || "São Paulo - SP";
  const finalSlogan = document.querySelector("#finalSlogan");
  if (finalSlogan) finalSlogan.textContent = store.slogan;
  renderLogoTarget("#igAvatar", logo);
  document.querySelector("#igName").textContent = displayName;
  document.querySelector("#igHandle").textContent = `@${slugify(displayName)}.oficial`;
  document.querySelector("#igBio").textContent = store.instagramBio;
  const quoteButton = document.querySelector("#onlineStoreQuoteBtn");
  if (quoteButton) quoteButton.href = getOnlineStoreQuoteUrl();
  const finalAutoZapButton = document.querySelector("#finalAutoZapBtn");
  if (finalAutoZapButton) finalAutoZapButton.href = getMainAutoZapUrl();
  renderRecommendedSupplier();
  renderInitialStockPlan();
  renderFinalSummary();
  renderIdentityNotice(store.imageGenerationNotice || "");
}

function renderLogoTarget(selector, fallbackText) {
  const target = document.querySelector(selector);
  if (!target) return;
  const imageDataUrl = store.logoImageDataUrl || store.imageDataUrl || store.logoImageUrl || "";
  target.classList.toggle("has-logo-image", Boolean(imageDataUrl));
  target.style.backgroundImage = imageDataUrl ? `url("${imageDataUrl}")` : "";
  target.textContent = imageDataUrl ? "" : fallbackText;
}

function renderIdentityNotice(message) {
  const target = document.querySelector("#identityLimitMessage");
  if (!target) return;
  target.hidden = !message;
  target.textContent = message || "";
}

function renderRecommendedSupplier() {
  renderSuppliers();
}

function renderInitialStockPlan() {
  const supplier = store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital });
  const plan = store.initialStockPlan || generateInitialStockPlan({ capital: store.capital, categories: store.categories }, supplier);
  const itemTotal = getInitialStockItemTotal(plan);
  const selected = normalizeSelectedProducts(store.selectedProducts);
  const selectedQuantity = selected.reduce((sum, product) => sum + product.quantity, 0);
  const selectedTotal = getSelectedProductsTotal();
  const context = document.querySelector("#stockSupplierContext");
  if (context) {
    context.textContent = supplier.id
      ? `Esse plano foi montado considerando ${supplier.supplierName}, ${supplier.city}, e o capital disponível.`
      : "Esse plano usa apenas suas categorias e capital. Nenhum fornecedor real foi carregado agora.";
  }
  const risk = document.querySelector("#riskValue");
  if (risk) risk.textContent = plan.riskLevel;

  setText("#finalSupplierName", supplier.supplierName);
  setText("#finalSupplierCity", supplier.city);
  setText("#finalSupplierDistance", supplier.distance);
  setText("#finalSupplierStatus", supplier.id ? "Fornecedor verificado" : "Fornecedor indisponível");
  setText("#finalSupplierDelivery", supplier.deliveryTime);
  setText("#finalSupplierCategories", supplier.categories.join(", "));
  setText("#finalSelectedItemsTotal", `${selectedQuantity || itemTotal} itens`);
  setText("#finalEstimatedInvestment", formatCurrency(selectedTotal || plan.recommendedInvestment));
  setText("#finalStockCategories", plan.items.map((item) => item.category).slice(0, 5).join(", "));
  setText("#finalEstimatedMargin", plan.estimatedMargin);
  setText("#finalAverageTicket", plan.averageTicket);

  const list = document.querySelector("#finalStockItemsList");
  if (list) {
    list.innerHTML = "";
    plan.items.slice(0, 6).forEach((item) => {
      const row = document.createElement("li");
      row.innerHTML = `<span>${item.quantity}</span><strong>${item.category}</strong>`;
      list.appendChild(row);
    });
  }
}

function renderFinalSummary() {
  const summary = {
    "#summaryName": visualStoreName(),
    "#summarySlogan": store.slogan || "Celulares, acessórios e assistência sem complicação.",
    "#summaryCity": store.city || "São Paulo",
    "#summaryOperation": store.operationType,
    "#summaryCategories": store.categories.join(", ") || "Celulares, Acessórios",
    "#summaryBio": store.instagramBio,
    "#summaryWhatsapp": store.whatsappDescription,
  };
  Object.entries(summary).forEach(([selector, value]) => {
    const target = document.querySelector(selector);
    if (target) target.textContent = value;
  });
  renderLogoTarget("#summaryLogo", store.logo || initialsFrom(visualStoreName()));
  renderOnlineStoreOffer();
  const completeSummary = buildFinalSummary();
  if (getCurrentStep() >= 5) console.log("AutoZap Start resumo final", completeSummary);
  if (getCurrentStep() >= 6) trackEvent("store_summary_viewed", { storeName: store.storeName, hasSupplier: Boolean(store.recommendedSupplier) });
}

function buildFinalSummary() {
  const supplier = store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital });
  const stockPlan = store.initialStockPlan || generateInitialStockPlan({ capital: store.capital, categories: store.categories }, supplier);
  const selected = normalizeSelectedProducts(store.selectedProducts);
  return {
    storeName: visualStoreName(),
    slogan: store.slogan,
    city: store.city || "São Paulo - SP",
    logo: store.logo || initialsFrom(visualStoreName()),
    supplier,
    selectedItemsTotal: selected.reduce((sum, product) => sum + product.quantity, 0) || getInitialStockItemTotal(stockPlan),
    estimatedInvestment: getSelectedProductsTotal() || stockPlan.recommendedInvestment,
    selectedProducts: selected,
    stockPlan,
    instagramPreview: {
      handle: `@${slugify(visualStoreName())}.oficial`,
      bio: store.instagramBio,
      posts: (store.posts.length ? store.posts : [
        { title: "Chegaram novos modelos", caption: "Vitrine de lançamento" },
        { title: "Películas e acessórios", caption: "Produtos de giro rápido" },
        { title: "Atendimento de confiança", caption: "Prova social local" },
      ]).slice(0, 3),
    },
    quoteRequested: Boolean(store.quoteRequested),
    continueToAutoZapClicked: Boolean(store.continueToAutoZapClicked),
  };
}

function renderOnlineStoreOffer() {
  const offer = document.querySelector("#onlineStoreOffer");
  const button = document.querySelector("#onlineStoreHelpBtn");
  if (!offer || !button) return;
  const shouldShow = store.operationType === "Online";
  offer.hidden = !shouldShow;
  button.href = getOnlineStoreHelpUrl();
}

function restoreSavedChoices() {
  document.querySelectorAll("[data-choice]").forEach((group) => {
    const key = group.dataset.choice;
    group.querySelectorAll("button").forEach((button) => {
      if (key === "focus") {
        button.classList.toggle("selected", (store.focusAreas || []).includes(button.dataset.value));
      } else {
        button.classList.toggle("selected", button.dataset.value === store[key]);
      }
    });
  });
  document.querySelectorAll("#categoryGrid button").forEach((button) => {
    button.classList.toggle("active", store.categories.includes(button.dataset.category));
  });
}

function renderStockPlan() {
  const plan = store.initialStockPlan || generateInitialStockPlan({ capital: store.capital, categories: store.categories }, store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital }));
  document.querySelector("#investmentValue").textContent = formatCurrency(plan.recommendedInvestment);
  document.querySelector("#itemsValue").textContent = String(plan.items.reduce((sum, item) => sum + item.quantity, 0));
  renderInitialStockPlan();
  renderSuppliers();
}

function renderSuppliers() {
  const target = document.querySelector("#supplierPreview");
  if (!target) return;
  const supplier = store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital });
  const label = document.querySelector("#nearestSupplierLabel");
  if (label) {
    label.textContent = supplier.id ? `${supplier.supplierName} · ${supplier.distance || "API real"} · produtos conforme suas categorias.` : "Nenhum fornecedor disponível no momento.";
  }
  target.innerHTML = "";
  const products = getProductsForSelectedCategories();
  if (!products.length) {
    const message = supplier.id
      ? (store.productsLoadError || "Este fornecedor ainda não possui produtos disponíveis.")
      : (store.supplierLoadError || "Nenhum fornecedor disponível no momento.");
    target.innerHTML = `<p class="empty-products">${message}</p>`;
    return;
  }
  const selected = normalizeSelectedProducts(store.selectedProducts);
  products.forEach((product) => {
    const selectedProduct = selected.find((item) => item.productId === product.id);
    const quantity = selectedProduct ? selectedProduct.quantity : 0;
    const item = document.createElement("article");
    item.className = "product-card";
    item.dataset.productId = product.id;
    item.classList.toggle("selected", Boolean(selectedProduct));
    item.innerHTML = `
      <span class="product-photo">${product.imageUrl ? "" : product.photo || initialsFrom(product.name)}</span>
      <span class="product-info"><strong>${product.name}</strong><small>${product.category}</small></span>
      <span class="product-buy">
        <b>${formatCurrency(product.price)}</b>
        ${selectedProduct ? `<span class="product-qty"><button type="button" data-action="decrement">-</button><em>${quantity}</em><button type="button" data-action="increment">+</button></span>` : `<button type="button" data-action="select">Selecionar</button>`}
      </span>
    `;
    const photo = item.querySelector(".product-photo");
    if (product.imageUrl) {
      photo.style.backgroundImage = `url("${product.imageUrl}")`;
      photo.style.backgroundSize = "cover";
      photo.style.backgroundPosition = "center";
    }
    target.appendChild(item);
  });
}

function getNearestSupplier() {
  if (!canUseDevelopmentMockFallback()) return null;
  const city = normalizeText(store.city || "");
  return localSuppliers.find((supplier) => supplier.cityKeywords.some((keyword) => city.includes(normalizeText(keyword)))) || localSuppliers[localSuppliers.length - 1];
}

function getProductsForSelectedCategories() {
  if (store.availableProducts && store.availableProducts.length) {
    const selectedCategories = store.categories.map(normalizeText);
    const filtered = store.availableProducts.filter((product) => !selectedCategories.length || selectedCategories.includes(normalizeText(product.category)));
    return filtered.length ? filtered : store.availableProducts;
  }
  if (!canUseDevelopmentMockFallback()) return [];
  return getMockProductsForSelectedCategories(store.selectedSupplierId);
}

function getMockProductsForSelectedCategories(supplierId = "") {
  return store.categories.flatMap((category) => (
    (supplierProducts[category] || []).map((product) => ({ ...product, supplierId, category, stock: product.stock || 0, quantity: product.quantity || 0, imageUrl: product.imageUrl || "" }))
  ));
}

function normalizeSelectedProducts(products) {
  return (Array.isArray(products) ? products : []).map((item) => {
    if (typeof item === "string") {
      const product = getProductsForSelectedCategories().find((available) => available.id === item) || { id: item, name: item, price: 0 };
      return buildSelectedProduct(product, 1);
    }
    const quantity = Math.max(1, Number(item.quantity) || 1);
    return {
      supplierId: item.supplierId || store.selectedSupplierId || "",
      productId: item.productId || item.id || "",
      name: item.name || "",
      price: Number(item.price) || 0,
      quantity,
      total: Number(item.total) || (Number(item.price) || 0) * quantity,
    };
  }).filter((item) => item.productId);
}

function buildSelectedProduct(product, quantity = 1) {
  const safeQuantity = Math.max(1, Number(quantity) || 1);
  return {
    supplierId: product.supplierId || store.selectedSupplierId || "",
    productId: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    quantity: safeQuantity,
    total: (Number(product.price) || 0) * safeQuantity,
  };
}

function updateSelectedProduct(productId, action) {
  const product = getProductsForSelectedCategories().find((item) => item.id === productId);
  if (!product) return;
  const selected = normalizeSelectedProducts(store.selectedProducts);
  const current = selected.find((item) => item.productId === productId);
  if (action === "decrement") {
    store.selectedProducts = current && current.quantity > 1
      ? selected.map((item) => item.productId === productId ? buildSelectedProduct(product, item.quantity - 1) : item)
      : selected.filter((item) => item.productId !== productId);
  } else if (current) {
    store.selectedProducts = selected.map((item) => item.productId === productId ? buildSelectedProduct(product, item.quantity + 1) : item);
  } else {
    store.selectedProducts = selected.concat(buildSelectedProduct(product, 1));
  }
}

function getSelectedProductsTotal() {
  return normalizeSelectedProducts(store.selectedProducts).reduce((sum, product) => sum + product.total, 0);
}

function renderCatalogPreview() {
  const target = document.querySelector("#catalogPreview");
  if (!target) return;
  target.innerHTML = "";
  const subtitles = {
    Celulares: "seleção inicial",
    Acessórios: "giro rápido",
    Películas: "alta procura",
    Capinhas: "proteção e estilo",
    Carregadores: "venda recorrente",
    Fones: "ticket adicional",
    Peças: "sob demanda",
    Serviços: "receita recorrente",
  };
  store.categories.slice(0, 4).forEach((category) => {
    const item = document.createElement("span");
    item.innerHTML = `<strong>${category}</strong><small>${subtitles[category] || "primeira vitrine"}</small>`;
    target.appendChild(item);
  });
}

function renderPosts() {
  const target = document.querySelector("#postsPreview");
  if (!target) return;
  target.innerHTML = "";
  const posts = store.posts.length ? store.posts : [
    { title: "Chegaram novos modelos", caption: "Vitrine de lançamento" },
    { title: "Películas e acessórios", caption: "Produtos de giro rápido" },
    { title: "Atendimento de confiança", caption: "Prova social local" },
    { title: "Oferta de inauguração", caption: "Primeira campanha" },
  ];
  posts.slice(0, 3).forEach((post) => {
    const item = document.createElement("article");
    item.innerHTML = `<strong>${post.title}</strong><small>${post.caption || ""}</small>`;
    target.appendChild(item);
  });
}

async function withLoading(message, task) {
  showModal({ type: "loading", title: message, text: "Estamos deixando a primeira versão da sua loja pronta." });
  try {
    const result = await task();
    hideModal();
    return result;
  } catch (error) {
    const text = messageForApiFailure(error, "Não foi possível concluir agora.");
    console.error("[AutoZap Start flow error]", {
      context: error && error.context,
      status: error && error.status,
      endpoint: error && error.endpoint,
      message: text,
      body: error && error.body,
    });
    showModal({
      type: "error",
      title: "Não foi possível concluir agora",
      text,
      actions: [{ label: "Fechar", close: true }],
    });
    return null;
  }
}

function showModal({ type = "info", title, text, json, actions = [] }) {
  modalRoot.hidden = false;
  modalRoot.dataset.type = type;
  document.querySelector("#modalTitle").textContent = title || "";
  document.querySelector("#modalText").textContent = text || "";
  document.querySelector("#modalIcon").innerHTML = type === "loading" ? "<i></i>" : type === "success" ? "✓" : type === "limit" ? "!" : "i";
  const jsonTarget = document.querySelector("#modalJson");
  if (json) {
    jsonTarget.hidden = false;
    jsonTarget.textContent = JSON.stringify(json, null, 2);
  } else {
    jsonTarget.hidden = true;
    jsonTarget.textContent = "";
  }
  const actionTarget = document.querySelector("#modalActions");
  actionTarget.innerHTML = "";
  actions.forEach((action) => {
    const button = action.href ? document.createElement("a") : document.createElement("button");
    if (!action.href) button.type = "button";
    if (action.href) {
      button.href = action.href;
      button.target = "_blank";
      button.rel = "noreferrer";
    }
    button.textContent = action.label;
    button.className = action.close ? "outline-btn" : "primary";
    if (action.track) button.addEventListener("click", () => trackEvent(action.track, { href: action.href || "" }));
    if (action.close) button.addEventListener("click", hideModal);
    actionTarget.appendChild(button);
  });
}

function hideModal() {
  modalRoot.hidden = true;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
}

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
}

function getInitialStockItemTotal(plan) {
  return (plan && Array.isArray(plan.items) ? plan.items : []).reduce((sum, item) => sum + item.quantity, 0);
}

function initialsFrom(value) {
  return String(value || "").split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "TC";
}

function visualStoreName() {
  return safeText(store.storeName) || "TechCell";
}

function slugify(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function capitalToNumber(value) {
  return {
    "Até R$ 1.000": 1000,
    "R$ 1.000 a R$ 3.000": 3000,
    "R$ 3.000 a R$ 8.000": 8000,
    "Acima de R$ 8.000": 10000,
  }[value] || 3000;
}

document.querySelector("#generateIdentityBtn").addEventListener("click", generateMockIdentity);
nextButton.addEventListener("click", nextStep);
backButton.addEventListener("click", prevStep);
document.querySelector("#formalizationDone").addEventListener("click", nextStep);
document.querySelector("#saveStoreBtn").addEventListener("click", saveStoreAndExport);
document.querySelector("#adjustPreviewBtn").addEventListener("click", () => setStep(1));
document.querySelector("#onlineStoreHelpBtn").addEventListener("click", () => {
  trackEvent("online_store_help_clicked", { storeName: store.storeName, operationType: store.operationType, href: getOnlineStoreHelpUrl() });
});
document.querySelector("#onlineStoreQuoteBtn").addEventListener("click", () => {
  store.quoteRequested = true;
  saveLocalProgress();
  trackEvent("online_store_quote_clicked", { storeName: store.storeName, href: getOnlineStoreQuoteUrl() });
});
document.querySelector("#finalAutoZapBtn").addEventListener("click", () => {
  store.continueToAutoZapClicked = true;
  saveLocalProgress();
  trackEvent("continue_to_autozap_clicked", { source: "mobile_final_preview", href: getMainAutoZapUrl() });
});
document.querySelector("#continueAutoZapBtn").addEventListener("click", async () => {
  store.continueToAutoZapClicked = true;
  saveLocalProgress();
  trackEvent("export_autozap_clicked", { source: "mobile_final" });
  trackEvent("continue_to_autozap_clicked", { source: "mobile_save", href: getMainAutoZapUrl() });
  const result = await exportToAutoZap();
  showModal({
    type: "success",
    title: "Agora sua loja pode começar a operar",
    text: "O AutoZap Start criou a base. O AutoZap principal ajuda a atender clientes, organizar vendas, estoque, financeiro, marketing e WhatsApp.",
    json: result && result.data ? (result.data.payload || result.data) : null,
    actions: [
      { label: "Conhecer o AutoZap", href: getMainAutoZapUrl(), track: "export_autozap_clicked" },
      { label: "Ver resumo", close: true },
    ],
  });
  window.location.href = getMainAutoZapUrl();
});
document.querySelector("[data-close-modal]").addEventListener("click", hideModal);

document.querySelectorAll("input, select").forEach((field) => {
  field.addEventListener("input", () => {
    syncFormState();
    saveLocalProgress();
  });
});

document.querySelectorAll("[data-choice]").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (group.dataset.choice === "focus") {
      button.classList.toggle("selected");
      const selected = Array.from(group.querySelectorAll("button.selected"));
      if (!selected.length) button.classList.add("selected");
      store.focusAreas = Array.from(group.querySelectorAll("button.selected")).map((item) => item.dataset.value);
      store.focus = store.focusAreas.join(", ");
    } else {
      group.querySelectorAll("button").forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
      store[group.dataset.choice] = button.dataset.value;
    }
    renderStoreData();
    saveLocalProgress();
  });
});

document.querySelector("#categoryGrid").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  button.classList.toggle("active");
  store.categories = Array.from(document.querySelectorAll("#categoryGrid .active")).map((item) => item.dataset.category);
  const availableIds = getProductsForSelectedCategories().map((product) => product.id);
  store.selectedProducts = normalizeSelectedProducts(store.selectedProducts).filter((item) => availableIds.includes(item.productId));
  store.stockPlan = null;
  store.initialStockPlan = generateInitialStockPlan({ capital: store.capital, categories: store.categories }, store.recommendedSupplier || findRecommendedSupplier({ city: store.city, categories: store.categories, capital: store.capital }));
  renderStockPlan();
  renderCatalogPreview();
  saveLocalProgress();
});

document.querySelector("#supplierPreview").addEventListener("click", (event) => {
  const button = event.target.closest(".product-card");
  if (!button) return;
  const productId = button.dataset.productId;
  const action = event.target.closest("[data-action]") ? event.target.closest("[data-action]").dataset.action : "select";
  updateSelectedProduct(productId, action);
  renderSuppliers();
  renderInitialStockPlan();
  saveLocalProgress();
});

AutoZapAPI.createAnonymousSession().then(async () => {
  document.querySelector("#cityInput").value = store.city || "";
  document.querySelector("#capitalInput").value = store.capital;
  document.querySelector("#leadEmail").value = store.leadEmail || "";
  document.querySelector("#leadWhatsapp").value = store.leadWhatsapp || "";
  await loadStartSuppliers();
  renderStoreData();
  renderStockPlan();
  renderCatalogPreview();
  renderPosts();
  renderFinalSummary();
  restoreSavedChoices();
  setStep(Math.min(store.currentStep || 0, steps.length - 1));
});

window.addEventListener("beforeunload", () => {
  const step = getCurrentStep();
  store.currentStep = step;
  store.lastDurationMs = Date.now() - FLOW_STARTED_AT;
  saveLocalProgress();
  if (step < 5) {
    trackEvent("abandon_possible", {
      lastStep: step,
      durationMs: store.lastDurationMs,
      storeName: store.storeName,
    });
  }
});
