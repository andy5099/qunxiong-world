(function () {
  'use strict';
  var phase = 'BOOT';
  var panel = null;

  function getPanel() {
    if (!panel) panel = document.getElementById('boot-error');
    return panel;
  }

  function showError(error) {
    var target = getPanel();
    if (!target) return;
    target.hidden = false;
    target.setAttribute('data-phase', phase);
    var detail = target.querySelector('[data-boot-detail]');
    if (detail) detail.textContent = error && error.message ? error.message : '啟動程序發生錯誤';
  }

  window.__QX_BOOT__ = {
    mark: function (nextPhase) { phase = nextPhase; },
    fail: showError,
    ready: function () {
      phase = 'READY';
      var target = getPanel();
      if (target) target.hidden = true;
    }
  };

  window.addEventListener('error', function (event) {
    showError(event.error || new Error(event.message || '資源載入失敗'));
  });
  window.addEventListener('unhandledrejection', function (event) {
    showError(event.reason || new Error('啟動程序失敗'));
  });
}());
