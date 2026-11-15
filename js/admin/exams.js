/* SEMS — js/admin/exams.js | Phase 4
 * পরীক্ষা তৈরি + সব পরীক্ষার তালিকা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('exams'); } catch (e) { return; }
  var exams = [], batches = [], teachers = [];
  function render() {
    var wrap = document.getElementById('examList');
    if (!exams.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('clipboard', 'কোনো পরীক্ষা নেই', 'নিচের ফরম থেকে পরীক্ষা তৈরি করুন।');
      return;
    }
    wrap.innerHTML = exams.map(function (e) {
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(e.title || '') + '</h3>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(e.subject || '') + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.batchName(e.batchId, batches)) + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(e.date)) + '</span>' +
        '<span>' + SEMSAdmin.esc(e.startTime || '') + '</span>' +
        '<span>' + SEMSAdmin.bnDigits(e.durationMinutes || 0) + ' মিনিট</span>' +
        '<span>মোট ' + SEMSAdmin.bnDigits(e.totalMarks || 0) + ' নম্বর</span></div>' +
        '<div class="list-actions"><a class="btn btn-sm" href="results.html?examId=' + encodeURIComponent(e.id) + '">রেজাল্ট দেখুন</a></div></div>';
    }).join('');
  }
  function fillSelect(id, list, withSubject) {
    var sel = document.getElementById(id);
    list.forEach(function (it) {
      var opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = (it.name || it.displayName || it.id) + (withSubject && it.subject ? ' — ' + it.subject : '');
      sel.appendChild(opt);
    });
  }
  try {
    exams = await SEMSAdmin.getExams();
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    render();
    fillSelect('exBatch', batches);
    fillSelect('exTeacher', teachers, true);
  } catch (err) {
    console.warn('[SEMS] পরীক্ষা লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('পরীক্ষা লোড করা যায়নি।');
  }
  document.getElementById('examForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      title: document.getElementById('exTitle').value.trim(),
      subject: document.getElementById('exSubject').value.trim(),
      batchId: document.getElementById('exBatch').value,
      teacherId: document.getElementById('exTeacher').value,
      date: document.getElementById('exDate').value,
      startTime: document.getElementById('exStart').value,
      durationMinutes: Number(document.getElementById('exDuration').value) || 0,
      totalMarks: Number(document.getElementById('exTotal').value) || 0
    };
    if (!data.title || !data.batchId || !data.date || !data.totalMarks) {
      errBox.textContent = 'শিরোনাম, ব্যাচ, তারিখ ও মোট নম্বর পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addExam(user, data);
      // নোটিফিকেশন: ব্যাচের শিক্ষার্থীদের জানানো (fire-and-forget)
      if (window.SEMSNotifications) {
        SEMSNotifications.sendToBatch(data.batchId, {
          title: 'নতুন পরীক্ষা: ' + data.title,
          body: (data.subject || '') + ' • ' + (data.date || ''),
          type: 'exam', link: 'exams.html'
        }).catch(function (e) { console.warn('[SEMS] পরীক্ষা নোটিফিকেশন ব্যর্থ:', e && e.message); });
      }
      exams.push(rec);
      exams = SEMSAdmin.sortByDateAsc(exams, 'date');
      render();
      SEMSLoader.hide();
      okBox.textContent = 'পরীক্ষা তৈরি হয়েছে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('পরীক্ষা তৈরি হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'পরীক্ষা তৈরি করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
