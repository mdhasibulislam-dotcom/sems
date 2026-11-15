/* SEMS — js/components/navbar.js | Phase 1
 * উপরের নেভবার: SEMS ব্র্যান্ড, ইউজারের নাম + রোল ব্যাজ, লগআউট বাটন।
 */
(function () {
  var ROLE_LABEL = { student: 'শিক্ষার্থী', teacher: 'শিক্ষক', admin: 'অ্যাডমিন' };

  var SEMSNavbar = {
    render: function (rootId, user) {
      var root = document.getElementById(rootId);
      if (!root) return;
      var name = user ? (user.displayName || user.name || user.email || '') : '';
      var role = user ? (ROLE_LABEL[user.role] || user.role || '') : '';
      root.className = 'sems-navbar';
      root.innerHTML =
        '<div class="container">' +
          '<a class="brand" href="#"><span class="brand-logo">S</span> SEMS</a>' +
          '<div class="nav-user">' +
            (name ? '<span class="user-name">' + SEMSHelpers.escapeHtml(name) + '</span>' : '') +
            (role ? '<span class="role-badge">' + SEMSHelpers.escapeHtml(role) + '</span>' : '') +
            '<button class="nav-logout" type="button" id="navLogoutBtn">' + (window.SEMSIcons ? SEMSIcons.icon('logout', 'ic-sm') + ' ' : '') + 'লগআউট</button>' +
          '</div>' +
        '</div>';
      var btn = document.getElementById('navLogoutBtn');
      if (btn) {
        btn.addEventListener('click', async function () {
          await SEMSAuth.signOut();
          var prefix = window.location.pathname.indexOf('/student/') !== -1 ||
            window.location.pathname.indexOf('/teacher/') !== -1 ||
            window.location.pathname.indexOf('/admin/') !== -1 ? '../' : '';
          window.location.replace(prefix + 'login.html');
        });
      }
    }
  };

  window.SEMSNavbar = SEMSNavbar;
})();
