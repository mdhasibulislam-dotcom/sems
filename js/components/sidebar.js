/* SEMS — js/components/sidebar.js | Phase 1
 * সাইডবার কম্পোনেন্ট — Phase 2/3/4-এ রোল অনুযায়ী মেনু যুক্ত হবে।
 * এখন শুধু বেসিক কাঠামো: রোল অনুযায়ী ড্যাশবোর্ড লিংক।
 */
(function () {
  var MENUS = {
    student: [
      { label: '🏠 ড্যাশবোর্ড', href: 'dashboard.html', active: true }
      // Phase 2: রুটিন, লেকচার, নোটিশ, উপস্থিতি, রেজাল্ট, প্রোফাইল
    ],
    teacher: [
      { label: '🏠 ড্যাশবোর্ড', href: 'dashboard.html', active: true }
      // Phase 3: ব্যাচ, ক্লাস, লেকচার, উপস্থিতি, নম্বর, অ্যাসাইনমেন্ট
    ],
    admin: [
      { label: '🏠 ড্যাশবোর্ড', href: 'dashboard.html', active: true }
      // Phase 4: রুটিন, ব্যাচ, লেকচার, নোটিশ, পরীক্ষা, শিক্ষার্থী, শিক্ষক, সেটিংস
    ]
  };

  var SEMSSidebar = {
    render: function (rootId, user) {
      var root = document.getElementById(rootId);
      if (!root || !user) return;
      var items = MENUS[user.role] || MENUS.student;
      root.className = 'sems-sidebar';
      root.innerHTML = items.map(function (it) {
        return '<a href="' + it.href + '"' + (it.active ? ' class="active"' : '') + '>' +
          SEMSHelpers.escapeHtml(it.label) + '</a>';
      }).join('');
    }
  };

  window.SEMSSidebar = SEMSSidebar;
})();
