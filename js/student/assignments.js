/* SEMS — js/student/assignments.js | Phase 2
 * অ্যাসাইনমেন্ট তালিকা: assignments কালেকশন।
 * জমা: লেখা উত্তর / ফাইল লিংক — Firestore submissions-এ লেখার
 * চেষ্টা, না পারলে এই ব্রাউজারে (localStorage) সংরক্ষণ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('assignments'); } catch (e) { return; }

  var subs = SEMSStudent.getSubmissions();

  function statusOf(a) {
    if (subs[a.id]) return { label: 'জমা দেওয়া হয়েছে', cls: 'badge-ok' };
    var due = SEMSStudent.toDate(a.dueDate);
    if (due && due < new Date()) return { label: 'সময় শেষ', cls: 'badge-absent' };
    return { label: 'জমা বাকি', cls: 'badge-exam' };
  }

  function render(list) {
    var wrap = document.getElementById('assignmentsWrap');
    if (!wrap) return;
    if (!list.length) {
      wrap.innerHTML = SEMSStudent.emptyState('edit', 'কোনো অ্যাসাইনমেন্ট নেই',
        'শিক্ষক অ্যাসাইনমেন্ট দিলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = list.map(function (a) {
      var st = statusOf(a);
      var sub = subs[a.id];
      return '<div class="list-item"><h3>' + SEMSStudent.esc(a.title || 'অ্যাসাইনমেন্ট') +
        ' <span class="badge ' + st.cls + '">' + st.label + '</span></h3>' +
        '<div class="list-meta"><span>' + SEMSStudent.icon('book') + ' ' + SEMSStudent.esc(a.subject || '') + '</span>' +
        '<span>⏰ শেষ তারিখ: ' + SEMSStudent.fmtDate(a.dueDate) + '</span></div>' +
        (a.description ? '<p>' + SEMSStudent.esc(a.description) + '</p>' : '') +
        (sub ? '<p class="hint">জমা দেওয়া হয়েছে: ' + SEMSStudent.fmtDate(sub.submittedAt) + (sub.savedOnline === false ? ' (শুধু এই ব্রাউজারে সংরক্ষিত)' : '') + '</p>' : '') +
        '<form class="submit-form" data-id="' + SEMSStudent.esc(a.id) + '">' +
        '<label class="field"><span>উত্তর লিখুন</span><textarea rows="3" name="answer" placeholder="আপনার উত্তর এখানে লিখুন...">' + SEMSStudent.esc(sub ? sub.answerText : '') + '</textarea></label>' +
        '<label class="field"><span>ফাইল লিংক (ঐচ্ছিক)</span><input type="url" name="fileLink" placeholder="https://... (Google Drive / PDF লিংক)" value="' + SEMSStudent.esc(sub ? sub.fileLink : '') + '"></label>' +
        '<button type="submit" class="btn btn-primary btn-sm">' + (sub ? 'আবার জমা দিন' : 'জমা দিন') + '</button>' +
        '</form></div>';
    }).join('');

    var forms = wrap.querySelectorAll('.submit-form');
    forms.forEach(function (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var id = form.getAttribute('data-id');
        var assignment = null;
        list.forEach(function (a) { if (a.id === id) assignment = a; });
        if (!assignment) return;
        var text = form.answer.value.trim();
        var link = form.fileLink.value.trim();
        if (!text && !link) {
          if (window.SEMSToast) SEMSToast.error('উত্তর লিখুন অথবা ফাইল লিংক দিন।');
          return;
        }
        try {
          var rec = await SEMSStudent.saveSubmission(user, assignment, text, link);
          subs = SEMSStudent.getSubmissions();
          if (window.SEMSToast) {
            SEMSToast.success(rec.savedOnline === false
              ? 'জমা নেওয়া হয়েছে (শুধু এই ব্রাউজারে সংরক্ষিত — অনলাইন সংরক্ষণে অনুমতি লাগবে)।'
              : 'অ্যাসাইনমেন্ট জমা হয়েছে।');
          }
          render(list);
        } catch (err) {
          if (window.SEMSToast) SEMSToast.error('জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
        }
      });
    });
  }

  try {
    var profile = await SEMSStudent.getProfile(user);
    var batchId = profile.courseBatch || profile.batchId || '';
    var list = await SEMSStudent.getAssignments(batchId);
    render(list);
  } catch (err) {
    console.warn('[SEMS] অ্যাসাইনমেন্ট লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('অ্যাসাইনমেন্ট লোড করা যায়নি।');
  }
});
