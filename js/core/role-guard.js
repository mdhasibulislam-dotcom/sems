/* SEMS — js/core/role-guard.js | Phase 1
 * role-guard: নির্দিষ্ট রোলের ইউজার ছাড়া পেজে ঢুকতে দেয় না।
 * - লগইন না করা থাকলে -> login.html
 * - রোল না মিললে -> নিজের রোলের ড্যাশবোর্ডে পাঠিয়ে দেয়
 * - শিক্ষার্থীর ভর্তি ফরম শেষ না হলে -> admission.html
 *   (তবে admission.html পেজ নিজে এই চেকটি বাদ দেয় — তা না হলে
 *   লুপ তৈরি হতো; admission পেজে শুধু role='student' চেক হয়।)
 */
(function () {
  var SEMSRoleGuard = {
    requireRole: async function (role) {
      var user = await SEMSAuthGuard.requireAuth();

      if (user.role !== role) {
        // ভুল রোল: নিজের ড্যাশবোর্ডে পাঠাও
        SEMSRouter.goToDashboard(user);
        throw new Error('wrong-role');
      }

      // শিক্ষার্থী: ভর্তি ফরম শেষ না হলে ড্যাশবোর্ডে ঢুকতে দেবে না
      if (role === 'student' && !user.admissionCompleted) {
        var onAdmissionPage = window.location.pathname.indexOf('admission.html') !== -1;
        if (!onAdmissionPage) {
          SEMSRouter.goToAdmission();
          throw new Error('admission-incomplete');
        }
      }

      return user;
    }
  };

  window.SEMSRoleGuard = SEMSRoleGuard;
})();
