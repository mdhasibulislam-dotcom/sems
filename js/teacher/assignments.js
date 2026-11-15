/* SEMS — js/teacher/assignments.js | Phase 3
 * অ্যাসাইনমেন্ট তৈরি + নিজের অ্যাসাইনমেন্টের তালিকা
 * (assignments where teacherId == uid) ও জমার সংখ্যা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('assignments'); } catch (e) { return; }

  function statusOf(a) {
    var due = SEMSTeacher.toDate(a.dueDate);
    if (due && due < new Date()) return { label: 'সময় শেষ', cls: 'badge-absent' };
    return { label: 'চলমান', cls: 'badge-ok' };
  }

  async function renderList() {
    var wrap = document.getElementById('assignmentsWrap');
    if (!wrap) return;
    var list = await SEMSTeacher.getAssignments(user.uid);
    if (!list.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('fileText', 'এখনো কোনো অ্যাসাইনমেন্ট দেননি', 'উপরের ফরম থেকে আপনার ব্যাচের জন্য অ্যাসাইনমেন্ট তৈরি করুন।');
      return;
    }
    var html = [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var st = statusOf(a);
      var subs = await SEMSTeacher.getSubmissionsForAssignment(a.id);
      html.push('<div class="list-item"><h3>' + SEMSTeacher.esc(a.title || 'অ্যাসাইনমেন্ট') +
        ' <span class="badge ' + st.cls + '">' + st.label + '</span></h3>' +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(a.subject || '') + '</span>' +
        '<span>' + SEMSTeacher.icon('clock') + ' শেষ তারিখ: ' + SEMSTeacher.fmtDate(a.dueDate) + '</span>' +
        '<span>' + SEMSTeacher.icon('users') + ' জমা: ' + SEMSTeacher.bnDigits(subs.length) + 'টি</span></div>' +
        (a.description ? '<p>' + SEMSTeacher.esc(a.description) + '</p>' : '') + '</div>');
    }
    wrap.innerHTML = html.join('');
  }

  try {
    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var sel = document.getElementById('asgBatch');
    batches.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || b.title || SEMSTeacher.batchLabel(b.id);
      sel.appendChild(opt);
    });
    await renderList();

    var form = document.getElementById('assignmentForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var title = document.getElementById('asgTitle').value.trim();
      var subject = document.getElementById('asgSubject').value.trim();
      var batchId = document.getElementById('asgBatch').value;
      var due = document.getElementById('asgDue').value;
      var desc = document.getElementById('asgDesc').value.trim();
      var msg = document.getElementById('asgMsg');
      if (!title || !subject || !batchId || !due) {
        if (window.SEMSToast) SEMSToast.error('শিরোনাম, বিষয়, ব্যাচ ও শেষ তারিখ — সবগুলো দিন।');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await SEMSTeacher.addAssignment(user, {
          title: title, subject: subject, batchId: batchId,
          dueDate: due + 'T23:59:00', description: desc
        });
        if (msg) { msg.textContent = 'অ্যাসাইনমেন্ট তৈরি হয়েছে।'; msg.hidden = false; }
        if (window.SEMSToast) SEMSToast.success('অ্যাসাইনমেন্ট তৈরি হয়েছে।');
        form.reset();
        await renderList();
      } catch (err) {
        console.warn('[SEMS] অ্যাসাইনমেন্ট তৈরি ব্যর্থ:', err && err.message);
        if (window.SEMSToast) SEMSToast.error('অ্যাসাইনমেন্ট তৈরি করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  } catch (err) {
    console.warn('[SEMS] অ্যাসাইনমেন্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('অ্যাসাইনমেন্ট লোড করা যায়নি।');
  }
});
