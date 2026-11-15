/* SEMS — js/components/loader.js | Phase 1
 * ফুল-স্ক্রিন লোডার দেখানো / লুকানো।
 * ব্যবহার: SEMSLoader.show(); ... SEMSLoader.hide();
 */
(function () {
  function getEl() { return document.getElementById('loader'); }

  var SEMSLoader = {
    show: function () {
      var el = getEl();
      if (el) el.hidden = false;
    },
    hide: function () {
      var el = getEl();
      if (el) el.hidden = true;
    }
  };

  window.SEMSLoader = SEMSLoader;
})();
