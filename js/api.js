const AutoZapAPI = (() => {
  const DEFAULT_API_BASE_URL = "https://aip.autozap.log.br";
  const config = window.AUTOZAP_START_CONFIG || window.AutoZapConfig || {};
  const routes = config.routes || {};
  const SESSION_KEY = "autozap_start_session";
  const USAGE_KEY = "autozap_start_usage";
  const LEADS_KEY = "autozap_start_leads";
  const EXPORTS_KEY = "autozap_start_exports";
  const ADMIN_AUTH_KEY = "autozap_start_admin_auth";
  const ADMIN_AUTH_HEADER = "x-admin-token";
  const MOCK_DELAY = 520;
  const DEBUG_KEY = "DEBUG_API";
  const START_DIAGNOSTIC_PATH = routes.identity || "/ai/start-diagnostic";

  const endpoints = {
    session: routes.session || "/start/session",
    suppliers: routes.suppliers || "/start/suppliers",
    supplierProducts: routes.supplierProducts || "/start/suppliers/:id/products",
    lead: routes.lead || routes.leads || "/start/lead",
    leads: routes.leads || routes.lead || "/start/lead",
    diagnostic: routes.diagnostic || "/start/diagnostic",
    image: routes.image || "/start/image",
    saveSelectedProducts: routes.saveSelectedProducts || "/start/selected-products",
    adminLogin: routes.adminLogin || "/start/admin/login",
    identity: routes.identity || routes.diagnostic || "/start/diagnostic",
    logo: routes.logo || routes.image || "/start/image",
    bio: routes.bio || routes.diagnostic || "/start/diagnostic",
    posts: routes.posts || routes.diagnostic || "/start/diagnostic",
    stock: routes.stock || routes.diagnostic || "/start/diagnostic",
    scripts: routes.scripts || routes.diagnostic || "/start/diagnostic",
    preview: routes.preview || routes.diagnostic || "/start/diagnostic",
    exportAutoZap: routes.exportAutoZap || routes.lead || "/start/lead",
    adminLogin: routes.adminLogin || "/start/admin/login",
    adminMetrics: routes.adminMetrics || "/start/admin/metrics",
    recentLeads: routes.recentLeads || "/start/admin/leads",
    recentSessions: routes.recentSessions || "/start/admin/sessions",
  };

  function shouldUseMock() {
    const useMock = String(localStorage.getItem("USE_MOCK") || "").toLowerCase();
    return config.mockMode === true || useMock === "true" || useMock === "1";
  }

  function readAdminAuthToken() {
    try {
      return sessionStorage.getItem(ADMIN_AUTH_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function writeAdminAuthToken(token) {
    try {
      if (token) sessionStorage.setItem(ADMIN_AUTH_KEY, token);
      else sessionStorage.removeItem(ADMIN_AUTH_KEY);
    } catch (error) {}
  }

  function clearAdminAuthToken() {
    writeAdminAuthToken("");
  }

  function hasAdminAuthToken() {
    return Boolean(readAdminAuthToken());
  }

  function adminHeaders(headers = {}) {
    const token = readAdminAuthToken();
    return token ? { ...headers, [ADMIN_AUTH_HEADER]: token } : { ...headers };
  }

  function debugApi(details) {
    if (localStorage.getItem(DEBUG_KEY) !== "1") return;
    console.log("[AutoZap Start API]", {
      method: details.method,
      endpoint: displayEndpoint(details.endpoint),
      url: details.url,
      status: details.status,
      startSessionRequested: Boolean(details.startSessionRequested),
      hasStartSession: Boolean(details.hasStartSession),
      headersHasStartSession: Boolean(details.headersHasStartSession),
      hasMessage: details.hasMessage,
      messageLength: details.messageLength,
      model: details.model || "",
      imageReceived: Boolean(details.imageReceived),
      imageBase64Length: details.imageBase64Length || 0,
      mimeType: details.mimeType || "",
      timeoutMs: details.timeoutMs,
      aborted: Boolean(details.aborted),
      body: sanitizeDebugBody(details.body),
      caller: details.caller || "",
      context: details.context || "",
      mockActive: shouldUseMock(),
    });
  }

  function displayEndpoint(endpoint) {
    const value = String(endpoint || "");
    const base = String(config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    return value.startsWith(base) ? value.slice(base.length) || "/" : value;
  }

  function sanitizeDebugBody(value) {
    const secretPattern = new RegExp(`token|secret|password|authorization|api[_-]?key|openai|imageBase64|base64|${"s"}k-`, "i");
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return String(value).slice(0, 2000);
    if (Array.isArray(value)) return value.slice(0, 20).map(sanitizeDebugBody);
    return Object.entries(value).slice(0, 50).reduce((safe, [key, item]) => {
      safe[key] = secretPattern.test(key) || secretPattern.test(String(item || "")) ? "[redacted]" : sanitizeDebugBody(item);
      return safe;
    }, {});
  }

  function findImagePayload(value) {
    if (!value || typeof value !== "object") return null;
    if (typeof value.imageBase64 === "string") return value;
    if (value.data && typeof value.data === "object") {
      const fromData = findImagePayload(value.data);
      if (fromData) return fromData;
    }
    if (value.image && typeof value.image === "object") {
      if (typeof value.image.base64 === "string") return { ...value.image, imageBase64: value.image.base64 };
      const fromImage = findImagePayload(value.image);
      if (fromImage) return fromImage;
    }
    return null;
  }

  function imageDebugDetails(value) {
    const source = findImagePayload(value);
    const imageBase64 = source && source.imageBase64;
    return {
      imageReceived: Boolean(imageBase64),
      imageBase64Length: typeof imageBase64 === "string" ? imageBase64.length : 0,
      mimeType: source && source.mimeType || "",
      model: source && source.model || "",
    };
  }

  function requestTimeoutMs(value, fallback) {
    const timeout = Number(value || fallback);
    return Number.isFinite(timeout) && timeout > 0 ? timeout : fallback;
  }

  function debugAiFormat(label, response, text) {
    if (localStorage.getItem(DEBUG_KEY) !== "1") return;
    const source = response && typeof response === "object" ? response : {};
    console.log("[AutoZap Start AI format]", {
      label,
      responseKeys: Object.keys(source).slice(0, 30),
      dataKeys: source.data && typeof source.data === "object" ? Object.keys(source.data).slice(0, 30) : [],
      hasText: Boolean(text),
      textLength: text ? text.length : 0,
    });
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
    if (typeof response.data?.result === "string") return response.data.result;
    if (typeof response.data?.output === "string") return response.data.output;
    if (typeof response.data?.answer === "string") return response.data.answer;
    if (typeof response.diagnostic === "string") return response.diagnostic;
    if (typeof response.diagnostic?.text === "string") return response.diagnostic.text;
    return "";
  }

  function parseJsonObject(value) {
    if (typeof value !== "string") return null;
    const text = value.trim();
    if (!text || !/^[\[{]/.test(text)) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function safeText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function diagnosticTextFromPayload(payload = {}) {
    return safeText(payload.message) || safeText(payload.prompt) || safeText(payload.description);
  }

  function buildDiagnosticMessage(payload = {}) {
    const storeName = safeText(payload.storeName) || safeText(payload.name) || safeText(payload.idea) || "uma loja de celulares";
    const city = safeText(payload.city) || "sua cidade";
    const state = safeText(payload.state);
    const businessType = safeText(payload.businessType) || safeText(payload.segment) || safeText(payload.focus) || "assistência e venda de celulares";
    const focus = safeText(payload.focus) || safeText(payload.objective) || "venda, atendimento e presença digital";
    return [
      `Crie uma identidade inicial para ${storeName}.`,
      `Segmento: ${businessType}.`,
      `Localização: ${city}${state ? `/${state}` : ""}.`,
      `Objetivo: ${focus}.`,
      "Gere nome, slogan, tom de comunicação, descrição curta para WhatsApp e sugestões visuais simples.",
      "Responda de forma estruturada com campos como Nome, Slogan, Tom, WhatsApp e Visual.",
    ].join(" ");
  }

  function ensureDiagnosticPayload(payload = {}) {
    const source = payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {};
    const text = diagnosticTextFromPayload(source) || buildDiagnosticMessage(source);
    const message = safeText(text);
    if (!message || message.length < 20) {
      throw {
        ok: false,
        status: 0,
        endpoint: START_DIAGNOSTIC_PATH,
        error: "diagnostic_message_required",
        message: "diagnostic_message_required",
        context: "start_diagnostic",
        body: { error: "diagnostic_message_required" },
      };
    }
    return {
      ...source,
      message,
      prompt: safeText(source.prompt) || message,
      description: safeText(source.description) || message,
      storeName: safeText(source.storeName) || safeText(source.name) || safeText(source.idea) || "uma loja de celulares",
      city: safeText(source.city) || "sua cidade",
      state: safeText(source.state),
      businessType: safeText(source.businessType) || safeText(source.segment) || safeText(source.focus) || "assistência e venda de celulares",
      source: safeText(source.source) || "autozap-start",
    };
  }

  function debugDiagnosticPayload(payload) {
    if (localStorage.getItem(DEBUG_KEY) !== "1") return;
    const text = diagnosticTextFromPayload(payload);
    console.log("[AutoZap Start diagnostic payload]", {
      endpoint: START_DIAGNOSTIC_PATH,
      hasMessage: Boolean(safeText(payload && payload.message)),
      messageLength: text.length,
      hasStartSession: Boolean(getStartSessionToken()),
    });
  }

  function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    const base = String(config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
    const safePath = String(path || "").startsWith("/") ? path : `/${path || ""}`;
    return `${base}${safePath}`;
  }

  function extractStartSessionToken(session) {
    if (!session) return "";
    if (typeof session === "string") return session;
    if (typeof session !== "object") return "";
    const data = session.data && typeof session.data === "object" ? session.data : {};
    return session.sessionToken || session.startSessionToken || session.token || data.sessionToken || data.startSessionToken || data.token || "";
  }

  function getStartSessionToken() {
    return extractStartSessionToken(readStartSessionValue());
  }

  function clearStartSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function readStartSessionValue() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return raw;
    }
  }

  async function ensureStartSession({ force = false } = {}) {
    if (shouldUseMock()) return null;
    const saved = force ? null : readStartSessionValue();
    const savedToken = extractStartSessionToken(saved);
    if (savedToken) return savedToken;
    const session = await createStartSession();
    const token = extractStartSessionToken(session);
    if (token) {
      localStorage.setItem(SESSION_KEY, token);
      return token;
    }
    return null;
  }

  function withStartSessionBody(body, token) {
    if (!token || body === undefined || body === null || typeof body === "string" || Array.isArray(body)) return body;
    if (typeof body !== "object") return body;
    return body.sessionToken ? body : { ...body, sessionToken: token };
  }

  function shouldRetryStartSession(response) {
    return response && response.status === 401 && responseCode(response) === "start_session_required";
  }

  async function apiRequest(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const url = buildUrl(path);
    const context = options.context || "";
    const caller = options.caller || "";
    const configuredTimeout = options.timeoutMs !== undefined ? options.timeoutMs : config.requestTimeoutMs;
    const timeoutMs = requestTimeoutMs(configuredTimeout, 15000);
    async function sendOnce(isRetry = false) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      const headers = { ...(options.headers || {}) };
      let requestBody = options.body;
      let token = "";
      if (options.startSession) {
        token = await ensureStartSession({ force: isRetry });
        if (token) headers["x-start-session"] = headers["x-start-session"] || token;
        if (method === "POST") requestBody = withStartSessionBody(requestBody, token);
        if (!token) {
          const body = { error: "start_session_missing" };
          debugApi({
            endpoint: path,
            url,
            status: "blocked",
            method,
            body,
            caller,
            context,
            startSessionRequested: true,
            hasStartSession: false,
            headersHasStartSession: false,
            timeoutMs,
            aborted: false,
          });
          return {
            ok: false,
            status: 0,
            endpoint: path,
            url,
            message: "start_session_missing",
            data: null,
            error: "start_session_missing",
            body,
            raw: body,
            context,
            caller,
            mockActive: shouldUseMock(),
            aborted: false,
            timeoutMs,
          };
        }
      }
      const fetchOptions = { method, headers, signal: controller.signal };
      if (requestBody !== undefined) {
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
        fetchOptions.body = typeof requestBody === "string" ? requestBody : JSON.stringify(requestBody);
      }
      debugApi({
        endpoint: path,
        url,
        status: "before-fetch",
        method,
        body: null,
        caller,
        context,
        startSessionRequested: Boolean(options.startSession),
        hasStartSession: Boolean(token),
        headersHasStartSession: Boolean(headers["x-start-session"]),
        hasMessage: path === START_DIAGNOSTIC_PATH ? Boolean(diagnosticTextFromPayload(requestBody)) : undefined,
        messageLength: path === START_DIAGNOSTIC_PATH ? diagnosticTextFromPayload(requestBody).length : undefined,
        timeoutMs,
        aborted: false,
        imageReceived: false,
      });
      try {
        const response = await fetch(url, fetchOptions);
        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : await response.text().catch(() => "");
        const debugBody = payload && typeof payload === "object" ? payload : { data: payload };
        const imageDetails = imageDebugDetails(debugBody);
        debugApi({
          endpoint: path,
          url,
          status: response.status,
          method,
          body: debugBody,
          caller,
          context,
          startSessionRequested: Boolean(options.startSession),
          hasStartSession: Boolean(headers["x-start-session"]),
          headersHasStartSession: Boolean(headers["x-start-session"]),
          model: imageDetails.model,
          imageReceived: imageDetails.imageReceived,
          imageBase64Length: imageDetails.imageBase64Length,
          mimeType: imageDetails.mimeType,
          timeoutMs,
          aborted: false,
        });
        const body = payload && typeof payload === "object" ? payload : { data: payload };
        const message = body.error || body.message || (response.ok ? "" : statusMessage(response.status));
        return {
          ok: response.ok && body.ok !== false,
          status: response.status,
          endpoint: path,
          url,
          message,
          data: body.data !== undefined ? body.data : body,
          error: message,
          body,
          raw: body,
          context,
          caller,
          mockActive: shouldUseMock(),
          aborted: false,
          timeoutMs,
        };
      } catch (error) {
        const isTimeout = error && error.name === "AbortError";
        const message = isTimeout ? "Tempo de resposta excedido." : "Não foi possível conectar agora. Tente novamente em alguns instantes.";
        const body = { originalMessage: error && error.message ? error.message : "Falha de rede" };
        debugApi({
          endpoint: path,
          url,
          status: isTimeout ? "timeout" : "network-error",
          method,
          body,
          caller,
          context,
          startSessionRequested: Boolean(options.startSession),
          hasStartSession: Boolean(token),
          headersHasStartSession: Boolean(headers["x-start-session"]),
          timeoutMs,
          aborted: Boolean(isTimeout),
          imageReceived: false,
        });
        return {
          ok: false,
          status: 0,
          endpoint: path,
          url,
          message,
          data: null,
          error: message,
          body,
          raw: null,
          context,
          caller,
          mockActive: shouldUseMock(),
          aborted: Boolean(isTimeout),
          timeoutMs,
        };
      } finally {
        window.clearTimeout(timeout);
      }
    }
    const first = await sendOnce(false);
    if (options.startSession && shouldRetryStartSession(first) && !options._startSessionRetry) {
      clearStartSession();
      const second = await sendOnce(true);
      return second;
    }
    return first;
  }

  function statusMessage(status) {
    return {
      400: "Dados incompletos ou inválidos.",
      422: "Dados incompletos ou inválidos.",
      401: "Acesso não autorizado.",
      403: "Acesso negado.",
      404: "Recurso não encontrado na API.",
      500: "Erro interno no servidor.",
    }[status] || `API respondeu com status ${status}.`;
  }

  function failureObject(error, fallbackMessage, context = "") {
    return {
      ok: false,
      status: error && error.status !== undefined ? error.status : 0,
      endpoint: error && error.endpoint,
      url: error && error.url,
      message: (error && (error.message || error.error)) || fallbackMessage,
      error: (error && (error.message || error.error)) || fallbackMessage,
      body: error && (error.body || error.raw) || null,
      data: null,
      raw: error && error.raw || null,
      context: error && error.context || context,
      caller: error && error.caller,
      mockActive: shouldUseMock(),
    };
  }

  function normalizeArrayResponse(response, key) {
    const raw = response && response.raw ? response.raw : response;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw[key])) return raw[key];
    if (raw && raw.data && Array.isArray(raw.data)) return raw.data;
    if (raw && raw.data && Array.isArray(raw.data[key])) return raw.data[key];
    if (response && Array.isArray(response.data)) return response.data;
    if (response && response.data && Array.isArray(response.data[key])) return response.data[key];
    return [];
  }

  function normalizeSupplier(item = {}) {
    const id = item.id || item._id || item.supplierId || item.uuid || item.cnpj || item.phone || item.name;
    const name = item.name || item.companyName || item.tradeName || item.fantasyName || item.contactName || "Fornecedor";
    return {
      id: String(id || createId("supplier")),
      name,
      supplierName: name,
      companyName: item.companyName || item.razaoSocial || item.legalName || name,
      contactName: item.contactName || item.ownerName || item.responsibleName || "",
      city: item.city || item.addressCity || item.municipio || "",
      state: item.state || item.uf || item.addressState || "",
      phone: item.phone || item.whatsapp || item.mobile || "",
      status: item.status || (item.active === false ? "inactive" : "active"),
      verified: item.verified !== undefined ? Boolean(item.verified) : item.status !== "pending",
      productCount: Number(item.productCount || item.productsCount || item.totalProducts || (Array.isArray(item.products) ? item.products.length : 0)) || 0,
      categories: item.categories || item.productCategories || [],
      distance: item.distance || "API real",
      deliveryTime: item.deliveryTime || item.shippingTime || "a combinar",
      reliabilityScore: Number(item.reliabilityScore || item.score || 95),
      recommendedReason: item.recommendedReason || "Fornecedor carregado do Core Server.",
      raw: item,
    };
  }

  function normalizeProduct(item = {}, supplierId = "") {
    const id = item.id || item._id || item.productId || item.sku || item.code || item.name || item.title || item.productName;
    const price = Number(item.price ?? item.unitPrice ?? item.salePrice ?? item.cost ?? 0) || 0;
    const quantity = Number(item.quantity ?? item.stock ?? item.availableQuantity ?? item.available ?? 0) || 0;
    return {
      id: String(id || createId("product")),
      supplierId: String(item.supplierId || item.providerId || supplierId || ""),
      name: item.name || item.title || item.productName || item.description || "Produto",
      category: item.category || item.categoryName || item.type || "Produtos",
      brand: item.brand || item.manufacturer || "",
      model: item.model || item.variant || "",
      price,
      quantity,
      stock: Number(item.stock ?? item.quantity ?? item.availableQuantity ?? quantity) || 0,
      imageUrl: item.imageUrl || item.image || item.photo || item.thumbnail || "",
      photo: item.photo || item.image || item.imageUrl || "",
      active: item.active !== undefined ? Boolean(item.active) : item.status !== "inactive",
      raw: item,
    };
  }

  function normalizeSuppliersResponse(response) {
    return normalizeArrayResponse(response, "suppliers").map(normalizeSupplier);
  }

  function normalizeProductsResponse(response, supplierId) {
    return normalizeArrayResponse(response, "products").map((item) => normalizeProduct(item, supplierId));
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function createId(prefix = "azs") {
    if (window.crypto && window.crypto.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function readJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function mockResponse(data, delay = MOCK_DELAY) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve({ ok: true, data }), delay);
    });
  }

  function mockError(code, message, delay = 180) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve({ ok: false, code, message, error: message }), delay);
    });
  }

  function endpointRequiresStartSession(endpointKey) {
    return ["lead", "leads", "exportAutoZap", "diagnostic", "identity", "bio", "posts", "stock", "scripts", "preview", "image", "logo"].includes(endpointKey);
  }

  function endpointRequiresDiagnosticMessage(endpointKey) {
    return ["diagnostic", "identity", "bio", "posts", "stock", "scripts", "preview"].includes(endpointKey);
  }

  async function post(endpointKey, payload = {}) {
    if (shouldUseMock()) return null;
    const body = endpointRequiresDiagnosticMessage(endpointKey) ? ensureDiagnosticPayload(payload) : payload;
    if (endpointRequiresDiagnosticMessage(endpointKey)) debugDiagnosticPayload(body);
    const response = await apiRequest(endpoints[endpointKey], { method: "POST", body, caller: endpointKey, context: apiContextFor(endpointKey), startSession: endpointRequiresStartSession(endpointKey) });
    return response;
  }

  async function get(endpointKey) {
    if (shouldUseMock()) return null;
    const response = await apiRequest(endpoints[endpointKey], { method: "GET", caller: endpointKey, context: apiContextFor(endpointKey) });
    return response;
  }

  function apiContextFor(endpointKey) {
    return {
      session: "start_session_failed",
      suppliers: "suppliers_load_failed",
      supplierProducts: "supplier_products_load_failed",
      lead: "lead_save_failed",
      leads: "lead_save_failed",
      diagnostic: "diagnostic_failed",
      stock: "diagnostic_failed",
      identity: "diagnostic_failed",
      bio: "diagnostic_failed",
      posts: "diagnostic_failed",
      scripts: "diagnostic_failed",
      preview: "diagnostic_failed",
      image: "image_failed",
      logo: "image_failed",
      exportAutoZap: "lead_save_failed",
    }[endpointKey] || "";
  }

  async function apiCreateStartSession(payload = {}) {
    if (shouldUseMock()) return null;
    return apiRequest(endpoints.session, { method: "POST", body: { source: "autozap-start", ...payload }, caller: "apiCreateStartSession", context: "start_session_failed" });
  }

  async function createStartSession(payload = {}) {
    const response = await apiCreateStartSession(payload);
    if (!response || !response.ok) return null;
    return response.data || response.raw || response.body || response;
  }

  async function apiGetStartSuppliers() {
    if (shouldUseMock()) return { ok: true, status: 200, data: [], suppliers: [] };
    const response = await apiRequest(endpoints.suppliers, { method: "GET", caller: "apiGetStartSuppliers", context: "suppliers_load_failed" });
    const suppliers = response.ok ? normalizeSuppliersResponse(response).filter((supplier) => !["deleted", "inactive", "disabled"].includes(String(supplier.status || "").toLowerCase())) : [];
    return { ...response, data: suppliers, suppliers };
  }

  async function apiGetStartSupplierProducts(supplierId) {
    if (shouldUseMock()) return { ok: true, status: 200, data: [], products: [] };
    const path = endpoints.supplierProducts.replace(":id", encodeURIComponent(supplierId));
    const response = await apiRequest(path, { method: "GET", caller: "apiGetStartSupplierProducts", context: "supplier_products_load_failed" });
    const products = response.ok ? normalizeProductsResponse(response, supplierId) : [];
    return { ...response, data: products, products };
  }

  async function apiSaveStartLead(payload = {}) {
    if (shouldUseMock()) return null;
    return apiRequest(endpoints.lead, { method: "POST", body: payload, caller: "apiSaveStartLead", context: "lead_save_failed", startSession: true });
  }

  async function apiSaveSelectedProducts(payload = {}) {
    if (shouldUseMock()) return null;
    return apiRequest(endpoints.saveSelectedProducts, { method: "POST", body: payload, caller: "apiSaveSelectedProducts", context: "diagnostic_failed" });
  }

  async function apiStartDiagnostic(payload = {}) {
    if (shouldUseMock()) return null;
    const diagnosticPayload = ensureDiagnosticPayload(payload);
    debugDiagnosticPayload(diagnosticPayload);
    return apiRequest(START_DIAGNOSTIC_PATH, {
      method: "POST",
      body: diagnosticPayload,
      caller: "apiStartDiagnostic",
      context: "start_diagnostic",
      startSession: true,
      timeoutMs: requestTimeoutMs(config.diagnosticRequestTimeoutMs, 30000),
    });
  }

  async function apiStartImage(payload = {}) {
    if (shouldUseMock()) return null;
    return apiRequest(endpoints.image, {
      method: "POST",
      body: payload,
      caller: "apiStartImage",
      context: "image_failed",
      startSession: true,
      timeoutMs: requestTimeoutMs(config.imageRequestTimeoutMs, 60000),
    });
  }

  async function createAnonymousSession() {
    const realSession = await apiCreateStartSession();
    if (realSession && realSession.ok && realSession.data) {
      writeJSON(SESSION_KEY, realSession.data);
      return realSession.data;
    }
    if (!shouldUseMock()) {
      return {
        anonymousSessionId: null,
        createdAt: new Date().toISOString(),
        riskLevel: "unknown",
        source: "autozap-start",
      };
    }
    let session = readJSON(SESSION_KEY, null);
    if (!session) {
      session = {
        anonymousSessionId: createId("azs"),
        createdAt: new Date().toISOString(),
        riskLevel: "low",
        source: "autozap-start",
      };
      writeJSON(SESSION_KEY, session);
    }
    return Promise.resolve(session);
  }

  function getUsage() {
    const session = readJSON(SESSION_KEY, {});
    const usage = readJSON(USAGE_KEY, null);
    if (!usage || usage.usageReset !== todayKey()) {
      return {
        anonymousSessionId: session.anonymousSessionId || null,
        usageReset: todayKey(),
        generationCount: 0,
        textGenerationCount: 0,
        imageGenerationCount: 0,
        dailyUsage: 0,
        riskLevel: "low",
      };
    }
    return usage;
  }

  function saveUsage(usage) {
    writeJSON(USAGE_KEY, usage);
  }

  function registerGeneration(type) {
    const usage = getUsage();
    usage.dailyUsage += 1;
    usage.generationCount += 1;
    if (type === "image") usage.imageGenerationCount += 1;
    if (type === "text") usage.textGenerationCount += 1;
    if (usage.dailyUsage > (config.limits && config.limits.dailyLimit ? config.limits.dailyLimit * 0.7 : 20)) usage.riskLevel = "medium";
    saveUsage(usage);
    return usage;
  }

  function usageGuard(type) {
    const usage = getUsage();
    const limits = config.limits || {};
    if (usage.dailyUsage >= (limits.dailyLimit || 30)) {
      return { allowed: false, code: "LIMIT_REACHED", message: "Salve sua loja gratuitamente para continuar.", usage };
    }
    if (type === "image" && usage.imageGenerationCount >= (limits.anonymousVisualGenerations || 1)) {
      usage.riskLevel = "medium";
      saveUsage(usage);
      return { allowed: false, code: "LIMIT_REACHED", message: "Salve sua loja gratuitamente para continuar.", usage };
    }
    if (type === "text" && usage.textGenerationCount >= (limits.anonymousTextGenerations || 20)) {
      usage.riskLevel = "medium";
      saveUsage(usage);
      return { allowed: false, code: "LIMIT_REACHED", message: "Salve sua loja gratuitamente para continuar.", usage };
    }
    return { allowed: true, usage };
  }

  function assertCanGenerateImage() {
    return usageGuard("image");
  }

  async function generateIdentity(payload = {}) {
    try {
      const realResponse = await apiStartDiagnostic(payload);
      if (realResponse !== null) {
        if (!realResponse.ok) return realResponse;
        return { ...realResponse, data: normalizeIdentityResponse(realResponse, payload) };
      }
      const guard = usageGuard("text");
      if (!guard.allowed) return mockError(guard.code, guard.message);
      registerGeneration("text");
      const context = normalizeContext(payload);
      const storeName = buildStoreName(context);
      const slogan = pick([
        `${context.focusLabel} com atendimento rápido em ${context.cityLabel}.`,
        "Tecnologia, acessórios e suporte com atendimento claro.",
        "Sua loja de confiança para comprar e cuidar do celular.",
      ]);
      const bio = buildBio(storeName, context);
      return mockResponse({
        storeName,
        slogan,
        colors: context.style === "premium" ? ["#087cff", "#07133f", "#0faa62", "#f5f9ff"] : ["#087cff", "#1d2747", "#ff7a1a", "#f5f9ff"],
        tone: context.style === "premium" ? "premium, claro e consultivo" : "direto, próximo e confiável",
        instagramBio: bio.instagramBio,
        whatsappDescription: bio.whatsappDescription,
        googleDescription: bio.googleBusinessDescription,
        googleBusinessDescription: bio.googleBusinessDescription,
        generatedIdentity: true,
      });
    } catch (error) {
      return failureObject(error, "Erro ao gerar identidade", "diagnostic_failed");
    }
  }

  function normalizeIdentityResponse(response, payload = {}) {
    const context = normalizeContext(payload || {});
    const fallbackName = limitPrompt(payload.storeName || payload.idea || buildStoreName(context), 80) || "TechCell";
    const fallbackBio = buildBio(fallbackName, context);
    const source = response && response.data !== undefined ? response.data : response;
    const text = extractAiText(source) || extractAiText(response);
    debugAiFormat("identity", source, text);
    const parsedText = parseJsonObject(text);
    const data = parsedText || (source && typeof source === "object" && !Array.isArray(source) ? source : {});
    const nestedIdentity = data.identity && typeof data.identity === "object" ? data.identity : {};
    const diagnostic = data.diagnostic && typeof data.diagnostic === "object" ? data.diagnostic : {};
    const combined = { ...data, ...nestedIdentity, ...diagnostic };
    const textFields = text ? parseIdentityText(text) : {};
    const hasIdentityFields = Boolean(
      combined.storeName || combined.name || combined.nome || combined.nomeLoja || combined.slogan || combined.tagline || combined.frase || textFields.storeName || textFields.slogan
    );
    const storeName = limitPrompt(
      combined.storeName || combined.name || combined.nome || combined.nomeLoja || textFields.storeName || fallbackName,
      80
    ) || fallbackName;
    const slogan = limitPrompt(
      combined.slogan || combined.tagline || combined.frase || textFields.slogan || `${context.focusLabel} com atendimento claro em ${context.cityLabel}.`,
      160
    );
    const tone = limitPrompt(combined.tone || combined.tom || combined.voice || textFields.tone || "direto, próximo e confiável", 120);
    const colors = normalizeColors(combined.colors || combined.cores || combined.palette || combined.paleta);
    const visualSuggestions = combined.visualSuggestions || combined.visuals || combined.sugestoesVisuais || textFields.visualSuggestions || [];
    return {
      ...combined,
      storeName,
      slogan,
      colors: colors.length ? colors : ["#087cff", "#07133f", "#0faa62", "#f5f9ff"],
      tone,
      instagramBio: combined.instagramBio || combined.instagram || fallbackBio.instagramBio,
      whatsappDescription: combined.whatsappDescription || combined.whatsapp || combined.descricaoWhatsApp || textFields.whatsappDescription || fallbackBio.whatsappDescription,
      googleDescription: combined.googleDescription || combined.googleBusinessDescription || fallbackBio.googleBusinessDescription,
      googleBusinessDescription: combined.googleBusinessDescription || combined.googleDescription || fallbackBio.googleBusinessDescription,
      visualSuggestions,
      generatedIdentity: true,
      fallback: !hasIdentityFields,
    };
  }

  function parseIdentityText(value) {
    const lines = String(value || "").split("\n").map((line) => line.trim()).filter(Boolean);
    const fields = {};
    lines.forEach((line) => {
      const clean = line.replace(/^[-*•\d.)\s]+/, "").trim();
      const separatorIndex = clean.indexOf(":");
      if (separatorIndex < 0) return;
      const key = clean.slice(0, separatorIndex).toLowerCase();
      const val = clean.slice(separatorIndex + 1).trim();
      if (!val) return;
      if (/nome|loja|marca/.test(key) && !fields.storeName) fields.storeName = val;
      if (/slogan|frase|tagline/.test(key) && !fields.slogan) fields.slogan = val;
      if (/tom|voz|comunica/.test(key) && !fields.tone) fields.tone = val;
      if (/whatsapp|descri/.test(key) && !fields.whatsappDescription) fields.whatsappDescription = val;
      if (/visual|cor|logo|identidade/.test(key)) fields.visualSuggestions = [...(fields.visualSuggestions || []), val];
    });
    return fields;
  }

  function normalizeColors(value) {
    if (Array.isArray(value)) return value.filter((item) => typeof item === "string" && item.trim()).slice(0, 6);
    if (typeof value !== "string") return [];
    return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean).slice(0, 6);
  }

  async function generateLogo(payload = {}) {
    try {
      const realResponse = await post("logo", payload);
      if (realResponse !== null) return realResponse;
      const guard = usageGuard("image");
      if (!guard.allowed) return mockResponse({ ...guard, reason: "image_limit" }, 180);
      const usage = registerGeneration("image");
      return mockResponse({
        allowed: true,
        logo: initials(payload.storeName || "TechCell"),
        style: "lettermark-premium",
        message: "Prévia visual criada localmente.",
        usage,
      });
    } catch (error) {
      return failureObject(error, "Erro ao gerar logo", "image_failed");
    }
  }

  function limitPrompt(value, maxLength = 900) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function buildImagePrompt(payload = {}) {
    const storeName = limitPrompt(payload.storeName || "loja de celulares", 80);
    const businessType = limitPrompt(payload.businessType || payload.focus || "loja de celulares e acessórios", 90);
    const style = limitPrompt(payload.style || "moderno, tecnológico, premium", 80);
    return limitPrompt(
      `Crie uma imagem de identidade visual/logotipo simples para uma loja chamada ${storeName}, do segmento ${businessType}, com estilo ${style}, adequado para loja de celulares. Não incluir texto pequeno ilegível. Fundo limpo. Ícone central simples.`,
      900
    );
  }

  function normalizeImageResponse(response) {
    const raw = response && response.raw ? response.raw : response;
    const data = response && response.data ? response.data : null;
    const source = findImagePayload(data) || findImagePayload(raw);
    const imageBase64 = source && source.imageBase64;
    const mimeType = source && source.mimeType || "image/png";
    if (!imageBase64) return null;
    return {
      imageDataUrl: String(imageBase64).startsWith("data:") ? imageBase64 : `data:${mimeType};base64,${imageBase64}`,
      mimeType,
      model: source.model || raw.model || "",
    };
  }

  function responseCode(response) {
    const raw = response && (response.raw || response.body) || {};
    const error = typeof raw.error === "string" && /^[a-z0-9_:-]+$/i.test(raw.error) ? raw.error : "";
    return String(raw.code || raw.errorCode || error || "");
  }

  async function adminRequest(endpointKey, options = {}) {
    if (shouldUseMock()) return null;
    if (endpointKey !== "adminLogin" && !hasAdminAuthToken()) {
      return {
        ok: false,
        status: 401,
        endpoint: endpoints[endpointKey] || endpointKey,
        message: "Faça login para acessar o painel administrativo.",
        error: "admin_auth_required",
        data: null,
        raw: { ok: false, error: "admin_auth_required" },
        context: "admin_auth_required",
      };
    }
    return apiRequest(endpoints[endpointKey], {
      ...options,
      headers: adminHeaders(options.headers || {}),
      caller: options.caller || endpointKey,
      context: options.context || "admin_auth_required",
    });
  }

  async function adminLogin(credentials = {}) {
    if (shouldUseMock()) {
      const token = `mock.${createId("admin")}`;
      writeAdminAuthToken(token);
      return {
        ok: true,
        status: 200,
        endpoint: endpoints.adminLogin,
        message: "",
        data: {
          token,
          user: { username: safeText(credentials.username) || "admin" },
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        },
      };
    }
    const response = await apiRequest(endpoints.adminLogin, {
      method: "POST",
      body: {
        username: safeText(credentials.username),
        password: safeText(credentials.password),
      },
      caller: "adminLogin",
      context: "admin_auth_failed",
    });
    const token = response && response.ok ? extractAdminToken(response.data || response.raw || response.body) : "";
    if (token) writeAdminAuthToken(token);
    return response;
  }

  function extractAdminToken(payload) {
    if (!payload || typeof payload !== "object") return "";
    return payload.token || payload.adminToken || payload.sessionToken || payload.data?.token || payload.data?.adminToken || "";
  }

  async function generateStartImage(payload = {}) {
    if (shouldUseMock()) {
      const guard = usageGuard("image");
      if (!guard.allowed) return mockResponse({ ...guard, reason: "image_limit" }, 180);
      const usage = registerGeneration("image");
      return mockResponse({
        allowed: true,
        logo: initials(payload.storeName || "TechCell"),
        fallback: true,
        message: "Prévia visual local criada com iniciais.",
        usage,
      });
    }
    const requestPayload = {
      prompt: limitPrompt(payload.prompt || buildImagePrompt(payload)),
      storeName: limitPrompt(payload.storeName, 80),
      description: limitPrompt(payload.description || payload.slogan || payload.focus, 220),
      style: limitPrompt(payload.style || "moderno, tecnológico, premium", 80),
      colors: Array.isArray(payload.colors) ? payload.colors.slice(0, 6) : [],
      source: "autozap-start",
    };
    const response = await apiStartImage(requestPayload);
    if (!response || !response.ok) {
      if (response && response.aborted) {
        return {
          ...response,
          error: "A imagem demorou mais que o esperado. Usamos uma prévia provisória, mas você pode tentar novamente.",
          message: "A imagem demorou mais que o esperado. Usamos uma prévia provisória, mas você pode tentar novamente.",
        };
      }
      if (response && response.status === 429 && responseCode(response) === "start_image_rate_limited") {
        return { ...response, error: "Limite de geração de imagem atingido. Tente novamente em alguns minutos.", message: "Limite de geração de imagem atingido. Tente novamente em alguns minutos." };
      }
      return response;
    }
    const normalized = normalizeImageResponse(response);
    if (!normalized) return { ...response, ok: false, error: "Imagem automática indisponível agora.", message: "Imagem automática indisponível agora.", data: null };
    registerGeneration("image");
    return { ...response, data: normalized };
  }

  async function generateBio(payload = {}) {
    try {
      const realResponse = await post("bio", payload);
      if (realResponse !== null) return realResponse;
      const guard = usageGuard("text");
      if (!guard.allowed) return mockError(guard.code, guard.message);
      registerGeneration("text");
      const context = normalizeContext(payload);
      return mockResponse(buildBio(payload.storeName || buildStoreName(context), context));
    } catch (error) {
      return failureObject(error, "Erro ao gerar bio", "diagnostic_failed");
    }
  }

  async function generatePosts(payload = {}) {
    try {
      const realResponse = await post("posts", payload);
      if (realResponse !== null) return realResponse;
      const guard = usageGuard("text");
      if (!guard.allowed) return mockError(guard.code, guard.message);
      registerGeneration("text");
      const context = normalizeContext(payload);
      const name = payload.storeName || buildStoreName(context);
      return mockResponse([
        { title: "Chegaram novidades", caption: `${name} já está atendendo em ${context.cityLabel}. Consulte modelos e acessórios.` },
        { title: "Proteja seu celular", caption: "Películas, capinhas e carregadores com indicação certa para o seu aparelho." },
        { title: "Atendimento de confiança", caption: "Orçamento claro, garantia combinada e suporte sem enrolação." },
        { title: "Oferta de inauguração", caption: "Condição especial para os primeiros clientes que chamarem no WhatsApp." },
      ].map((post, index) => ({ ...post, id: `post_${index + 1}` })));
    } catch (error) {
      return failureObject(error, "Erro ao gerar posts", "diagnostic_failed");
    }
  }

  async function generateStockPlan(payload = {}) {
    try {
      const realResponse = await post("stock", payload);
      if (realResponse !== null) return realResponse;
      const guard = usageGuard("text");
      if (!guard.allowed) return mockError(guard.code, guard.message);
      registerGeneration("text");
      const categories = payload.categories && payload.categories.length ? payload.categories : ["Celulares", "Acessórios"];
      const capitalMap = {
        "Até R$ 1.000": 950,
        "R$ 1.000 a R$ 3.000": 2400,
        "R$ 3.000 a R$ 8.000": 6200,
        "Acima de R$ 8.000": 9800,
      };
      const investment = capitalMap[payload.capital] || 2400;
      const items = Math.max(18, categories.length * 18 + Math.round(investment / 450));
      return mockResponse({
        categories,
        investment,
        items,
        quickTurnover: categories.includes("Acessórios") ? ["Capinhas", "Películas", "Carregadores"] : ["Películas", "Serviços"],
        highMargin: ["Películas", "Capinhas", "Serviços"],
        initialShoppingList: categories.map((category) => ({ category, suggestedItems: Math.max(4, Math.round(items / categories.length)) })),
        suppliers: buildSuppliers(categories, investment),
        risk: investment > 6000 ? "moderado" : "baixo",
      });
    } catch (error) {
      return failureObject(error, "Erro ao gerar estoque", "diagnostic_failed");
    }
  }

  async function generateSalesScripts(payload = {}) {
    try {
      const realResponse = await post("scripts", payload);
      if (realResponse !== null) return realResponse;
      const guard = usageGuard("text");
      if (!guard.allowed) return mockError(guard.code, guard.message);
      registerGeneration("text");
      const name = payload.storeName || "TechCell";
      return mockResponse({
        greeting: `Olá! Aqui é da ${name}. Me diga o modelo do seu celular e o que você precisa que eu te ajudo agora.`,
        objection: "Entendo. A diferença é orientação, procedência e garantia combinada antes do pagamento.",
        closing: "Posso separar esse item para você e te mandar as opções de pagamento?",
        afterSale: `Oi! Aqui é da ${name}. Passando para confirmar se ficou tudo certo com seu atendimento.`,
      });
    } catch (error) {
      return failureObject(error, "Erro ao gerar scripts", "diagnostic_failed");
    }
  }

  async function generateStorePreview(payload = {}) {
    try {
      const realResponse = await post("preview", payload);
      if (realResponse !== null) return realResponse;
      const categories = payload.categories || ["Celulares", "Acessórios"];
      return mockResponse({
        catalog: categories.slice(0, 6).map((category) => ({ category, title: category, status: "sugerido" })),
        channels: ["Instagram", "WhatsApp Business", "Google Perfil"],
        nextActions: ["Validar fornecedores", "Definir política de garantia", "Cadastrar produtos no AutoZap"],
      });
    } catch (error) {
      return failureObject(error, "Erro ao gerar prévia", "diagnostic_failed");
    }
  }

  async function saveLead(payload = {}) {
    try {
      const normalized = normalizeLead(payload);
      const realResponse = await apiSaveStartLead(normalized);
      if (realResponse !== null) return realResponse;
      if (!shouldUseMock()) {
        return { ok: false, status: 0, error: "Não foi possível salvar sua loja agora. Confira sua conexão e tente novamente.", message: "Não foi possível salvar sua loja agora. Confira sua conexão e tente novamente.", data: null };
      }
      const leads = readJSON(LEADS_KEY, []);
      const lead = { ...normalized, id: createId("lead") };
      leads.unshift(lead);
      writeJSON(LEADS_KEY, leads.slice(0, 100));
      console.log("AutoZap Start lead salvo", lead);
      return mockResponse({ saved: true, lead }, 260);
    } catch (error) {
      return failureObject(error, "Não foi possível salvar sua loja agora. Confira sua conexão e tente novamente.", "lead_save_failed");
    }
  }

  async function exportToAutoZap(payload = {}) {
    try {
      const exportPayload = {
        storeName: payload.storeName || "",
        slogan: payload.slogan || "",
        logo: payload.logo || "",
        colors: payload.colors || [],
        city: payload.city || "",
        capital: payload.capital || "",
        storeType: payload.storeType || payload.operationType || "",
        operationType: payload.operationType || payload.storeType || "",
        products: payload.products || [],
        services: payload.services || [],
        categories: payload.categories || [],
        warrantyPolicy: payload.warrantyPolicy || "",
        instagramBio: payload.instagramBio || "",
        whatsappDescription: payload.whatsappDescription || "",
        googleBusinessDescription: payload.googleBusinessDescription || payload.googleDescription || "",
        marketingPosts: payload.marketingPosts || [],
        salesScripts: payload.salesScripts || payload.scripts || {},
        stockPlan: payload.stockPlan || (payload.aiContext && payload.aiContext.stockPlan) || null,
        aiContext: payload.aiContext || {},
        progress: payload.progress || 0,
        generatedIdentity: Boolean(payload.generatedIdentity),
        createdAt: payload.createdAt || new Date().toISOString(),
        source: "autozap-start",
      };
      console.log("Export AutoZap Start -> AutoZap principal", exportPayload);
      const realResponse = await post("exportAutoZap", exportPayload);
      if (realResponse !== null) return realResponse;
      if (!shouldUseMock()) {
        return { ok: false, status: 0, error: "Não foi possível enviar o resumo para o AutoZap agora.", data: null };
      }
      const exports = readJSON(EXPORTS_KEY, []);
      exports.unshift({ id: createId("exp"), ...exportPayload });
      writeJSON(EXPORTS_KEY, exports.slice(0, 50));
      return mockResponse({ exported: true, payload: exportPayload }, 320);
    } catch (error) {
      return failureObject(error, "Não foi possível salvar sua solicitação agora.", "lead_save_failed");
    }
  }

  async function getAdminMetrics() {
    const realResponse = await adminRequest("adminMetrics");
    if (realResponse) return realResponse;
    const leads = readJSON(LEADS_KEY, []);
    const usage = getUsage();
    return mockResponse({
      sessionsStarted: Math.max(248, leads.length + 248),
      storesCreated: Math.max(73, leads.length * 2 + 73),
      totalLeads: Math.max(31, leads.length),
      textGenerations: Math.max(326, usage.textGenerationCount),
      imageGenerations: Math.max(86, usage.imageGenerationCount),
      estimatedCost: 148,
      abuseBlocks: usage.riskLevel === "medium" ? 10 : 9,
      autoZapConversions: Math.max(18, readJSON(EXPORTS_KEY, []).length),
      growth: [42, 58, 64, 76, 91, 118, 137],
    }, 120);
  }

  async function getRecentLeads() {
    const realResponse = await adminRequest("recentLeads");
    if (realResponse) return realResponse;
    const leads = readJSON(LEADS_KEY, []);
    const fallback = [
      { id: "lead_dev_1", contact: "(11) 99999-1122", contactType: "whatsapp", storeName: "TechCell", city: "São Paulo", progress: 100, createdAt: new Date().toISOString() },
      { id: "lead_dev_2", contact: "contato@primecell.com", contactType: "email", storeName: "PrimeCell", city: "Curitiba", progress: 88, createdAt: new Date().toISOString() },
    ];
    return mockResponse(leads.length ? leads : fallback, 120);
  }

  async function getRecentSessions() {
    const realResponse = await adminRequest("recentSessions");
    if (realResponse) return realResponse;
    return mockResponse([
      { id: "azs_18f2", city: "São Paulo", store: "TechCell", status: "Prévia criada", risk: "Baixo" },
      { id: "azs_94aa", city: "Curitiba", store: "PrimeCell", status: "Lead salvo", risk: "Baixo" },
      { id: "azs_51bc", city: "Recife", store: "ConnectCell", status: "Identidade gerada", risk: "Médio" },
      { id: "azs_703d", city: "Goiânia", store: "ZapCell Store", status: "Exportado", risk: "Baixo" },
      { id: "azs_b12e", city: "Campinas", store: "Cell Mais", status: "Bloqueio progressivo", risk: "Alto" },
    ], 120);
  }

  function normalizeLead(payload) {
    const contact = payload.contact || payload.whatsapp || payload.email || "";
    const contactType = payload.contactType || (String(contact).includes("@") ? "email" : "whatsapp");
    const selectedProducts = Array.isArray(payload.selectedProducts) ? payload.selectedProducts : [];
    const estimatedInitialStockValue = payload.estimatedInitialStockValue !== undefined
      ? payload.estimatedInitialStockValue
      : selectedProducts.reduce((sum, product) => sum + (Number(product.total) || Number(product.price) * Number(product.quantity || 1) || 0), 0);
    return {
      name: payload.name || payload.storeName || "",
      phone: payload.phone || payload.leadWhatsapp || (contactType === "whatsapp" ? contact : ""),
      email: payload.email || payload.leadEmail || (contactType === "email" ? contact : ""),
      contact,
      contactType,
      storeName: payload.storeName || "",
      city: payload.city || "",
      state: payload.state || "",
      capital: payload.capital || "",
      businessType: payload.businessType || payload.operationType || payload.storeType || "",
      operationType: payload.operationType || payload.storeType || "",
      categories: Array.isArray(payload.categories) ? payload.categories : [],
      identity: payload.identity || {},
      recommendedSupplier: payload.recommendedSupplier || null,
      selectedSupplierId: payload.selectedSupplierId || (payload.recommendedSupplier && payload.recommendedSupplier.id) || "",
      selectedProducts,
      estimatedInitialStockValue,
      finalSummary: payload.finalSummary || payload.summary || {},
      diagnostic: payload.diagnostic || {
        capital: payload.capital || "",
        focus: payload.focus || "",
        categories: payload.categories || [],
        margin: payload.margin || "",
      },
      progress: payload.progress || 0,
      generatedIdentity: Boolean(payload.generatedIdentity),
      createdAt: payload.createdAt || new Date().toISOString(),
      source: "autozap-start",
    };
  }

  function normalizeContext(payload) {
    const cityValue = typeof payload.city === "string" ? payload.city : "";
    const city = cityValue.trim() ? cityValue.trim() : "sua região";
    const focus = typeof payload.focus === "string" && payload.focus.trim() ? payload.focus : "Acessórios";
    const idea = typeof payload.idea === "string" ? payload.idea : "";
    const style = /premium|iphone|apple|alto padrão/i.test(`${idea} ${focus}`) ? "premium" : "popular";
    return {
      cityLabel: city,
      focusLabel: focus === "iPhone" ? "iPhones, acessórios premium e suporte especializado" : `${focus.toLowerCase()}, celulares e assistência`,
      style,
      idea,
    };
  }

  function buildBio(name, context) {
    return {
      instagramBio: `${name} | ${context.focusLabel}. Atendimento rápido em ${context.cityLabel}. Chame no WhatsApp.`,
      whatsappDescription: `${name}: ${context.focusLabel}, orçamento claro, garantia simples e atendimento pelo WhatsApp.`,
      googleBusinessDescription: `${name} atende ${context.cityLabel} com celulares, acessórios, películas, carregadores e suporte inicial para assistência técnica.`,
    };
  }

  function buildStoreName(context) {
    if (context.idea && context.idea.trim().length > 2 && context.idea.trim().length <= 24) return titleCase(context.idea.trim());
    if (/iphone|premium|apple/i.test(context.idea)) return pick(["Prime iPhone", "Blue Apple Cell", "iCell Premium"]);
    return pick(["TechCell", "PrimeCell", "ConnectCell", "ZapCell Store", "Cell Mais"]);
  }

  function buildSuppliers(categories, investment) {
    const base = [
      { name: "Distribuidor regional", fit: "Acessórios de giro rápido", checks: "CNPJ, nota fiscal, política de troca" },
      { name: "Atacado especializado", fit: "Películas, capinhas e carregadores", checks: "Procedência, garantia e prazo de envio" },
      { name: "Assistência parceira", fit: "Peças e serviços sob demanda", checks: "Histórico, garantia e tempo de reparo" },
    ];
    if (categories.includes("Celulares")) {
      base.unshift({ name: "Fornecedor homologado", fit: "Aparelhos novos e seminovos", checks: "IMEI, nota fiscal e garantia formal" });
    }
    if (investment < 1200) return base.filter((item) => item.name !== "Fornecedor homologado").slice(0, 3);
    return base.slice(0, 4);
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function titleCase(value) {
    return String(value || "").split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
  }

  function initials(value) {
    return String(value || "").split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "TC";
  }

  function setupDebugTools() {
    if (!window || localStorage.getItem(DEBUG_KEY) !== "1") return;
    window.AutoZapStartDebug = window.AutoZapStartDebug || {};
    window.AutoZapStartDebug.testDiagnosticSession = async function testDiagnosticSession() {
      const token = await ensureStartSession();
      const response = await apiRequest(START_DIAGNOSTIC_PATH, {
        method: "POST",
        body: {
          message: "Crie uma identidade inicial para uma loja chamada Loja Debug, localizada em Sao Paulo/SP, focada em celulares. Gere nome, slogan, tom de comunicacao, descricao curta para WhatsApp e sugestoes visuais simples.",
          storeName: "Loja Debug",
          city: "Sao Paulo",
          state: "SP",
          businessType: "celulares",
          source: "autozap-start-debug",
        },
        startSession: true,
        caller: "AutoZapStartDebug.testDiagnosticSession",
        context: "start_diagnostic",
      });
      return {
        ok: Boolean(response && response.ok),
        status: response && response.status,
        endpoint: response && response.endpoint,
        error: response && response.error,
        hasStartSession: Boolean(token),
      };
    };
  }

  setupDebugTools();

  return {
    config,
    endpoints,
    apiRequest,
    createStartSession,
    ensureStartSession,
    getStartSessionToken,
    clearStartSession,
    normalizeSupplier,
    normalizeProduct,
    normalizeSuppliersResponse,
    normalizeProductsResponse,
    apiCreateStartSession,
    apiGetStartSuppliers,
    getStartSuppliers: apiGetStartSuppliers,
    apiGetStartSupplierProducts,
    getStartSupplierProducts: apiGetStartSupplierProducts,
    apiSaveStartLead,
    saveStartLead: apiSaveStartLead,
    apiSaveSelectedProducts,
    apiStartDiagnostic,
    apiStartImage,
    createAnonymousSession,
    getUsage,
    assertCanGenerateImage,
    generateIdentity,
    generateLogo,
    generateStartImage,
    generateBio,
    generatePosts,
    generateStockPlan,
    generateSalesScripts,
    generateStorePreview,
    saveLead,
    exportToAutoZap,
    getAdminMetrics,
    getRecentLeads,
    getRecentSessions,
    adminLogin,
    hasAdminAuthToken,
    getAdminAuthToken: readAdminAuthToken,
    setAdminAuthToken: writeAdminAuthToken,
    clearAdminAuthToken,
  };
})();

