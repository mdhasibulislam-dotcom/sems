/* SEMS — js/student/results.js | Phase 2
 * পরীক্ষা ও রেজাল্ট: results কালেকশন (studentId == uid)।
 * নম্বর, গ্রেড, গড় নম্বর ও অগ্রগতির সংক্ষেপ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('results'); } catch (e) { return; }

  function gradeOf(r) {
    if (r.grade) return r.grade;
    if (!r.totalMarks || !r.marks && r.marks !== 0) return '—';
    var pct = (r.marks / r.totalMarks) * 100;
    if (pct >= 80) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 60) return 'A-';
    if (pct >= 50) return 'B';
    if (pct >= 40) return 'C';
    if (pct >= 33) return 'D';
    return 'F';
  }

  try {
    var results = await SEMSStudent.getResults(user.uid);
    var sumEl = document.getElementById('resultsSummary');
    var wrap = document.getElementById('resultsWrap');
    if (!results.length) {
      if (sumEl) sumEl.innerHTML = '';
      if (wrap) wrap.innerHTML = SEMSStudent.emptyState('🏆', 'এখনো কোনো রেজাল্ট প্রকাশিত হয়নি',
        'পরীক্ষার ফলাফল প্রকাশ হলে এখানে নম্বর ও গ্রেড দেখা যাবে।');
      return;
    }
    var totalMarks = 0, gotMarks = 0;
    results.forEach(function (r) {
      totalMarks += Number(r.totalMarks) || 0;
      gotMarks += Number(r.marks) || 0;
    });
    var avg = totalMarks ? Math.round((gotMarks / totalMarks) * 100) : 0;
    if (sumEl) {
      sumEl.innerHTML = '<div class="stat-grid">' +
        '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(avg) + '%</div><div class="lbl">গড় নম্বর</div></div>' +
        '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(gotMarks) + '/' + SEMSStudent.bnDigits(totalMarks) + '</div><div class="lbl">মোট প্রাপ্ত নম্বর</div></div>' +
        '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(results.length) + '</div><div class="lbl">পরীক্ষা</div></div>' +
        '<div class="stat-card"><div class="num grade-big">' + SEMSStudent.esc(gradeOf({ marks: gotMarks, totalMarks: totalMarks })) + '</div><div class="lbl">সামগ্রিক গ্রেড</div></div>' +
        '</div>' +
        '<div class="panel"><h2>অগ্রগতি</h2><div class="progress"><span style="width:' + avg + '%"></span></div>' +
        '<p class="muted">সব পরীক্ষায় গড়ে ' + SEMSStudent.bnDigits(avg) + '% নম্বর পেয়েছেন।</p></div>';
    }
    if (wrap) {
      wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>পরীক্ষা</th><th>বিষয়</th><th>তারিখ</th><th>নম্বর</th><th>গ্রেড</th></tr></thead><tbody>' +
        results.map(function (r) {
          return '<tr><td>' + SEMSStudent.esc(r.examTitle || r.title || 'পরীক্ষা') + '</td>' +
            '<td>' + SEMSStudent.esc(r.subject || '—') + '</td>' +
            '<td>' + SEMSStudent.fmtDate(r.date) + '</td>' +
            '<td>' + SEMSStudent.bnDigits(r.marks == null ? '—' : r.marks) + ' / ' + SEMSStudent.bnDigits(r.totalMarks == null ? '—' : r.totalMarks) + '</td>' +
            '<td><span class="badge badge-ok">' + SEMSStudent.esc(gradeOf(r)) + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
  } catch (err) {
    console.warn('[SEMS] রেজাল্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রেজাল্ট লোড করা যায়নি।');
  }
});
