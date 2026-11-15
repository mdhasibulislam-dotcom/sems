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
      // নোটিফিকেশন পেজের লিংক: রোল ফোল্ডারের ভেতরে থাকলে সরাসরি,
      // রুট পেজে (যেমন admission.html) থাকলে রোলের ফোল্ডারসহ।
      var roleKey = user ? (user.role || '') : '';
      var inRoleFolder = window.location.pathname.indexOf('/student/') !== -1 ||
        window.location.pathname.indexOf('/teacher/') !== -1 ||
        window.location.pathname.indexOf('/admin/') !== -1;
      var notifUrl = inRoleFolder ? 'notifications.html' : (roleKey ? roleKey + '/notifications.html' : 'student/notifications.html');
      var showBadge = roleKey === 'student' || roleKey === 'teacher';
      root.className = 'sems-navbar';
      root.innerHTML =
        '<div class="container">' +
          '<a class="brand" href="#"><span class="brand-logo">S</span> SEMS</a>' +
          '<div class="nav-user">' +
            '<a class="nav-bell" href="' + notifUrl + '" title="নোটিফিকেশন" aria-label="নোটিফিকেশন">' +
              (window.SEMSIcons ? SEMSIcons.icon('bell', 'ic-sm') : '') +
              '<span class="nav-badge" id="navNotifBadge" hidden>0</span>' +
            '</a>' +
            (name ? '<span class="user-name">' + SEMSHelpers.escapeHtml(name) + '</span>' : '') +
            (role ? '<span class="role-badge">' + SEMSHelpers.escapeHtml(role) + '</span>' : '') +
            '<button class="nav-logout" type="button" id="navLogoutBtn">' + (window.SEMSIcons ? SEMSIcons.icon('logout', 'ic-sm') + ' ' : '') + 'লগআউট</button>' +
          '</div>' +
        '</div>';
      // অপঠিত সংখ্যা: শিক্ষার্থী/শিক্ষকের বেলায় ব্যাজে দেখানো হয়
      // (অ্যাডমিনের বেলায় ব্যাজ নেই — বেল শুধু admin/notifications.html-এ যায়)।
      // ব্যর্থ হলে চুপচাপ ব্যাজ লুকানো থাকে — নেভবার কখনো আটকায় না।
      if (showBadge && user && user.uid && window.SEMSNotifications) {
        try {
          SEMSNotifications.getUnreadCount(user.uid).then(function (count) {
            var badge = document.getElementById('navNotifBadge');
            if (!badge) return;
            if (count > 0) {
              var label = count > 99 ? '৯৯+' : String(count);
              if (window.SEMSHelpers && SEMSHelpers.toBnDigits) label = SEMSHelpers.toBnDigits(count > 99 ? '99+' : count);
              badge.textContent = label;
              badge.hidden = false;
            }
          }).catch(function () { /* ব্যাজ ছাড়াই চলবে */ });
        } catch (e) { /* ব্যাজ ছাড়াই চলবে */ }
      }
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
