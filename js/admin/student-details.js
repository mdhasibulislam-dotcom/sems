/* SEMS — js/admin/student-details.js | Phase 4
 * একক শিক্ষার্থীর বিস্তারিত (?id=): প্রোফাইল, উপস্থিতির হার, রেজাল্ট।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('students'); } catch (e) { return; }
  function params() {
    var p = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  }

  var q = params();
  var wrap = document.getElementById('detailWrap');
  if (!q.id) {
    wrap.innerHTML = SEMSAdmin.emptyState('users', 'শিক্ষার্থী বাছা হয়নি', 'শিক্ষার্থীর তালিকা থেকে একজনকে বাছুন।');
    return;
  }
  try {
    var s = await SEMSAdmin.getStudentById(q.id);
    if (!s) {
      wrap.innerHTML = SEMSAdmin.emptyState('users', 'শিক্ষার্থী পাওয়া যায়নি', 'আইডিটি সঠিক কিনা দেখুন।');
      return;
    }
    var batches = await SEMSAdmin.getBatches();
    var att = await SEMSAdmin.getAttendanceForStudent(s.id);
    var results = await SEMSAdmin.getResultsForStudent(s.id);
    var present = att.filter(function (a) { return a.status === 'present'; }).length;
    var pct = att.length ? Math.round((present / att.length) * 100) : null;
    var initials = (s.fullName || s.name || '?').trim().charAt(0);
    var html = '<div class="profile-top"><div class="profile-photo">' + SEMSAdmin.esc(initials) + '</div>' +
      '<div><h2>' + SEMSAdmin.esc(s.fullName || s.name || 'শিক্ষার্থী') + '</h2>' +
      '<p class="muted">' + SEMSAdmin.esc(s.email || '') + '</p></div></div>' +
      '<h3 class="section-title">ব্যক্তিগত তথ্য</h3><dl class="kv">' +
      '<dt>মোবাইল</dt><dd>' + SEMSAdmin.esc(s.mobile || s.phone || '—') + '</dd>' +
      '<dt>ব্যাচ</dt><dd>' + SEMSAdmin.esc(SEMSAdmin.batchName(s.batchId, batches)) + '</dd>' +
      '<dt>কলেজ</dt><dd>' + SEMSAdmin.esc(s.collegeName || '—') + '</dd>' +
      '<dt>ঠিকানা</dt><dd>' + SEMSAdmin.esc(s.address || '—') + '</dd>' +
      '<dt>জন্ম তারিখ</dt><dd>' + SEMSAdmin.esc(s.dob || '—') + '</dd>' +
      '<dt>রক্তের গ্রুপ</dt><dd>' + SEMSAdmin.esc(s.bloodGroup || '—') + '</dd>' +
      '<dt>অভিভাবক</dt><dd>' + SEMSAdmin.esc(s.guardianName || '—') + ' (' + SEMSAdmin.esc(s.guardianPhone || '—') + ')</dd>' +
      '</dl>' +
      '<h3 class="section-title">উপস্থিতি</h3>' +
      (pct === null ? '<p class="muted">এখনো উপস্থিতির রেকর্ড নেই।</p>' :
        '<p>মোট ' + SEMSAdmin.bnDigits(att.length) + ' দিনের মধ্যে ' + SEMSAdmin.bnDigits(present) +
        ' দিন উপস্থিত — ' + SEMSAdmin.bnDigits(pct) + '%।</p>') +
      '<h3 class="section-title">রেজাল্ট</h3>';
    if (!results.length) {
      html += '<p class="muted">এখনো কোনো রেজাল্ট নেই।</p>';
    } else {
      html += '<div class="table-wrap"><table class="data"><thead><tr><th>পরীক্ষা</th><th>বিষয়</th><th>নম্বর</th><th>গ্রেড</th></tr></thead><tbody>' +
        results.map(function (r) {
          return '<tr><td>' + SEMSAdmin.esc(r.examTitle || '') + '</td><td>' + SEMSAdmin.esc(r.subject || '') +
            '</td><td>' + SEMSAdmin.bnDigits(r.marks) + ' / ' + SEMSAdmin.bnDigits(r.totalMarks) +
            '</td><td>' + SEMSAdmin.esc(r.grade || SEMSAdmin.gradeFromMarks(r.marks, r.totalMarks)) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    wrap.innerHTML = html;
  } catch (err) {
    console.warn('[SEMS] বিস্তারিত লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('বিস্তারিত লোড করা যায়নি।');
  }
});
