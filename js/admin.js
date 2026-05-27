const sessionRows = document.querySelector("#sessionRows");
const leadRows = document.querySelector("#leadRows");
const growthChart = document.querySelector("#growthChart");
const adminMeta = document.querySelector("#adminMeta");

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

async function renderAdmin() {
  const [metricsResponse, leadsResponse, sessionsResponse] = await Promise.all([
    AutoZapAPI.getAdminMetrics(),
    AutoZapAPI.getRecentLeads(),
    AutoZapAPI.getRecentSessions(),
  ]);

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
    const useMock = String(localStorage.getItem("USE_MOCK") || "").toLowerCase();
    const mode = config.mockMode === true || useMock === "1" || useMock === "true" ? "mock local" : "API real";
    adminMeta.textContent = `v${config.version || "0.2.0"} · ${mode} · ${leads.length} leads carregados`;
  }
}

renderAdmin();
