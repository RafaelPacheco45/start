const fs = require("fs");
const path = require("path");
const tls = require("tls");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const expectedApiBaseUrl = "https://aip.autozap.log.br";
const expectedVersion = 'version: "0.3.0"';
const expectedMockMode = "mockMode: false";
const expectedMobileSteps = 7;

const files = [
  "index.html",
  "mobile.html",
  "desktop.html",
  "admin.html",
  "css/theme.css",
  "css/mobile.css",
  "css/desktop.css",
  "css/admin.css",
  "js/config.js",
  "js/router.js",
  "js/api.js",
  "js/mobile.js",
  "js/desktop.js",
  "js/admin.js",
  "js/healthcheck.js",
  "assets/autozap-logo.png",
  "assets/autozap-logo-mark.png",
  "assets/hero-autozap-start.png",
  "assets/start-hero-banner.png",
  "README.md",
  "AUTOZAP_START_FLOW_ALIGNMENT.md",
];

const htmlJsPairs = [
  ["mobile.html", "js/mobile.js"],
  ["desktop.html", "js/desktop.js"],
  ["admin.html", "js/admin.js"],
];

const jsCheckFiles = [
  "js/config.js",
  "js/api.js",
  "js/mobile.js",
  "js/desktop.js",
  "js/admin.js",
  "js/router.js",
  "js/healthcheck.js",
];

let failed = false;

if (tls.getCACertificates && tls.setDefaultCACertificates) {
  tls.setDefaultCACertificates(tls.getCACertificates("system"));
}

function fail(message) {
  failed = true;
  console.error(`FAIL ${message}`);
}

function pass(message) {
  console.log(`OK ${message}`);
}

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function findRequiredIds(js) {
  return [
    ...js.matchAll(/querySelector\("#([A-Za-z][^" .>:+~[\)]*)"\)/g),
    ...js.matchAll(/getElementById\("([A-Za-z][^" .>:+~[\)]*)"\)/g),
  ].map((match) => match[1]);
}

function checkFiles() {
  for (const file of files) {
    if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
  }
  pass("local files present");
}

function checkHtmlJsIds() {
  for (const [htmlFile, jsFile] of htmlJsPairs) {
    const html = read(htmlFile);
    const js = read(jsFile);
    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
    const missing = findRequiredIds(js).filter((id) => !ids.has(id));
    if (missing.length) fail(`${htmlFile} missing ids used by ${jsFile}: ${[...new Set(missing)].join(", ")}`);
  }
  pass("HTML ids align with page scripts");
}

function checkMobileFlow() {
  const mobile = read("mobile.html");
  const stepCount = (mobile.match(/<section class="step[^"]*" data-step="/g) || []).length;
  if (stepCount !== expectedMobileSteps) fail(`mobile should have ${expectedMobileSteps} user steps, found ${stepCount}`);
  pass("mobile flow step count aligned");
}

function checkConfig() {
  const config = read("js/config.js");
  if (!config.includes("AUTOZAP_START_CONFIG")) fail("config should expose AUTOZAP_START_CONFIG");
  if (!config.includes(expectedVersion)) fail("config version should be 0.3.0");
  if (!config.includes(expectedMockMode)) fail("mock mode should be false by default");
  if (!config.includes(`var AUTOZAP_API_BASE_URL = "${expectedApiBaseUrl}"`)) fail(`API base variable should remain ${expectedApiBaseUrl}`);
  if (!config.includes("apiBaseUrl: AUTOZAP_API_BASE_URL")) fail("apiBaseUrl should use AUTOZAP_API_BASE_URL");
  if (!config.includes("session: `${AUTOZAP_API_BASE_URL}/start/session`")) fail("session route should target API base /start/session");
  if (!config.includes("suppliers: `${AUTOZAP_API_BASE_URL}/start/suppliers`")) fail("suppliers route should target API base /start/suppliers");
  if (!config.includes("supplierProducts: `${AUTOZAP_API_BASE_URL}/start/suppliers/:id/products`")) fail("supplier products route should target API base /start/suppliers/:id/products");
  if (!config.includes("lead: `${AUTOZAP_API_BASE_URL}/start/lead`")) fail("lead route should target API base /start/lead");
  if (!config.includes("turnstileSiteKey")) fail("config should prepare Turnstile site key");
  pass("production config aligned");
}

function checkApiFacade() {
  const api = read("js/api.js");
  [
    "createAnonymousSession",
    "apiGetStartSuppliers",
    "apiGetStartSupplierProducts",
    "saveLead",
    "exportToAutoZap",
    "getAdminMetrics",
    "getRecentLeads",
    "getRecentSessions",
  ].forEach((fn) => {
    if (!api.includes(fn)) fail(`api.js missing ${fn}`);
  });
  if (!api.includes('return config.mockMode === true || useMock === "true" || useMock === "1"')) {
    fail("mock mode should require config.mockMode true or USE_MOCK");
  }
  pass("api facade aligned");
}

function checkNodeSyntax() {
  for (const file of jsCheckFiles) {
    execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" });
  }
  pass("node --check passed for JS files");
}

async function request(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${expectedApiBaseUrl}${pathname}`, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkPublicApi() {
  const health = await request("/health");
  if (health.status !== 200) fail(`/health expected 200, got ${health.status}`);

  const suppliers = await request("/start/suppliers");
  if (suppliers.status !== 200) fail(`/start/suppliers expected 200, got ${suppliers.status}`);

  const session = await request("/start/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "autozap-start-healthcheck" }),
  });
  if (session.status !== 200 && session.status !== 201) fail(`POST /start/session expected 200/201, got ${session.status}`);

  const cors = await request("/start/suppliers", {
    method: "OPTIONS",
    headers: {
      Origin: "https://start.autozap.log.br",
      "Access-Control-Request-Method": "GET",
    },
  });
  if (cors.status !== 200 && cors.status !== 204) fail(`OPTIONS /start/suppliers expected 200/204, got ${cors.status}`);

  pass("public API health checks passed");
}

async function main() {
  checkFiles();
  checkHtmlJsIds();
  checkMobileFlow();
  checkConfig();
  checkApiFacade();
  checkNodeSyntax();
  await checkPublicApi();

  if (failed) process.exit(1);
  console.log("AutoZap Start Healthcheck OK");
}

main().catch((error) => {
  fail(`healthcheck exception: ${error.message}`);
  process.exit(1);
});
