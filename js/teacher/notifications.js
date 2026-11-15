/* SEMS — js/teacher/notifications.js | Phase 5 (Notifications)
 * শিক্ষকের নোটিফিকেশন কেন্দ্র: `notifications` কালেকশন থেকে
 * নিজের নোটিফিকেশন পড়া হয় (অপঠিত আগে, তারপর নতুন থেকে পুরনো)।
 * ক্লিক করলে পড়া হয়েছে বলে চিহ্নিত হয়ে লিংকের পেজে যায়;
 * "সব পড়া হয়েছে" বোতামে সবগুলো একসাথে চিহ্নিত হয়।
 * (শিক্ষার্থী পেজের মতোই — শুধু SEMSTeacher ব্যবহার করে।)
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('notifications'); } catch (e) { return; }

  function typeIcon(type) {
    return { notice: 'megaphone', lecture: 'book', assignment: 'edit', exam: 'clipboard', result: 'trophy' }[type] || 'bell';
  }
  function typeLabel(type) {
    return window.SEMSNotifications ? SEMSNotifications.typeLabel(type) : 'নোটিফিকেশন';
  }
  function fmtWhen(n) {
    var d = SEMSTeacher.toDate(n.createdAt);
    return d ? SEMSTeacher.fmtDate(d.toISOString()) : '';
  }

  function render(items) {
    var wrap = document.getElementById('notificationsWrap');
    if (!wrap) return;
    if (!items.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('bell', 'কোনো নোটিফিকেশন নেই',
        'নতুন নোটিশ বা অ্যাসাইনমেন্ট জমা এলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = items.map(function (n) {
      return '<div class="list-item' + (n.read ? '' : ' notif-unread') + '" data-id="' + SEMSTeacher.esc(n.id) + '" data-link="' + SEMSTeacher.esc(n.link || '') + '" role="button" tabindex="0">' +
        '<h3>' + (!n.read ? '<span class="unread-dot"></span>' : '') + SEMSTeacher.icon(typeIcon(n.type)) + ' ' + SEMSTeacher.esc(n.title) +
        ' <span class="badge badge-info">' + SEMSTeacher.esc(typeLabel(n.type)) + '</span></h3>' +
        (n.body ? '<p>' + SEMSTeacher.esc(n.body) + '</p>' : '') +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.esc(fmtWhen(n)) + '</span>' +
        (n.read ? '<span>পড়া হয়েছে</span>' : '<span>নতুন</span>') + '</div></div>';
    }).join('');
    wrap.querySelectorAll('.list-item[data-id]').forEach(function (el) {
      function openIt() {
        var id = el.getAttribute('data-id');
        var link = el.getAttribute('data-link');
        el.classList.remove('notif-unread');
        var dot = el.querySelector('.unread-dot');
        if (dot) dot.remove();
        if (window.SEMSNotifications) {
          SEMSNotifications.markRead(id).catch(function (e) {
            console.warn('[SEMS] পড়া চিহ্ন দিতে ব্যর্থ:', e && e.message);
          });
        }
        if (link) window.location.href = link;
      }
      el.addEventListener('click', openIt);
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openIt(); }
      });
    });
  }

  try {
    var items = window.SEMSNotifications
      ? await SEMSNotifications.getMyNotifications(user.uid)
      : [];
    render(items);

    var btn = document.getElementById('markAllReadBtn');
    if (btn) {
      btn.addEventListener('click', async function () {
        try {
          if (window.SEMSNotifications) await SEMSNotifications.markAllRead(user.uid);
          items.forEach(function (n) { n.read = true; });
          render(items);
          if (window.SEMSToast) SEMSToast.success('সব নোটিফিকেশন পড়া হয়েছে বলে চিহ্নিত করা হয়েছে।');
        } catch (err) {
          console.warn('[SEMS] সব পড়া চিহ্ন দিতে ব্যর্থ:', err && err.message);
          if (window.SEMSToast) SEMSToast.error('চিহ্নিত করা যায়নি। আবার চেষ্টা করুন।');
        }
      });
    }
  } catch (err) {
    console.warn('[SEMS] নোটিফিকেশন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('নোটিফিকেশন লোড করা যায়নি।');
  }
});
