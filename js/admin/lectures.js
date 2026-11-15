/* SEMS — js/admin/lectures.js | Phase 4
 * সব লেকচারের তালিকা — বিষয় ফিল্টার + খোঁজা, মুছে ফেলা যায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('lectures'); } catch (e) { return; }
  var lectures = [], batches = [], teachers = [];
  function render() {
    var wrap = document.getElementById('lectureList');
    var q = (document.getElementById('searchInput').value || '').toLowerCase();
    var list = lectures.filter(function (l) {
      if (!q) return true;
      var hay = ((l.title || '') + ' ' + (l.subject || '') + ' ' + (l.chapter || '')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('book', 'কোনো লেকচার নেই', 'লেকচার আপলোড করলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = list.map(function (l) {
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(l.title || '') + '</h3>' +
        '<p>' + SEMSAdmin.esc(l.description || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(l.subject || '') + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.batchName(l.batchId, batches)) + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.teacherName(l.teacherId, teachers)) + '</span>' +
        '<span>প্রকাশ: ' + SEMSAdmin.esc(SEMSAdmin.fmtDate(l.publishDate || l.date)) + '</span>' +
        (l.published ? '<span class="badge badge-ok">প্রকাশিত</span>' : '<span class="badge badge-muted">খসড়া</span>') + '</div>' +
        '<div class="list-actions">' +
        (l.pdfUrl ? '<a class="btn btn-sm btn-outline" href="' + SEMSAdmin.esc(l.pdfUrl) + '" target="_blank" rel="noopener">PDF</a>' : '') +
        (l.slidesUrl ? '<a class="btn btn-sm btn-outline" href="' + SEMSAdmin.esc(l.slidesUrl) + '" target="_blank" rel="noopener">স্লাইড</a>' : '') +
        (l.recordingUrl ? '<a class="btn btn-sm btn-outline" href="' + SEMSAdmin.esc(l.recordingUrl) + '" target="_blank" rel="noopener">রেকর্ডিং</a>' : '') +
        '<button class="btn btn-sm btn-danger" data-del="' + SEMSAdmin.esc(l.id) + '">মুছুন</button></div></div>';
    }).join('');
    wrap.querySelectorAll('button[data-del]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!window.confirm('এই লেকচারটি মুছে ফেলবেন?')) return;
        try {
          await SEMSAdmin.deleteDoc('lectures', 'sems_demo_lectures', btn.getAttribute('data-del'));
          lectures = lectures.filter(function (l) { return l.id !== btn.getAttribute('data-del'); });
          render();
          if (window.SEMSToast) SEMSToast.success('লেকচার মুছে ফেলা হয়েছে।');
        } catch (err) {
          if (window.SEMSToast) SEMSToast.error('মুছে ফেলা যায়নি।');
        }
      });
    });
  }
  try {
    lectures = await SEMSAdmin.getLectures();
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    render();
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] লেকচার লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('লেকচার লোড করা যায়নি।');
  }
});
