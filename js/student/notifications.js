/* SEMS — js/student/notifications.js | Phase 2
 * নোটিফিকেশন কেন্দ্র: নোটিশ + আজকের ক্লাস + আসন্ন পরীক্ষার
 * রিমাইন্ডার এক জায়গায়। "সব পড়া হয়েছে" localStorage-এ চিহ্ন রাখে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('notifications'); } catch (e) { return; }

  var READ_KEY = 'sems_notifications_read_at';

  function render(items) {
    var wrap = document.getElementById('notificationsWrap');
    if (!wrap) return;
    if (!items.length) {
      wrap.innerHTML = SEMSStudent.emptyState('bell', 'কোনো নোটিফিকেশন নেই',
        'নতুন নোটিশ, ক্লাস বা পরীক্ষার রিমাইন্ডার এলে এখানে দেখা যাবে।');
      return;
    }
    var readAt = null;
    try { readAt = localStorage.getItem(READ_KEY); } catch (e) { readAt = null; }
    wrap.innerHTML = items.map(function (n) {
      var isNew = !readAt || (n.sortDate && new Date(n.sortDate).toISOString() > readAt);
      return '<div class="list-item"><h3>' + (isNew ? '<span class="unread-dot"></span>' : '') + SEMSStudent.esc(n.title) +
        ' <span class="badge ' + (n.kind === 'notice' ? 'badge-info' : (n.kind === 'class' ? 'badge-upcoming' : 'badge-exam')) + '">' +
        (n.kind === 'notice' ? 'নোটিশ' : (n.kind === 'class' ? 'ক্লাস' : 'পরীক্ষা')) + '</span></h3>' +
        '<p>' + SEMSStudent.esc(n.body || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.fmtDate(n.sortDate) + '</span></div></div>';
    }).join('');
  }

  try {
    var items = [];
    var notices = await SEMSStudent.getNotices();
    notices.slice(0, 10).forEach(function (n) {
      items.push({ kind: 'notice', title: n.title || 'নোটিশ', body: n.body || n.text || '', sortDate: n.createdAt || n.publishDate || n.date });
    });
    var profile = await SEMSStudent.getProfile(user);
    var batchId = profile.courseBatch || profile.batchId || '';
    var classes = await SEMSStudent.getClasses(batchId);
    classes.filter(function (c) {
      var d = SEMSStudent.toDate(c.date);
      return d && SEMSStudent.dateKey(d) === SEMSStudent.todayKey();
    }).forEach(function (c) {
      items.push({ kind: 'class', title: 'আজকের ক্লাস: ' + (c.subject || 'ক্লাস'), body: (c.startTime || '') + (c.endTime ? ' – ' + c.endTime : '') + (c.teacherName ? ' • ' + c.teacherName : ''), sortDate: c.date });
    });
    var exams = await SEMSStudent.getExams();
    exams.filter(function (ex) {
      var d = SEMSStudent.toDate(ex.date);
      return d && d >= new Date();
    }).slice(0, 5).forEach(function (ex) {
      items.push({ kind: 'exam', title: 'আসন্ন পরীক্ষা: ' + (ex.title || 'পরীক্ষা'), body: (ex.subject || '') + ' • ' + SEMSStudent.fmtDate(ex.date), sortDate: ex.date });
    });
    items.sort(function (a, b) {
      var da = SEMSStudent.toDate(a.sortDate) || new Date(0);
      var dbb = SEMSStudent.toDate(b.sortDate) || new Date(0);
      return dbb - da;
    });
    render(items);

    var btn = document.getElementById('markAllReadBtn');
    if (btn) {
      btn.addEventListener('click', function () {
        try { localStorage.setItem(READ_KEY, new Date().toISOString()); } catch (e) { /* ignore */ }
        if (window.SEMSToast) SEMSToast.success('সব নোটিফিকেশন পড়া হয়েছে বলে চিহ্নিত করা হয়েছে।');
        render(items);
      });
    }
  } catch (err) {
    console.warn('[SEMS] নোটিফিকেশন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('নোটিফিকেশন লোড করা যায়নি।');
  }
});
