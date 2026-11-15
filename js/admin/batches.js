/* SEMS — js/admin/batches.js | Phase 4
 * ব্যাচের তালিকা + নতুন ব্যাচ তৈরি (কোর্স + শিক্ষক বসিয়ে)।
 * ব্যাচে teacherId বসানোই শিক্ষকের পেজে আসল ডেটা দেখায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('batches'); } catch (e) { return; }
  var batches = [], courses = [], teachers = [], students = [];
  function render() {
    var wrap = document.getElementById('batchList');
    if (!batches.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('calendar', 'কোনো ব্যাচ নেই', 'নিচের ফরম থেকে ব্যাচ তৈরি করুন।');
      return;
    }
    wrap.innerHTML = batches.map(function (b) {
      var n = students.filter(function (s) { return s.batchId === b.id; }).length;
      var courseName = '';
      courses.forEach(function (c) { if (c.id === b.courseId) courseName = c.name; });
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(b.name || '') + '</h3>' +
        '<p>' + SEMSAdmin.esc(courseName || b.subject || '') + '</p>' +
        '<div class="list-meta"><span>শিক্ষক: ' + SEMSAdmin.esc(SEMSAdmin.teacherName(b.teacherId, teachers)) + '</span>' +
        '<span>' + SEMSAdmin.bnDigits(n) + ' জন শিক্ষার্থী</span>' +
        (b.startDate ? '<span>শুরু: ' + SEMSAdmin.esc(SEMSAdmin.fmtDate(b.startDate)) + '</span>' : '') + '</div></div>';
    }).join('');
  }
  function fillSelect(id, list, label) {
    var sel = document.getElementById(id);
    list.forEach(function (it) {
      var opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = (it.name || it.displayName || it.id) + (label && it.subject ? ' — ' + it.subject : '');
      sel.appendChild(opt);
    });
  }
  try {
    batches = await SEMSAdmin.getBatches();
    courses = await SEMSAdmin.getCourses();
    teachers = await SEMSAdmin.getTeachers();
    students = await SEMSAdmin.getStudents();
    render();
    fillSelect('batchCourse', courses);
    fillSelect('batchTeacher', teachers, true);
  } catch (err) {
    console.warn('[SEMS] ব্যাচ লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ব্যাচ লোড করা যায়নি।');
  }
  document.getElementById('batchForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var teacherId = document.getElementById('batchTeacher').value;
    var teacherName = '';
    teachers.forEach(function (t) { if ((t.uid || t.id) === teacherId) teacherName = t.name || t.displayName || ''; });
    var data = {
      name: document.getElementById('batchName').value.trim(),
      subject: document.getElementById('batchSubject').value.trim(),
      courseId: document.getElementById('batchCourse').value,
      teacherId: teacherId,
      teacherName: teacherName,
      startDate: document.getElementById('batchStart').value
    };
    if (!data.name || !data.teacherId) {
      errBox.textContent = 'ব্যাচের নাম ও শিক্ষক বাছুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addBatch(data);
      batches.unshift(rec);
      render();
      SEMSLoader.hide();
      okBox.textContent = 'ব্যাচ তৈরি হয়েছে — এই শিক্ষকের পেজে এখন এই ব্যাচের ডেটা দেখা যাবে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('ব্যাচ তৈরি হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'ব্যাচ তৈরি করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
