/* SEMS — js/components/modal.js | Phase 1
 * সাধারণ মোডাল (নিশ্চিতকরণ ডায়ালগ ইত্যাদি)।
 * ব্যবহার: SEMSModal.confirm({ title, message, okText, cancelText }).then(yes => ...)
 */
(function () {
  function closeModal(overlay) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  var SEMSModal = {
    confirm: function (opts) {
      opts = opts || {};
      return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML =
          '<div class="modal-box" role="dialog" aria-modal="true">' +
            '<h3>' + SEMSHelpers.escapeHtml(opts.title || 'নিশ্চিত করুন') + '</h3>' +
            '<p>' + SEMSHelpers.escapeHtml(opts.message || '') + '</p>' +
            '<div class="modal-actions">' +
              (opts.cancelText ? '<button type="button" class="btn btn-outline" data-act="cancel">' +
                SEMSHelpers.escapeHtml(opts.cancelText) + '</button>' : '') +
              '<button type="button" class="btn btn-primary" data-act="ok">' +
                SEMSHelpers.escapeHtml(opts.okText || 'ঠিক আছে') + '</button>' +
            '</div>' +
          '</div>';
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) { closeModal(overlay); resolve(false); }
          var act = e.target.getAttribute && e.target.getAttribute('data-act');
          if (act === 'ok') { closeModal(overlay); resolve(true); }
          if (act === 'cancel') { closeModal(overlay); resolve(false); }
        });
        document.body.appendChild(overlay);
      });
    },

    alert: function (title, message) {
      return this.confirm({ title: title, message: message, okText: 'ঠিক আছে', cancelText: '' })
        .catch(function () { return true; });
    }
  };

  window.SEMSModal = SEMSModal;
})();
