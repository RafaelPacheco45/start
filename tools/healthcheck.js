const fs = require("fs");
const path = require("path");
const tls = require("tls");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const expectedApiBaseUrl = "https://aip.autozap.log.br";
const expectedVersion = 'version: "0.3.0"';
const expectedMockMode = "mockMode: false";
const expectedSteps = 7;
const mode = process.argv.includes("--remote") ? "remote" : "local";

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
  "tools/healthcheck.js",
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

function info(message) {
  console.log(`INFO ${message}`);
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
    const missing = [...new Set(findRequiredIds(js).filter((id) => !ids.has(id)))];
    if (missing.length) fail(`${htmlFile} missing ids used by ${jsFile}: ${missing.join(", ")}`);
  }
  pass("HTML ids align with page scripts");
}

function checkFlowSteps() {
  const mobile = read("mobile.html");
  const mobileCount = (mobile.match(/<section class="step[^"]*" data-step="/g) || []).length;
  if (mobileCount !== expectedSteps) fail(`mobile should have ${expectedSteps} user steps, found ${mobileCount}`);

  const desktop = read("js/desktop.js");
  const desktopMatch = desktop.match(/const desktopSteps = \[([\s\S]*?)\];/);
  const desktopCount = desktopMatch ? (desktopMatch[1].match(/\{\s*title:/g) || []).length : 0;
  if (desktopCount !== expectedSteps) fail(`desktop should have ${expectedSteps} user steps, found ${desktopCount}`);
  pass("mobile and desktop flow step counts aligned");
}

function checkConfig() {
  const config = read("js/config.js");
  const api = read("js/api.js");
  if (!config.includes("AUTOZAP_START_CONFIG")) fail("config should expose AUTOZAP_START_CONFIG");
  if (!config.includes(expectedVersion)) fail("config version should be 0.3.0");
  if (!config.includes(expectedMockMode)) fail("mockMode should be false by default");
  if (!config.includes(`var AUTOZAP_API_BASE_URL = "${expectedApiBaseUrl}"`)) fail(`API base variable should be ${expectedApiBaseUrl}`);
  if (!config.includes("apiBaseUrl: AUTOZAP_API_BASE_URL")) fail("apiBaseUrl should use AUTOZAP_API_BASE_URL");
  if (!config.includes("adminLogin: `${AUTOZAP_API_BASE_URL}/start/admin/login`")) fail("admin login route should be configured");
  if (!api.includes(`const DEFAULT_API_BASE_URL = "${expectedApiBaseUrl}"`)) fail(`api fallback should be ${expectedApiBaseUrl}`);
  if (config.includes("https://api.autozap.log.br") || api.includes("https://api.autozap.log.br")) fail("frontend code still references api.autozap.log.br");
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
    return await fetch(`${expectedApiBaseUrl}${pathname}`, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function remoteStep(label, task) {
  try {
    await task();
    pass(label);
  } catch (error) {
    fail(`${label}: falha externa ao acessar ${expectedApiBaseUrl} (${error.name || "Error"}: ${error.message})`);
  }
}

async function checkPublicApi() {
  await remoteStep("GET /health", async () => {
    const response = await request("/health");
    if (response.status !== 200) throw new Error(`expected 200, got ${response.status}`);
  });

  await remoteStep("GET /start/suppliers", async () => {
    const response = await request("/start/suppliers");
    if (response.status !== 200) throw new Error(`expected 200, got ${response.status}`);
  });

  await remoteStep("POST /start/session", async () => {
    const response = await request("/start/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "autozap-start-healthcheck" }),
    });
    if (response.status !== 200 && response.status !== 201) throw new Error(`expected 200/201, got ${response.status}`);
  });

  await remoteStep("CORS OPTIONS /start/suppliers", async () => {
    const response = await request("/start/suppliers", {
      method: "OPTIONS",
      headers: {
        Origin: "https://start.autozap.log.br",
        "Access-Control-Request-Method": "GET",
      },
    });
    if (response.status !== 200 && response.status !== 204) throw new Error(`expected 200/204, got ${response.status}`);
    const allowOrigin = response.headers.get("access-control-allow-origin") || "";
    if (!allowOrigin) throw new Error("missing access-control-allow-origin");
  });
}

async function main() {
  checkFiles();
  checkHtmlJsIds();
  checkFlowSteps();
  checkConfig();
  checkApiFacade();
  checkNodeSyntax();

  if (mode === "remote") {
    await checkPublicApi();
  } else {
    info("remote API checks skipped in --local mode; run node tools/healthcheck.js --remote to validate backend and CORS");
  }

  if (failed) process.exit(1);
  console.log(`AutoZap Start Healthcheck OK (${mode})`);
}

main().catch((error) => {
  fail(`healthcheck exception: ${error.message}`);
  process.exit(1);
});

