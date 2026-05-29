(function autoZapStartHealthcheck() {
  const config = window.AUTOZAP_START_CONFIG || window.AutoZapConfig;
  const checks = {
    localStorage: false,
    configLoaded: Boolean(config),
    apiLoaded: typeof AutoZapAPI !== "undefined",
    mockMode: config ? config.mockMode === true : false,
    version: config ? config.version : null,
    backendEndpoint: config && config.apiBaseUrl ? `${config.apiBaseUrl}/start/session` : "",
  };

  try {
    localStorage.setItem("__azs_healthcheck", "1");
    localStorage.removeItem("__azs_healthcheck");
    checks.localStorage = true;
  } catch (error) {
    checks.localStorage = false;
  }

  console.log("AutoZap Start Healthcheck OK", checks);
})();
