/* SEMS — js/components/toast.js | Phase 1
 * ছোট নোটিফিকেশন Toast — উপরে ডানদিকে কয়েক সেকেন্ড দেখায়।
 * ব্যবহার: SEMSToast.success('...') / .error('...') / .info('...')
 */
(function () {
  function root() {
    var el = document.getElementById('toastRoot');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toastRoot';
      document.body.appendChild(el);
    }
    return el;
  }

  function show(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    root().appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  var SEMSToast = {
    success: function (msg) { show(msg, 'success'); },
    error: function (msg) { show(msg, 'error'); },
    info: function (msg) { show(msg, 'info'); }
  };

  window.SEMSToast = SEMSToast;
})();
