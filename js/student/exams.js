/* SEMS — js/student/exams.js | Phase 2
 * পরীক্ষার তালিকা: exams কালেকশন — আসন্ন ও গত পরীক্ষা, সময়কাল,
 * মোট নম্বর। পরীক্ষার ইঞ্জিন Phase 5-এর কাজ, তাই "পরীক্ষা শুরু"
 * বাটন শুধু পরীক্ষার তথ্য থাকলেই দেখায়, ক্লিকে Phase 5 নোটিশ দেয়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('exams'); } catch (e) { return; }

  function examCard(ex, isPast) {
    var d = SEMSStudent.toDate(ex.date);
    var isToday = d && SEMSStudent.dateKey(d) === SEMSStudent.todayKey();
    return '<div class="list-item"><h3>' + SEMSStudent.esc(ex.title || 'পরীক্ষা') +
      ' <span class="badge ' + (isPast ? 'badge-completed' : 'badge-exam') + '">' + (isPast ? 'শেষ হয়েছে' : (isToday ? 'আজ' : 'আসন্ন')) + '</span></h3>' +
      '<div class="list-meta"><span>📚 ' + SEMSStudent.esc(ex.subject || '') + '</span>' +
      '<span>📅 ' + SEMSStudent.fmtDate(ex.date) + '</span>' +
      (ex.startTime ? '<span>🕐 ' + SEMSStudent.esc(ex.startTime) + '</span>' : '') +
      (ex.durationMinutes ? '<span>⏱️ ' + SEMSStudent.bnDigits(ex.durationMinutes) + ' মিনিট</span>' : '') +
      (ex.totalMarks ? '<span>📝 মোট ' + SEMSStudent.bnDigits(ex.totalMarks) + ' নম্বর</span>' : '') + '</div>' +
      (ex.description ? '<p>' + SEMSStudent.esc(ex.description) + '</p>' : '') +
      '<div class="list-actions">' +
      (!isPast
        ? '<button type="button" class="btn btn-primary btn-sm start-exam-btn">▶️ পরীক্ষা শুরু</button>'
        : '<a class="btn btn-outline btn-sm" href="results.html">ফলাফল দেখুন</a>') +
      '</div></div>';
  }

  try {
    var exams = await SEMSStudent.getExams();
    var wrap = document.getElementById('examsWrap');
    if (!wrap) return;
    if (!exams.length) {
      wrap.innerHTML = SEMSStudent.emptyState('📋', 'কোনো পরীক্ষা নির্ধারিত হয়নি',
        'অ্যাডমিন পরীক্ষা যোগ করলে এখানে আসন্ন ও গত পরীক্ষার তালিকা দেখা যাবে।');
      return;
    }
    var now = new Date();
    var upcoming = exams.filter(function (ex) {
      var d = SEMSStudent.toDate(ex.date);
      return !d || d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    });
    var past = exams.filter(function (ex) {
      var d = SEMSStudent.toDate(ex.date);
      return d && d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    });
    wrap.innerHTML =
      '<h3 class="section-title">আসন্ন পরীক্ষা</h3>' +
      (upcoming.length ? upcoming.map(function (ex) { return examCard(ex, false); }).join('')
        : '<p class="muted">আসন্ন কোনো পরীক্ষা নেই।</p>') +
      '<h3 class="section-title">গত পরীক্ষা</h3>' +
      (past.length ? past.map(function (ex) { return examCard(ex, true); }).join('')
        : '<p class="muted">এখনো কোনো পরীক্ষা শেষ হয়নি।</p>');

    wrap.querySelectorAll('.start-exam-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (window.SEMSToast) SEMSToast.info('অনলাইন পরীক্ষার ইঞ্জিন Phase 5-এ আসছে। পরীক্ষার সময় শিক্ষক/অ্যাডমিন লিংক জানিয়ে দেবেন।');
      });
    });
  } catch (err) {
    console.warn('[SEMS] পরীক্ষা লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('পরীক্ষার তালিকা লোড করা যায়নি।');
  }
});
