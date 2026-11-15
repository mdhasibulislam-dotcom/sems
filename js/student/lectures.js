/* SEMS — js/student/lectures.js | Phase 2
 * তারিখ অনুযায়ী লেকচার তালিকা: lectures কালেকশন, শুধু published=true।
 * বিষয় ফিল্টার + খোঁজা, PDF/স্লাইড/রেকর্ডিং লিংক।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('lectures'); } catch (e) { return; }

  var allLectures = [];

  function render(list) {
    var wrap = document.getElementById('lecturesWrap');
    if (!wrap) return;
    if (!list.length) {
      wrap.innerHTML = SEMSStudent.emptyState('book', 'কোনো লেকচার পাওয়া যায়নি',
        'এই ফিল্টারে কিছু নেই, অথবা এখনো কোনো লেকচার প্রকাশিত হয়নি।');
      return;
    }
    // তারিখ অনুযায়ী গ্রুপ করা
    var byDate = {};
    list.forEach(function (l) {
      var d = SEMSStudent.toDate(l.publishDate || l.date);
      var key = d ? SEMSStudent.dateKey(d) : 'unknown';
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(l);
    });
    var keys = Object.keys(byDate).sort().reverse();
    var html = '';
    keys.forEach(function (key) {
      var first = byDate[key][0];
      html += '<h3 class="section-title">' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.fmtDate(first.publishDate || first.date) + '</h3>';
      byDate[key].forEach(function (l) {
        html += '<div class="list-item"><h3>' + SEMSStudent.esc(l.title || 'লেকচার') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSStudent.icon('book') + ' ' + SEMSStudent.esc(l.subject || '') + '</span>' +
          (l.chapter ? '<span>' + SEMSStudent.esc(l.chapter) + '</span>' : '') +
          (l.teacherName ? '<span>' + SEMSStudent.icon('users') + ' ' + SEMSStudent.esc(l.teacherName) + '</span>' : '') + '</div>' +
          (l.description ? '<p>' + SEMSStudent.esc(l.description) + '</p>' : '') +
          '<div class="list-actions">' +
          (l.pdfUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSStudent.esc(l.pdfUrl) + '" target="_blank" rel="noopener">' + SEMSStudent.icon('fileText') + ' PDF নোট</a>' : '') +
          (l.slidesUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSStudent.esc(l.slidesUrl) + '" target="_blank" rel="noopener">' + SEMSStudent.icon('image') + ' স্লাইড</a>' : '') +
          (l.recordingUrl ? '<a class="btn btn-outline btn-sm" href="' + SEMSStudent.esc(l.recordingUrl) + '" target="_blank" rel="noopener">' + SEMSStudent.icon('video') + ' রেকর্ডিং</a>' : '') +
          '<a class="btn btn-primary btn-sm" href="lecture-details.html?id=' + encodeURIComponent(l.id) + '">বিস্তারিত</a>' +
          '</div></div>';
      });
    });
    wrap.innerHTML = html;
  }

  function applyFilters() {
    var subject = document.getElementById('subjectFilter').value;
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    var filtered = allLectures.filter(function (l) {
      var okSubject = !subject || l.subject === subject;
      var hay = ((l.title || '') + ' ' + (l.chapter || '') + ' ' + (l.subject || '')).toLowerCase();
      return okSubject && (!q || hay.indexOf(q) !== -1);
    });
    render(filtered);
  }

  try {
    allLectures = await SEMSStudent.getLectures();
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
    sel.addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    render(allLectures);
  } catch (err) {
    console.warn('[SEMS] লেকচার লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('লেকচার লোড করা যায়নি।');
  }
});
