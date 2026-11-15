/* SEMS — js/student/notifications.js | Phase 5 (Notifications)
 * নোটিফিকেশন কেন্দ্র: `notifications` কালেকশন থেকে নিজের
 * নোটিফিকেশন পড়া হয় (অপঠিত আগে, তারপর নতুন থেকে পুরনো)।
 * ক্লিক করলে পড়া হয়েছে বলে চিহ্নিত হয়ে লিংকের পেজে যায়;
 * "সব পড়া হয়েছে" বোতামে সবগুলো একসাথে চিহ্নিত হয়।
 * পুরনো localStorage-ভিত্তিক রিমাইন্ডার (Phase 2) বাদ দেওয়া
 * হয়েছে — এখন আসল ঘটনার (নোটিশ/লেকচার/পরীক্ষা/রেজাল্ট)
 * নোটিফিকেশন আসে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('notifications'); } catch (e) { return; }

  function typeIcon(type) {
    return { notice: 'megaphone', lecture: 'book', assignment: 'edit', exam: 'clipboard', result: 'trophy' }[type] || 'bell';
  }
  function typeLabel(type) {
    return window.SEMSNotifications ? SEMSNotifications.typeLabel(type) : 'নোটিফিকেশন';
  }
  function fmtWhen(n) {
    var d = SEMSStudent.toDate(n.createdAt);
    return d ? SEMSStudent.fmtDate(d.toISOString()) : '';
  }

  function render(items) {
    var wrap = document.getElementById('notificationsWrap');
    if (!wrap) return;
    if (!items.length) {
      wrap.innerHTML = SEMSStudent.emptyState('bell', 'কোনো নোটিফিকেশন নেই',
        'নতুন নোটিশ, লেকচার, অ্যাসাইনমেন্ট, পরীক্ষা বা রেজাল্ট এলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = items.map(function (n) {
      var inner = '<div class="list-item' + (n.read ? '' : ' notif-unread') + '" data-id="' + SEMSStudent.esc(n.id) + '" data-link="' + SEMSStudent.esc(n.link || '') + '" role="button" tabindex="0">' +
        '<h3>' + (!n.read ? '<span class="unread-dot"></span>' : '') + SEMSStudent.icon(typeIcon(n.type)) + ' ' + SEMSStudent.esc(n.title) +
        ' <span class="badge badge-info">' + SEMSStudent.esc(typeLabel(n.type)) + '</span></h3>' +
        (n.body ? '<p>' + SEMSStudent.esc(n.body) + '</p>' : '') +
        '<div class="list-meta"><span>' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.esc(fmtWhen(n)) + '</span>' +
        (n.read ? '<span>পড়া হয়েছে</span>' : '<span>নতুন</span>') + '</div></div>';
      return inner;
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
