(function routeByDevice() {
  var width = window.innerWidth || document.documentElement.clientWidth || 1024;
  var ua = navigator.userAgent || "";
  var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua);
  var touchTablet = navigator.maxTouchPoints > 1 && width <= 1024;
  var basePath = (window.AUTOZAP_START_CONFIG && window.AUTOZAP_START_CONFIG.basePath) || "./";
  var page = width <= 768 || mobileUA || touchTablet ? "mobile.html" : "desktop.html";
  var target = basePath + page;

  try {
    window.location.replace(target + window.location.search + window.location.hash);
  } catch (error) {
    window.location.href = target;
  }
})();
