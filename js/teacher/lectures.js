/* SEMS — js/teacher/lectures.js | Phase 3
 * নিজের লেকচারের তালিকা: lectures where teacherId == uid।
 * বিষয় ফিল্টার + শিরোনাম/অধ্যায় খোঁজা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('lectures'); } catch (e) { return; }

  var allLectures = [];

  function render() {
    var wrap = document.getElementById('lecturesWrap');
    if (!wrap) return;
    var sf = document.getElementById('subjectFilter').value;
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    var list = allLectures.filter(function (l) {
      if (sf && l.subject !== sf) return false;
      if (q) {
        var hay = ((l.title || '') + ' ' + (l.chapter || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!list.length) {
      wrap.innerHTML = allLectures.length
        ? SEMSTeacher.emptyState('search', 'খুঁজে কিছু পাওয়া যায়নি', 'অন্য বিষয় বা অন্য শব্দ দিয়ে চেষ্টা করুন।')
        : SEMSTeacher.emptyState('book', 'এখনো কোনো লেকচার প্রকাশ করেননি', '"লেকচার আপলোড" পেজ থেকে নতুন লেকচার প্রকাশ করুন।');
      return;
    }
    wrap.innerHTML = list.map(function (l) {
      return '<div class="list-item"><h3>' + SEMSTeacher.esc(l.title || 'লেকচার') +
        (l.published ? ' <span class="badge badge-ok">প্রকাশিত</span>' : ' <span class="badge badge-muted">খসড়া</span>') + '</h3>' +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(l.subject || '') + '</span>' +
        (l.chapter ? '<span>' + SEMSTeacher.esc(l.chapter) + '</span>' : '') +
        '<span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(l.publishDate || l.date) + '</span></div>' +
        (l.description ? '<p>' + SEMSTeacher.esc(l.description) + '</p>' : '') +
        '<div class="list-actions">' +
        (l.pdfUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSTeacher.esc(l.pdfUrl) + '" target="_blank" rel="noopener">PDF</a>' : '') +
        (l.slidesUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSTeacher.esc(l.slidesUrl) + '" target="_blank" rel="noopener">স্লাইড</a>' : '') +
        (l.recordingUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSTeacher.esc(l.recordingUrl) + '" target="_blank" rel="noopener">রেকর্ডিং</a>' : '') +
        '</div></div>';
    }).join('');
  }

  try {
    allLectures = await SEMSTeacher.getMyLectures(user.uid);
    var subjects = [];
    allLectures.forEach(function (l) {
      if (l.subject && subjects.indexOf(l.subject) === -1) subjects.push(l.subject);
    });
    var sel = document.getElementById('subjectFilter');
    subjects.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      sel.appendChild(opt);
    });
    render();
    sel.addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] লেকচার লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('লেকচার লোড করা যায়নি।');
  }
});
