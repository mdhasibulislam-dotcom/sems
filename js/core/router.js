/* SEMS — js/core/router.js | Phase 1
 * রোল অনুযায়ী ড্যাশবোর্ডের পাথ ঠিক করা + সহজ রিডাইরেক্ট।
 * পাথগুলো সাইট রুটের সাপেক্ষে নয়, বর্তমান পেজের সাপেক্ষে নয় —
 * SEMSRouter.dashboardPath() সবসময় রুট-আপেক্ষিক পাথ দেয়।
 */
(function () {
  var DASHBOARDS = {
    admin: 'admin/dashboard.html',
    teacher: 'teacher/dashboard.html',
    student: 'student/dashboard.html'
  };

  // সাইটের রুট (যেমন GitHub Pages-এ /sems/) — router.js স্ক্রিপ্টের
  // নিজের URL থেকে বের করা হয়, তাই পেজ যত গভীরেই থাকুক ঠিক থাকে।
  // আগের basePrefix() বাগ: পেজের গভীরতা গুনে '../' বসাতো, ফলে
  // /sems/student/dashboard.html থেকে গেলে /login.html (সাইটের
  // বাইরে) হয়ে 404 আসতো।
  var SITE_ROOT = '/';
  try {
    var src = (document.currentScript && document.currentScript.src) || '';
    if (src) {
      var u = new URL(src, window.location.href);
      SITE_ROOT = u.pathname.replace(/js\/core\/router\.js$/, '');
      if (SITE_ROOT.charAt(SITE_ROOT.length - 1) !== '/') SITE_ROOT += '/';
    }
  } catch (e) { SITE_ROOT = '/'; }

  var SEMSRouter = {
    dashboards: DASHBOARDS,

    // ইউজারের রোল ও ভর্তি-অবস্থা অনুযায়ী গন্তব্য
    dashboardPath: function (user) {
      if (!user) return 'login.html';
      if (user.role === 'student' && !user.admissionCompleted) return 'admission.html';
      return DASHBOARDS[user.role] || DASHBOARDS.student;
    },

    // dashboardPath-কে সাইট রুট থেকে সঠিক পাথে রূপান্তর
    goToDashboard: function (user) {
      window.location.replace(SITE_ROOT + this.dashboardPath(user));
    },

    goToLogin: function () {
      window.location.replace(SITE_ROOT + 'login.html');
    },

    goToAdmission: function () {
      window.location.replace(SITE_ROOT + 'admission.html');
    }
  };

  window.SEMSRouter = SEMSRouter;
})();
