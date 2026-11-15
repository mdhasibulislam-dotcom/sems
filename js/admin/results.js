/* SEMS — js/admin/results.js | Phase 4
 * রেজাল্টের সার্বিক চিত্র — পরীক্ষা বেছে নম্বরের তালিকা ও গড়,
 * গ্রেডসহ। (?examId= দিয়ে সরাসরি যাওয়া যায়)
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('results'); } catch (e) { return; }
  function params() {
    var p = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  }

  var exams = [], results = [], students = [];
  function render() {
    var wrap = document.getElementById('resultWrap');
    var examId = document.getElementById('examFilter').value;
    var list = results.filter(function (r) { return !examId || r.examId === examId; });
    var summary = document.getElementById('summaryText');
    if (!list.length) {
      summary.textContent = '';
      wrap.innerHTML = SEMSAdmin.emptyState('trophy', 'কোনো রেজাল্ট নেই', 'শিক্ষক নম্বর দিলে এখানে দেখা যাবে।');
      return;
    }
    var total = 0;
    list.forEach(function (r) { total += Number(r.marks) || 0; });
    var avg = total / list.length;
    var top = null;
    list.forEach(function (r) { if (!top || (Number(r.marks) || 0) > (Number(top.marks) || 0)) top = r; });
    summary.textContent = 'মোট ' + SEMSAdmin.bnDigits(list.length) + 'টি রেজাল্ট · গড় ' +
      SEMSAdmin.bnDigits(Math.round(avg * 10) / 10) + ' · সর্বোচ্চ ' +
      SEMSAdmin.esc(SEMSAdmin.studentName(top.studentId, students)) + ' (' + SEMSAdmin.bnDigits(top.marks) + ')';
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>শিক্ষার্থী</th><th>পরীক্ষা</th><th>নম্বর</th><th>গ্রেড</th></tr></thead><tbody>' +
      list.map(function (r) {
        return '<tr><td>' + SEMSAdmin.esc(SEMSAdmin.studentName(r.studentId, students)) + '</td>' +
          '<td>' + SEMSAdmin.esc(r.examTitle || '') + '</td>' +
          '<td>' + SEMSAdmin.bnDigits(r.marks) + ' / ' + SEMSAdmin.bnDigits(r.totalMarks) + '</td>' +
          '<td>' + SEMSAdmin.esc(r.grade || SEMSAdmin.gradeFromMarks(r.marks, r.totalMarks)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  try {
    exams = await SEMSAdmin.getExams();
    results = await SEMSAdmin.getResults();
    students = await SEMSAdmin.getStudents();
    var sel = document.getElementById('examFilter');
    exams.forEach(function (e) {
      var opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.title || e.id;
      sel.appendChild(opt);
    });
    var q = params();
    if (q.examId) sel.value = q.examId;
    render();
    sel.addEventListener('change', render);
  } catch (err) {
    console.warn('[SEMS] রেজাল্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রেজাল্ট লোড করা যায়নি।');
  }
});
