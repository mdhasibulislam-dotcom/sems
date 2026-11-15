/* SEMS — js/admin/reports.js | Phase 4
 * রিপোর্ট: প্রতি ব্যাচে শিক্ষার্থী/ক্লাস সংখ্যা, উপস্থিতির হার,
 * পরীক্ষার গড় নম্বর।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('reports'); } catch (e) { return; }
  try {
    var batches = await SEMSAdmin.getBatches();
    var students = await SEMSAdmin.getStudents();
    var classes = await SEMSAdmin.getClasses();
    var attendance = await SEMSAdmin.getAttendance();
    var exams = await SEMSAdmin.getExams();
    var results = await SEMSAdmin.getResults();
    document.getElementById('statStudents').textContent = SEMSAdmin.bnDigits(students.length);
    document.getElementById('statClasses').textContent = SEMSAdmin.bnDigits(classes.length);
    document.getElementById('statExams').textContent = SEMSAdmin.bnDigits(exams.length);
    var attPct = null;
    if (attendance.length) {
      var p = attendance.filter(function (a) { return a.status === 'present'; }).length;
      attPct = Math.round((p / attendance.length) * 100);
    }
    document.getElementById('statAttendance').textContent = attPct === null ? '—' : SEMSAdmin.bnDigits(attPct) + '%';
    var wrap = document.getElementById('reportWrap');
    if (!batches.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('fileText', 'কোনো ব্যাচ নেই', 'ব্যাচ তৈরি করলে প্রতি ব্যাচের রিপোর্ট এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>ব্যাচ</th><th>শিক্ষার্থী</th><th>ক্লাস</th><th>উপস্থিতি</th><th>পরীক্ষার গড়</th></tr></thead><tbody>' +
      batches.map(function (b) {
        var st = students.filter(function (s) { return s.batchId === b.id; });
        var cl = classes.filter(function (c) { return c.batchId === b.id; });
        var at = attendance.filter(function (a) { return a.batchId === b.id; });
        var ap = at.length ? Math.round((at.filter(function (a) { return a.status === 'present'; }).length / at.length) * 100) : null;
        var exIds = exams.filter(function (e) { return e.batchId === b.id; }).map(function (e) { return e.id; });
        var rs = results.filter(function (r) { return exIds.indexOf(r.examId) !== -1; });
        var avg = null;
        if (rs.length) {
          var tot = 0;
          rs.forEach(function (r) { tot += Number(r.marks) || 0; });
          avg = Math.round((tot / rs.length) * 10) / 10;
        }
        return '<tr><td><strong>' + SEMSAdmin.esc(b.name || '') + '</strong></td>' +
          '<td>' + SEMSAdmin.bnDigits(st.length) + ' জন</td>' +
          '<td>' + SEMSAdmin.bnDigits(cl.length) + 'টি</td>' +
          '<td>' + (ap === null ? '—' : SEMSAdmin.bnDigits(ap) + '%') + '</td>' +
          '<td>' + (avg === null ? '—' : SEMSAdmin.bnDigits(avg)) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  } catch (err) {
    console.warn('[SEMS] রিপোর্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রিপোর্ট লোড করা যায়নি।');
  }
});
