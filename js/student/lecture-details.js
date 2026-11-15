/* SEMS — js/student/lecture-details.js | Phase 2
 * একক লেকচারের বিস্তারিত (?id=): lectures ডক থেকে পড়া,
 * PDF/স্লাইড/রেকর্ডিং ডাউনলোড লিংকসহ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('lectures'); } catch (e) { return; }

  var wrap = document.getElementById('lectureWrap');
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');
  if (!wrap) return;
  if (!id) {
    wrap.innerHTML = SEMSStudent.emptyState('📚', 'কোনো লেকচার নির্বাচন করা হয়নি', 'লেকচার তালিকা থেকে একটি লেকচার খুলুন।');
    return;
  }
  try {
    var l = await SEMSStudent.getLectureById(id);
    if (!l) {
      wrap.innerHTML = SEMSStudent.emptyState('📚', 'লেকচারটি পাওয়া যায়নি', 'এটি মুছে ফেলা হতে পারে বা এখনো প্রকাশিত হয়নি।');
      return;
    }
    var title = document.getElementById('lectureTitle');
    if (title) title.textContent = l.title || 'লেকচার';
    var materials = '';
    if (l.pdfUrl) materials += '<a class="btn btn-primary" href="' + SEMSStudent.esc(l.pdfUrl) + '" target="_blank" rel="noopener" download>📄 PDF নোট ডাউনলোড</a>';
    if (l.slidesUrl) materials += '<a class="btn btn-outline" href="' + SEMSStudent.esc(l.slidesUrl) + '" target="_blank" rel="noopener" download>🖼️ স্লাইড ডাউনলোড</a>';
    if (l.recordingUrl) materials += '<a class="btn btn-outline" href="' + SEMSStudent.esc(l.recordingUrl) + '" target="_blank" rel="noopener">🎥 ক্লাস রেকর্ডিং দেখুন</a>';
    wrap.innerHTML =
      '<dl class="kv">' +
      '<dt>বিষয়</dt><dd>' + SEMSStudent.esc(l.subject || '—') + '</dd>' +
      '<dt>অধ্যায়</dt><dd>' + SEMSStudent.esc(l.chapter || '—') + '</dd>' +
      '<dt>শিক্ষক</dt><dd>' + SEMSStudent.esc(l.teacherName || '—') + '</dd>' +
      '<dt>তারিখ</dt><dd>' + SEMSStudent.fmtDate(l.publishDate || l.date) + '</dd>' +
      '</dl>' +
      (l.description ? '<h3 class="section-title">বিবরণ</h3><p>' + SEMSStudent.esc(l.description) + '</p>' : '') +
      '<h3 class="section-title">উপকরণ</h3>' +
      (materials
        ? '<div class="list-actions">' + materials + '</div>'
        : '<p class="muted">এই লেকচারের জন্য এখনো কোনো উপকরণ (PDF/স্লাইড/রেকর্ডিং) দেওয়া হয়নি।</p>');
  } catch (err) {
    console.warn('[SEMS] লেকচার বিস্তারিত লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('লেকচার লোড করা যায়নি।');
  }
});
