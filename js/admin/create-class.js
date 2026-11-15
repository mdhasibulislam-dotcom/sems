/* SEMS — js/admin/create-class.js | Phase 4
 * নতুন ক্লাস তৈরি (বিষয়, অধ্যায়, ব্যাচ, শিক্ষক, তারিখ, সময়,
 * অনলাইন/অফলাইন, ক্লাস লিংক)।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('classes'); } catch (e) { return; }
  var batches = [], teachers = [];
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
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    fillSelect('classBatch', batches);
    fillSelect('classTeacher', teachers, true);
  } catch (err) { console.warn('[SEMS] ব্যাচ/শিক্ষক লোড ব্যর্থ:', err && err.message); }
  document.getElementById('classForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var teacherId = document.getElementById('classTeacher').value;
    var teacherName = '';
    teachers.forEach(function (t) { if ((t.uid || t.id) === teacherId) teacherName = t.name || t.displayName || ''; });
    var data = {
      subject: document.getElementById('classSubject').value.trim(),
      chapter: document.getElementById('classChapter').value.trim(),
      batchId: document.getElementById('classBatch').value,
      teacherId: teacherId,
      teacherName: teacherName,
      date: document.getElementById('classDate').value,
      startTime: document.getElementById('classStart').value,
      endTime: document.getElementById('classEnd').value,
      mode: document.getElementById('classMode').value,
      classLink: document.getElementById('classLink').value.trim()
    };
    if (!data.subject || !data.batchId || !data.teacherId || !data.date || !data.startTime || !data.endTime) {
      errBox.textContent = 'বিষয়, ব্যাচ, শিক্ষক, তারিখ ও সময় পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      await SEMSAdmin.addClass(data);
      SEMSLoader.hide();
      okBox.textContent = 'ক্লাস তৈরি হয়েছে — রুটিনে দেখা যাবে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('ক্লাস তৈরি হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'ক্লাস তৈরি করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
