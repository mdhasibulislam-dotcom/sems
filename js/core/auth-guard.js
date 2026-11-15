/* SEMS — js/core/auth-guard.js | Phase 1
 * auth-guard: লগইন না করা থাকলে login.html-এ পাঠিয়ে দেয়।
 * লগইন করা থাকলে ইউজার অবজেক্ট ফেরত দেয়।
 */
(function () {
  var SEMSAuthGuard = {
    // লগইন আবশ্যক — না থাকলে লগইন পেজে রিডাইরেক্ট
    requireAuth: async function () {
      var user = await SEMSAuth.getCurrentUser();
      if (!user) {
        SEMSRouter.goToLogin();
        throw new Error('not-authenticated');
      }
      return user;
    }
  };

  window.SEMSAuthGuard = SEMSAuthGuard;
})();
