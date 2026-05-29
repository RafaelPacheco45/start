const sessionRows = document.querySelector("#sessionRows");
const leadRows = document.querySelector("#leadRows");
const growthChart = document.querySelector("#growthChart");
const adminMeta = document.querySelector("#adminMeta");
const adminDashboard = document.querySelector("#adminDashboard");
const adminAuthPanel = document.querySelector("#adminAuthPanel");
const adminLoginForm = document.querySelector("#adminLoginForm");
const adminUsername = document.querySelector("#adminUsername");
const adminPassword = document.querySelector("#adminPassword");
const adminLoginMessage = document.querySelector("#adminLoginMessage");
const adminLogoutBtn = document.querySelector("#adminLogoutBtn");
const adminLockState = document.querySelector("#adminLockState");

const ADMIN_LOGIN_MESSAGE = "Dados privados. Entre com suas credenciais para continuar.";

function setText(selector, value) {
  const target = document.querySelector(selector);
  if (target) target.textContent = value;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value || 0);
}

function getMetricsFallback() {
  return {
    sessionsStarted: 0,
    storesCreated: 0,
    totalLeads: 0,
    textGenerations: 0,
    imageGenerations: 0,
    estimatedCost: 0,
    abuseBlocks: 0,
    autoZapConversions: 0,
    growth: [0, 0, 0, 0, 0, 0, 0],
  };
}

function renderBars(values) {
  growthChart.innerHTML = "";
  values.forEach((value) => {
    const bar = document.createElement("i");
    bar.style.height = `${Math.max(10, value)}%`;
    bar.title = `${value} sessões`;
    growthChart.appendChild(bar);
  });
}

function renderEmptyRow(target, cols, text) {
  const row = document.createElement("tr");
  row.className = "empty-row";
  row.innerHTML = `<td colspan="${cols}">${text}</td>`;
  target.appendChild(row);
}

function renderLeadRows(leads) {
  leadRows.innerHTML = "";
  if (!leads.length) {
    renderEmptyRow(leadRows, 5, "Nenhum lead salvo ainda.");
    return;
  }
  leads.forEach((lead) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${lead.contact || "-"}</td><td>${lead.contactType || "-"}</td><td>${lead.storeName || "-"}</td><td>${lead.city || "-"}</td><td>${lead.progress || 0}%</td>`;
    leadRows.appendChild(row);
  });
}

function renderSessionRows(sessions) {
  sessionRows.innerHTML = "";
  if (!sessions.length) {
    renderEmptyRow(sessionRows, 5, "Nenhuma sessão armazenada ainda.");
    return;
  }
  sessions.forEach((session) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${session.id || "-"}</td><td>${session.city || "-"}</td><td>${session.store || session.storeName || "-"}</td><td>${session.status || "Sessão iniciada"}</td><td>${session.risk || session.riskLevel || "Baixo"}</td>`;
    sessionRows.appendChild(row);
  });
}

function setAdminMessage(message, type = "info") {
  if (!adminLoginMessage) return;
  adminLoginMessage.hidden = !message;
  adminLoginMessage.textContent = message || "";
  adminLoginMessage.style.color = type === "error" ? "#c2410c" : "#6f768e";
}

function setDashboardVisible(visible) {
  if (adminDashboard) adminDashboard.hidden = !visible;
  if (adminAuthPanel) adminAuthPanel.hidden = visible;
  if (adminLockState) adminLockState.textContent = visible ? "Autenticado" : "Bloqueado";
}

async function loadAdminData() {
  const [metricsResponse, leadsResponse, sessionsResponse] = await Promise.all([
    AutoZapAPI.getAdminMetrics(),
    AutoZapAPI.getRecentLeads(),
    AutoZapAPI.getRecentSessions(),
  ]);

  if (isUnauthorized(metricsResponse) || isUnauthorized(leadsResponse) || isUnauthorized(sessionsResponse)) {
    AutoZapAPI.clearAdminAuthToken();
    setDashboardVisible(false);
    setAdminMessage(ADMIN_LOGIN_MESSAGE, "error");
    return false;
  }

  const metrics = metricsResponse.data || metricsResponse || getMetricsFallback();
  const leads = leadsResponse.data || leadsResponse || [];
  const sessions = sessionsResponse.data || sessionsResponse || [];

  setText("#metricSessions", metrics.sessionsStarted);
  setText("#metricStores", metrics.storesCreated);
  setText("#metricLeads", metrics.totalLeads);
  setText("#metricText", metrics.textGenerations);
  setText("#metricImages", metrics.imageGenerations);
  setText("#metricCost", formatCurrency(metrics.estimatedCost));
  setText("#metricBlocks", metrics.abuseBlocks);
  setText("#metricConversions", metrics.autoZapConversions);
  renderBars(metrics.growth || []);
  renderLeadRows(leads);
  renderSessionRows(sessions);

  if (adminMeta) {
    const config = AutoZapAPI.config || window.AUTOZAP_START_CONFIG || {};
    adminMeta.textContent = `v${config.version || "0.3.0"} · acesso autenticado · ${leads.length} leads carregados`;
  }
  setDashboardVisible(true);
  setAdminMessage("", "info");
  return true;
}

function isUnauthorized(response) {
  return response && response.status === 401;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const username = (adminUsername && adminUsername.value || "").trim();
  const password = adminPassword ? adminPassword.value : "";
  if (!username || !password) {
    setAdminMessage("Informe usuário e senha para entrar.", "error");
    return;
  }
  setAdminMessage("Validando credenciais...", "info");
  const response = await AutoZapAPI.adminLogin({ username, password });
  if (!response || !response.ok) {
    AutoZapAPI.clearAdminAuthToken();
    setDashboardVisible(false);
    setAdminMessage("Login inválido ou sessão expirada.", "error");
    return;
  }
  if (adminPassword) adminPassword.value = "";
  await loadAdminData();
}

function handleLogout() {
  AutoZapAPI.clearAdminAuthToken();
  if (adminPassword) adminPassword.value = "";
  setDashboardVisible(false);
  setAdminMessage(ADMIN_LOGIN_MESSAGE, "error");
  if (adminUsername) adminUsername.focus();
}

async function bootAdmin() {
  setDashboardVisible(false);
  if (AutoZapAPI.hasAdminAuthToken && AutoZapAPI.hasAdminAuthToken()) {
    const loaded = await loadAdminData();
    if (loaded) return;
  }
  setAdminMessage(ADMIN_LOGIN_MESSAGE, "error");
}

if (adminLoginForm) adminLoginForm.addEventListener("submit", handleAdminLogin);
if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", handleLogout);

bootAdmin();
