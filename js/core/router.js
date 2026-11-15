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

  // বর্তমান পেজ কোন ডিরেক্টরিতে আছে, সেই অনুযায়ী prefix বের করা
  // যেমন: /student/dashboard.html -> '../', /login.html -> ''
  function basePrefix() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    // শেষ অংশটি ফাইল হলে বাদ দাও
    if (parts.length && parts[parts.length - 1].indexOf('.') !== -1) parts.pop();
    return parts.map(function () { return '../'; }).join('');
  }

  var SEMSRouter = {
    dashboards: DASHBOARDS,

    // ইউজারের রোল ও ভর্তি-অবস্থা অনুযায়ী গন্তব্য
    dashboardPath: function (user) {
      if (!user) return 'login.html';
      if (user.role === 'student' && !user.admissionCompleted) return 'admission.html';
      return DASHBOARDS[user.role] || DASHBOARDS.student;
    },

    // dashboardPath-কে বর্তমান পেজ থেকে সঠিক relative পাথে রূপান্তর
    goToDashboard: function (user) {
      window.location.replace(basePrefix() + this.dashboardPath(user));
    },

    goToLogin: function () {
      window.location.replace(basePrefix() + 'login.html');
    },

    goToAdmission: function () {
      window.location.replace(basePrefix() + 'admission.html');
    }
  };

  window.SEMSRouter = SEMSRouter;
})();
