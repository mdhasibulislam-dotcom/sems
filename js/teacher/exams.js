/* SEMS — js/teacher/exams.js | Phase 3
 * পরীক্ষা তৈরি + নিজের পরীক্ষার তালিকা (exams where teacherId == uid)।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('exams'); } catch (e) { return; }

  async function renderList() {
    var wrap = document.getElementById('examsWrap');
    if (!wrap) return;
    var list = await SEMSTeacher.getExams(user.uid);
    if (!list.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('clipboard', 'এখনো কোনো পরীক্ষা তৈরি করেননি', 'উপরের ফরম থেকে আপনার ব্যাচের জন্য পরীক্ষা তৈরি করুন।');
      return;
    }
    var now = new Date(new Date().toDateString());
    wrap.innerHTML = list.map(function (e) {
      var d = SEMSTeacher.toDate(e.date);
      var past = d && d < now;
      return '<div class="list-item"><h3>' + SEMSTeacher.esc(e.title || 'পরীক্ষা') +
        ' <span class="badge ' + (past ? 'badge-completed' : 'badge-upcoming') + '">' + (past ? 'সম্পন্ন' : 'আসন্ন') + '</span></h3>' +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(e.subject || '') + '</span>' +
        '<span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(e.date) + '</span>' +
        (e.startTime ? '<span>' + SEMSTeacher.icon('clock') + ' ' + SEMSTeacher.esc(e.startTime) + '</span>' : '') +
        (e.durationMinutes ? '<span>' + SEMSTeacher.icon('timer') + ' ' + SEMSTeacher.bnDigits(e.durationMinutes) + ' মিনিট</span>' : '') +
        (e.totalMarks ? '<span>মোট নম্বর: ' + SEMSTeacher.bnDigits(e.totalMarks) + '</span>' : '') + '</div>' +
        '<div class="list-actions"><a class="btn btn-outline btn-sm" href="results.html?examId=' + encodeURIComponent(e.id) + '">নম্বর দিন</a></div>' +
        '</div>';
    }).join('');
  }

  try {
    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var sel = document.getElementById('examBatch');
    batches.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || b.title || SEMSTeacher.batchLabel(b.id);
      sel.appendChild(opt);
    });
    await renderList();

    var form = document.getElementById('examForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var title = document.getElementById('examTitle').value.trim();
      var subject = document.getElementById('examSubject').value.trim();
      var batchId = document.getElementById('examBatch').value;
      var dateVal = document.getElementById('examDate').value;
      var start = document.getElementById('examStart').value;
      var duration = parseInt(document.getElementById('examDuration').value, 10);
      var total = parseInt(document.getElementById('examTotal').value, 10);
      var msg = document.getElementById('examMsg');
      if (!title || !subject || !batchId || !dateVal || !start || isNaN(duration) || isNaN(total) || duration <= 0 || total <= 0) {
        if (window.SEMSToast) SEMSToast.error('সব ঘর সঠিকভাবে পূরণ করুন।');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await SEMSTeacher.addExam(user, {
          title: title, subject: subject, batchId: batchId,
          date: dateVal + 'T' + start + ':00', startTime: start,
          durationMinutes: duration, totalMarks: total
        });
        // নোটিফিকেশন: ব্যাচের শিক্ষার্থীদের জানানো (fire-and-forget)
        if (window.SEMSNotifications) {
          SEMSNotifications.sendToBatch(batchId, {
            title: 'নতুন পরীক্ষা: ' + title,
            body: subject + ' • ' + dateVal + ' ' + start,
            type: 'exam', link: 'exams.html'
          }).catch(function (e) { console.warn('[SEMS] পরীক্ষা নোটিফিকেশন ব্যর্থ:', e && e.message); });
        }
        if (msg) { msg.textContent = 'পরীক্ষা তৈরি হয়েছে।'; msg.hidden = false; }
        if (window.SEMSToast) SEMSToast.success('পরীক্ষা তৈরি হয়েছে।');
        form.reset();
        await renderList();
      } catch (err) {
        console.warn('[SEMS] পরীক্ষা তৈরি ব্যর্থ:', err && err.message);
        if (window.SEMSToast) SEMSToast.error('পরীক্ষা তৈরি করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  } catch (err) {
    console.warn('[SEMS] পরীক্ষা লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('পরীক্ষা লোড করা যায়নি।');
  }
});
