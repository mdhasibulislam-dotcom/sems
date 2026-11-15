/* SEMS — js/components/loader.js | Phase 1
 * ফুল-স্ক্রিন লোডার দেখানো / লুকানো।
 * ব্যবহার: SEMSLoader.show(); ... SEMSLoader.hide();
 */
(function () {
  function getEl() { return document.getElementById('loader'); }

  var SEMSLoader = {
    show: function () {
      var el = getEl();
      if (el) { el.hidden = false; el.style.display = ''; }
    },
    hide: function () {
      var el = getEl();
      // style.display='none' ও দেওয়া হলো, কারণ পুরনো ক্যাশে থাকা
      // CSS-এ .loader-overlay { display:flex } hidden অ্যাট্রিবিউটকে
      // ওভাররাইড করে লোডার আটকে রাখছিল।
      if (el) { el.hidden = true; el.style.display = 'none'; }
    }
  };

  window.SEMSLoader = SEMSLoader;
})();
