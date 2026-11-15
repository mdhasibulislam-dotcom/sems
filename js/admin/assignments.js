/* SEMS — js/admin/assignments.js | Phase 4
 * অ্যাসাইনমেন্ট তৈরি + সব অ্যাসাইনমেন্টের তালিকা (জমার সংখ্যাসহ)।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('assignments'); } catch (e) { return; }
  var assignments = [], batches = [], teachers = [], submissions = [];
  function render() {
    var wrap = document.getElementById('assignmentList');
    if (!assignments.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('edit', 'কোনো অ্যাসাইনমেন্ট নেই', 'নিচের ফরম থেকে অ্যাসাইনমেন্ট তৈরি করুন।');
      return;
    }
    wrap.innerHTML = assignments.map(function (a) {
      var n = submissions.filter(function (s) { return s.assignmentId === a.id; }).length;
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(a.title || '') + '</h3>' +
        '<p>' + SEMSAdmin.esc(a.description || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(a.subject || '') + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.batchName(a.batchId, batches)) + '</span>' +
        '<span>শিক্ষক: ' + SEMSAdmin.esc(SEMSAdmin.teacherName(a.teacherId, teachers)) + '</span>' +
        '<span>শেষ তারিখ: ' + SEMSAdmin.esc(SEMSAdmin.fmtDate(a.dueDate)) + '</span>' +
        '<span>' + SEMSAdmin.bnDigits(n) + 'টি জমা</span></div></div>';
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
    assignments = await SEMSAdmin.getAssignments();
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    render();
    fillSelect('asBatch', batches);
    fillSelect('asTeacher', teachers, true);
    if (SEMSAdmin.isDemo()) {
      var subs = {};
      try { subs = JSON.parse(localStorage.getItem('sems_assignment_submissions') || '{}'); } catch (e) { subs = {}; }
      Object.keys(subs).forEach(function (k) { submissions.push(subs[k]); });
    }
    render();
  } catch (err) {
    console.warn('[SEMS] অ্যাসাইনমেন্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('অ্যাসাইনমেন্ট লোড করা যায়নি।');
  }
  document.getElementById('assignmentForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      title: document.getElementById('asTitle').value.trim(),
      subject: document.getElementById('asSubject').value.trim(),
      batchId: document.getElementById('asBatch').value,
      teacherId: document.getElementById('asTeacher').value,
      dueDate: document.getElementById('asDue').value,
      description: document.getElementById('asDesc').value.trim()
    };
    if (!data.title || !data.batchId || !data.dueDate) {
      errBox.textContent = 'শিরোনাম, ব্যাচ ও শেষ তারিখ পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addAssignment(user, data);
      // নোটিফিকেশন: ব্যাচের শিক্ষার্থীদের জানানো (fire-and-forget)
      if (window.SEMSNotifications) {
        SEMSNotifications.sendToBatch(data.batchId, {
          title: 'নতুন অ্যাসাইনমেন্ট: ' + data.title,
          body: (data.subject || '') + ' • শেষ তারিখ: ' + (data.dueDate || ''),
          type: 'assignment', link: 'assignments.html'
        }).catch(function (e) { console.warn('[SEMS] অ্যাসাইনমেন্ট নোটিফিকেশন ব্যর্থ:', e && e.message); });
      }
      assignments.unshift(rec);
      render();
      SEMSLoader.hide();
      okBox.textContent = 'অ্যাসাইনমেন্ট তৈরি হয়েছে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('অ্যাসাইনমেন্ট তৈরি হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'অ্যাসাইনমেন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
