/* SEMS — js/admin/teacher-requests.js
 * শিক্ষক আবেদন: বাকি আবেদন অনুমোদন/বাতিল। অনুমোদনে শুধু
 * teacherApplications ডকের status 'approved' হয় — এরপর
 * আবেদনকারী একই ইমেইল দিয়ে রেজিস্টার করলে auth.js তাকে
 * teacher রোল দিয়ে দেয়। আগে রেজিস্টার করা থাকলে
 * add-teacher.html দিয়ে role বদলাতে হয়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('teacher-requests'); } catch (e) { return; }
  var applications = [];
  function render() {
    var filter = document.getElementById('statusFilter').value;
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    var wrap = document.getElementById('requestList');
    var list = applications.filter(function (a) {
      if (filter === 'pending' && (a.status || 'pending') !== 'pending') return false;
      if (filter === 'approved' && a.status !== 'approved') return false;
      if (filter === 'rejected' && a.status !== 'rejected') return false;
      if (q) {
        var hay = ((a.fullName || '') + ' ' + (a.email || '') + ' ' + (a.subject || '') +
          ' ' + ((a.subjects || []).join(' '))).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('user', 'কোনো আবেদন নেই', 'নতুন শিক্ষক আবেদন এলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = list.map(function (a) {
      var st = a.status || 'pending';
      var badge = st === 'approved' ? 'badge-approved' : (st === 'rejected' ? 'badge-rejected' : 'badge-pending');
      var badgeTxt = st === 'approved' ? 'অনুমোদিত' : (st === 'rejected' ? 'বাতিল' : 'বাকি');
      var subjects = a.subject || ((a.subjects || []).join(', '));
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(a.fullName || 'আবেদনকারী') + '</h3>' +
        '<p>' + SEMSAdmin.esc(a.email || '') + ' · ' + SEMSAdmin.esc(a.mobile || '') + '</p>' +
        '<p>' + SEMSAdmin.esc(subjects) + (a.qualification ? ' · ' + SEMSAdmin.esc(a.qualification) : '') + '</p>' +
        '<p>' + SEMSAdmin.esc(a.experience ? 'অভিজ্ঞতা: ' + a.experience : '') +
        (a.institution ? ' · ' + SEMSAdmin.esc(a.institution) : '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(a.createdAt)) + '</span>' +
        '<span class="badge ' + badge + '">' + badgeTxt + '</span></div>' +
        (st === 'pending' ? '<div class="list-actions">' +
          '<button class="btn btn-sm" data-act="approve" data-id="' + SEMSAdmin.esc(a.id) + '">অনুমোদন করুন</button>' +
          '<button class="btn btn-sm btn-danger" data-act="reject" data-id="' + SEMSAdmin.esc(a.id) + '">বাতিল করুন</button>' +
          '</div>' : '') +
        (st === 'approved' ? '<p class="muted">অনুমোদিত — আবেদনকারী এই ইমেইল দিয়ে রেজিস্টার করলেই শিক্ষকের অ্যাকাউন্ট পাবেন।</p>' : '') +
        '</div>';
    }).join('');
    wrap.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.getAttribute('data-id');
        var act = btn.getAttribute('data-act');
        var app = null;
        applications.forEach(function (a) { if (a.id === id) app = a; });
        if (!app) return;
        btn.disabled = true;
        try {
          if (act === 'approve') await SEMSAdmin.approveTeacherApplication(app);
          else await SEMSAdmin.rejectTeacherApplication(app);
          app.status = act === 'approve' ? 'approved' : 'rejected';
          render();
          if (window.SEMSToast) SEMSToast.success(act === 'approve'
            ? 'শিক্ষক আবেদন অনুমোদন হয়েছে। আবেদনকারী এই ইমেইল দিয়ে রেজিস্টার করলেই শিক্ষকের অ্যাকাউন্ট পাবেন।'
            : 'আবেদন বাতিল হয়েছে।');
        } catch (err) {
          btn.disabled = false;
          console.warn('[SEMS] আবেদন প্রক্রিয়া ব্যর্থ:', err && err.message);
          if (window.SEMSToast) SEMSToast.error('কাজটি করা যায়নি। আবার চেষ্টা করুন।');
        }
      });
    });
  }
  try {
    applications = await SEMSAdmin.getTeacherApplications();
    render();
    document.getElementById('statusFilter').addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] আবেদন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('আবেদনের তালিকা লোড করা যায়নি।');
  }
});
