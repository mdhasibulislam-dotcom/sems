/* SEMS — js/student/notices.js | Phase 2
 * নোটিশ বোর্ড: notices কালেকশন — নতুন নোটিশ, পরীক্ষার তারিখ,
 * ক্লাসের সময় পরিবর্তন, ছুটি, জরুরি ঘোষণা। বিভাগ অনুযায়ী ফিল্টার।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('notices'); } catch (e) { return; }

  var allNotices = [];
  var CAT_BN = { general: 'সাধারণ', exam: 'পরীক্ষা', class: 'ক্লাস', holiday: 'ছুটি', urgent: 'জরুরি' };

  function render(list) {
    var wrap = document.getElementById('noticesWrap');
    if (!wrap) return;
    if (!list.length) {
      wrap.innerHTML = SEMSStudent.emptyState('📢', 'কোনো নোটিশ পাওয়া যায়নি',
        'এই বিভাগে কিছু নেই, অথবা এখনো কোনো নোটিশ দেওয়া হয়নি।');
      return;
    }
    wrap.innerHTML = list.map(function (n) {
      return '<div class="list-item"><h3>' + SEMSStudent.esc(n.title || 'নোটিশ') +
        (n.urgent ? ' <span class="badge badge-urgent">জরুরি</span>' : '') + '</h3>' +
        '<p>' + SEMSStudent.esc(n.body || n.text || '') + '</p>' +
        '<div class="list-meta"><span>📅 ' + SEMSStudent.fmtDate(n.createdAt || n.publishDate || n.date) + '</span>' +
        (n.category ? '<span class="badge badge-info">' + SEMSStudent.esc(CAT_BN[n.category] || n.category) + '</span>' : '') + '</div></div>';
    }).join('');
  }

  try {
    allNotices = await SEMSStudent.getNotices();
    var sel = document.getElementById('categoryFilter');
    if (sel) {
      sel.addEventListener('change', function () {
        var v = sel.value;
        render(v ? allNotices.filter(function (n) { return n.category === v || (v === 'urgent' && n.urgent); }) : allNotices);
      });
    }
    render(allNotices);
  } catch (err) {
    console.warn('[SEMS] নোটিশ লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('নোটিশ লোড করা যায়নি।');
  }
});
