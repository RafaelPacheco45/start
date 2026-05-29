(function routeByDevice() {
  var width = window.innerWidth || document.documentElement.clientWidth || 1024;
  var ua = navigator.userAgent || "";
  var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  var touchTablet = navigator.maxTouchPoints > 1 && width <= 1024;
  var config = window.AUTOZAP_START_CONFIG || window.AutoZapConfig || {};
  var basePath = config.basePath || "./";
  if (!/\/$/.test(basePath)) basePath += "/";
  var currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  var page = width <= 768 || mobileUA || touchTablet ? "mobile.html" : "desktop.html";
  if (currentPage === "mobile.html" || currentPage === "desktop.html") return;
  var target = basePath + page;

  try {
    window.location.replace(target + window.location.search + window.location.hash);
  } catch (error) {
    window.location.href = target + window.location.search + window.location.hash;
  }
})();
