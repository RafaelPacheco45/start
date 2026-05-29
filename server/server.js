require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const port = Number(process.env.PORT || 3001);
const memoryUsage = new Map();
const leads = [];
const sessions = [];
const exportsLog = [];
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || "admin").trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "change-me").trim();
const ADMIN_AUTH_SECRET = String(process.env.ADMIN_AUTH_SECRET || "autozap-start-admin-secret").trim();
const ADMIN_TOKEN_TTL_MS = Number(process.env.ADMIN_TOKEN_TTL_MS || 12 * 60 * 60 * 1000);

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || true }));
app.use(express.json({ limit: "256kb" }));
app.use(rateLimitMock);
app.use(detectRiskMock);

app.get("/api/start/health", (req, res) => ok(res, {
  service: "autozap-start",
  version: "0.3.0",
  mockMode: process.env.MOCK_MODE !== "false",
  uptime: process.uptime(),
}));

app.post("/api/start/admin/login", (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "").trim();
  if (!username || !password) {
    return fail(res, 400, "ADMIN_AUTH_REQUIRED", "Informe usuário e senha.");
  }
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return fail(res, 401, "ADMIN_AUTH_INVALID", "Usuário ou senha inválidos.");
  }
  const token = createAdminToken({ username });
  ok(res, {
    token,
    user: { username },
    expiresAt: new Date(Date.now() + ADMIN_TOKEN_TTL_MS).toISOString(),
  });
});

app.post("/api/start/session", (req, res) => {
  const session = {
    anonymousSessionId: createId("azs"),
    createdAt: new Date().toISOString(),
    riskLevel: req.riskLevel,
    source: "autozap-start",
  };
  sessions.unshift(session);
  ok(res, session);
});

app.post("/api/start/identity", usageGuardMock("text"), (req, res) => {
  const idea = String(req.body.idea || "").trim();
  const city = String(req.body.city || "sua região").trim();
  const focus = String(req.body.focus || "Acessórios");
  const storeName = idea.length > 2 ? titleCase(idea.slice(0, 32)) : "TechCell";
  ok(res, {
    storeName,
    slogan: `${focus} com atendimento rápido em ${city || "sua região"}.`,
    colors: ["#087cff", "#07133f", "#0faa62", "#f5f9ff"],
    tone: "claro, profissional e próximo",
    instagramBio: `${storeName} | ${focus.toLowerCase()}, celulares e assistência. Atendimento rápido pelo WhatsApp.`,
    whatsappDescription: `${storeName}: orçamento claro, garantia simples e atendimento pelo WhatsApp.`,
    googleDescription: `${storeName} atende ${city || "sua região"} com celulares, acessórios e suporte inicial.`,
  });
});

app.post("/api/start/logo", usageGuardMock("image"), (req, res) => {
  ok(res, {
    allowed: true,
    logo: initials(req.body.storeName || "TechCell"),
    style: "lettermark-premium",
    message: "Logo mockada criada no backend.",
  });
});

app.post("/api/start/posts", usageGuardMock("text"), (req, res) => {
  const name = req.body.storeName || "TechCell";
  ok(res, [
    { id: "post_1", title: "Chegaram novidades", caption: `${name} já está atendendo. Consulte modelos e acessórios.` },
    { id: "post_2", title: "Proteja seu celular", caption: "Películas, capinhas e carregadores com procedência." },
    { id: "post_3", title: "Atendimento de confiança", caption: "Orçamento claro, garantia combinada e suporte sem enrolação." },
    { id: "post_4", title: "Oferta de inauguração", caption: "Condição especial para os primeiros clientes." },
  ]);
});

app.post("/api/start/stock-plan", usageGuardMock("text"), (req, res) => {
  const categories = Array.isArray(req.body.categories) && req.body.categories.length ? req.body.categories : ["Celulares", "Acessórios"];
  const investment = capitalToNumber(req.body.capital);
  const items = Math.max(18, categories.length * 18 + Math.round(investment / 450));
  ok(res, {
    categories,
    investment,
    items,
    quickTurnover: ["Capinhas", "Películas", "Carregadores"],
    highMargin: ["Películas", "Capinhas", "Serviços"],
    initialShoppingList: categories.map((category) => ({ category, suggestedItems: Math.max(4, Math.round(items / categories.length)) })),
    suppliers: supplierList(categories, investment),
    risk: investment > 6000 ? "moderado" : "baixo",
  });
});

app.post("/api/start/sales-scripts", usageGuardMock("text"), (req, res) => {
  const name = req.body.storeName || "TechCell";
  ok(res, {
    greeting: `Olá! Aqui é da ${name}. Me diga o modelo do seu celular e eu te ajudo agora.`,
    objection: "Aqui você compra com orientação, procedência e garantia combinada antes do pagamento.",
    closing: "Posso separar esse item para você e mandar as opções de pagamento?",
    afterSale: `Oi! Aqui é da ${name}. Passando para confirmar se ficou tudo certo.`,
  });
});

app.post("/api/start/leads", validateLeadPayload, async (req, res) => {
  const turnstile = await verifyTurnstileMock(req.body.turnstileToken);
  if (!turnstile.ok) return fail(res, 403, "TURNSTILE_INVALID", "Validação de segurança indisponível.");
  const lead = {
    id: createId("lead"),
    contact: req.body.contact,
    contactType: req.body.contactType,
    storeName: req.body.storeName || "",
    city: req.body.city || "",
    capital: req.body.capital || "",
    operationType: req.body.operationType || "",
    progress: Number(req.body.progress || 0),
    generatedIdentity: Boolean(req.body.generatedIdentity),
    createdAt: req.body.createdAt || new Date().toISOString(),
    source: "autozap-start",
  };
  leads.unshift(lead);
  ok(res, { saved: true, lead });
});

