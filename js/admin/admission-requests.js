/* SEMS — js/admin/admission-requests.js | Phase 4
 * ভর্তি আবেদন: বাকি আবেদন অনুমোদন/বাতিল। অনুমোদনে admissions
 * status approved + users.admissionCompleted=true + students ডক।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('students'); } catch (e) { return; }
  var admissions = [], batches = [];
  function render(filter) {
    var wrap = document.getElementById('requestList');
    var list = admissions.filter(function (a) {
      if (filter === 'pending') return (a.status || 'pending') === 'pending';
      if (filter === 'approved') return a.status === 'approved';
      if (filter === 'rejected') return a.status === 'rejected';
      return true;
    });
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('clipboard', 'কোনো আবেদন নেই', 'নতুন ভর্তি আবেদন এলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = list.map(function (a) {
      var st = a.status || 'pending';
      var badge = st === 'approved' ? 'badge-approved' : (st === 'rejected' ? 'badge-rejected' : 'badge-pending');
      var badgeTxt = st === 'approved' ? 'অনুমোদিত' : (st === 'rejected' ? 'বাতিল' : 'বাকি');
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(a.fullName || a.name || 'আবেদনকারী') + '</h3>' +
        '<p>' + SEMSAdmin.esc(a.collegeName || '') + ' · ' + SEMSAdmin.esc(a.mobile || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.batchName(a.courseBatch, batches)) + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(a.createdAt)) + '</span>' +
        '<span class="badge ' + badge + '">' + badgeTxt + '</span></div>' +
        (st === 'pending' ? '<div class="list-actions">' +
          '<button class="btn btn-sm" data-act="approve" data-id="' + SEMSAdmin.esc(a.id) + '">অনুমোদন করুন</button>' +
          '<button class="btn btn-sm btn-danger" data-act="reject" data-id="' + SEMSAdmin.esc(a.id) + '">বাতিল করুন</button>' +
          '</div>' : '') + '</div>';
    }).join('');
    wrap.querySelectorAll('button[data-act]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = btn.getAttribute('data-id');
        var act = btn.getAttribute('data-act');
        var adm = null;
        admissions.forEach(function (a) { if (a.id === id) adm = a; });
        if (!adm) return;
        btn.disabled = true;
        try {
          if (act === 'approve') await SEMSAdmin.approveAdmission(adm);
          else await SEMSAdmin.rejectAdmission(adm);
          adm.status = act === 'approve' ? 'approved' : 'rejected';
          render(document.getElementById('statusFilter').value);
          if (window.SEMSToast) SEMSToast.success(act === 'approve' ? 'ভর্তি অনুমোদন হয়েছে।' : 'আবেদন বাতিল হয়েছে।');
        } catch (err) {
          btn.disabled = false;
          console.warn('[SEMS] আবেদন প্রক্রিয়া ব্যর্থ:', err && err.message);
          if (window.SEMSToast) SEMSToast.error('কাজটি করা যায়নি। আবার চেষ্টা করুন।');
        }
      });
    });
  }
  try {
    admissions = await SEMSAdmin.getAdmissions();
    batches = await SEMSAdmin.getBatches();
    render('pending');
    document.getElementById('statusFilter').addEventListener('change', function (e) { render(e.target.value); });
  } catch (err) {
    console.warn('[SEMS] আবেদন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('আবেদনের তালিকা লোড করা যায়নি।');
  }
});