app.post("/api/start/export-autozap", (req, res) => {
  const payload = {
    ...req.body,
    createdAt: req.body.createdAt || new Date().toISOString(),
    source: "autozap-start",
  };
  exportsLog.unshift({ id: createId("exp"), ...payload });
  ok(res, { exported: true, payload });
});

app.get("/api/start/admin/metrics", requireAdminAuth, (req, res) => ok(res, adminMetrics()));
app.get("/api/start/admin/leads", requireAdminAuth, (req, res) => ok(res, leads.slice(0, 20)));
app.get("/api/start/admin/sessions", requireAdminAuth, (req, res) => ok(res, sessions.slice(0, 20)));

app.use((err, req, res, next) => {
  console.error(err);
  fail(res, 500, "SERVER_ERROR", "Erro interno.");
});

app.listen(port, () => {
  console.log(`AutoZap Start API mock listening on http://localhost:${port}`);
});

function ok(res, data) {
  res.json({ ok: true, data });
}

function fail(res, status, code, message) {
  res.status(status).json({ ok: false, code, error: message, message });
}

function rateLimitMock(req, res, next) {
  const key = req.ip || "local";
  const now = Date.now();
  const bucket = memoryUsage.get(key) || { count: 0, resetAt: now + 60_000, text: 0, image: 0 };
  if (now > bucket.resetAt) Object.assign(bucket, { count: 0, resetAt: now + 60_000, text: 0, image: 0 });
  bucket.count += 1;
  memoryUsage.set(key, bucket);
  if (bucket.count > 120) return fail(res, 429, "RATE_LIMITED", "Muitas tentativas. Tente novamente em instantes.");
  req.usageBucket = bucket;
  next();
}

function detectRiskMock(req, res, next) {
  const ua = req.get("user-agent") || "";
  req.riskLevel = /bot|crawler|spider/i.test(ua) ? "medium" : "low";
  next();
}

function usageGuardMock(type) {
  return (req, res, next) => {
    const bucket = req.usageBucket;
    if (!bucket) return next();
    if (type === "image") bucket.image += 1;
    if (type === "text") bucket.text += 1;
    if (bucket.image > 1) return fail(res, 429, "LIMIT_REACHED", "Salve sua loja gratuitamente para continuar.");
    if (bucket.text > 20) return fail(res, 429, "LIMIT_REACHED", "Salve sua loja gratuitamente para continuar.");
    next();
  };
}

async function verifyTurnstileMock(token) {
  // Futuro: validar token em https://challenges.cloudflare.com/turnstile/v0/siteverify
  return { ok: true, tokenPresent: Boolean(token || process.env.TURNSTILE_SECRET_KEY) };
}

function validateLeadPayload(req, res, next) {
  if (!req.body || !req.body.contact) return fail(res, 400, "INVALID_PAYLOAD", "Informe WhatsApp ou e-mail.");
  next();
}

function adminMetrics() {
  return {
    sessionsStarted: Math.max(248, sessions.length),
    storesCreated: 73,
    totalLeads: Math.max(31, leads.length),
    textGenerations: 326,
    imageGenerations: 86,
    estimatedCost: 148,
    abuseBlocks: 9,
    autoZapConversions: Math.max(18, exportsLog.length),
    growth: [42, 58, 64, 76, 91, 118, 137],
  };
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function titleCase(value) {
  return value.split(/\s+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}

function createAdminToken(payload) {
  const data = {
    username: payload.username,
    role: "admin",
    issuedAt: Date.now(),
    expiresAt: Date.now() + ADMIN_TOKEN_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  const signature = crypto.createHmac("sha256", ADMIN_AUTH_SECRET).update(encoded).digest("hex");
  return `${encoded}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return false;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return false;
  const expected = crypto.createHmac("sha256", ADMIN_AUTH_SECRET).update(encoded).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    const data = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return Boolean(data && data.role === "admin" && Number(data.expiresAt) > Date.now());
  } catch (error) {
    return false;
  }
}

function requireAdminAuth(req, res, next) {
  const header = req.get("x-admin-token") || "";
  const bearer = req.get("authorization") || "";
  const token = header || bearer.replace(/^Bearer\s+/i, "");
  if (!verifyAdminToken(token)) {
    return fail(res, 401, "ADMIN_AUTH_REQUIRED", "Acesso restrito. Faça login novamente.");
  }
  next();
}

function initials(value) {
  return String(value).split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word.charAt(0)).join("").toUpperCase() || "TC";
}

function capitalToNumber(value) {
  return {
    "Até R$ 1.000": 950,
    "R$ 1.000 a R$ 3.000": 2400,
    "R$ 3.000 a R$ 8.000": 6200,
    "Acima de R$ 8.000": 9800,
  }[value] || 2400;
}

function supplierList(categories, investment) {
  const base = [
    { name: "Distribuidor regional", fit: "Acessórios de giro rápido", checks: "CNPJ, nota fiscal, troca" },
    { name: "Atacado especializado", fit: "Películas e carregadores", checks: "Procedência e prazo" },
    { name: "Assistência parceira", fit: "Peças e serviços", checks: "Histórico e garantia" },
  ];
  if (categories.includes("Celulares") && investment >= 1200) base.unshift({ name: "Fornecedor homologado", fit: "Aparelhos novos e seminovos", checks: "IMEI, nota e garantia" });
  return base.slice(0, 4);
}
