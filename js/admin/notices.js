/* SEMS — js/admin/notices.js | Phase 4
 * নোটিশ তৈরি/প্রকাশ + তালিকা + মুছে ফেলা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('notices'); } catch (e) { return; }
  var notices = [];
  function render() {
    var wrap = document.getElementById('noticeList');
    if (!notices.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('megaphone', 'কোনো নোটিশ নেই', 'নিচের ফরম থেকে নোটিশ প্রকাশ করুন।');
      return;
    }
    wrap.innerHTML = notices.map(function (n) {
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(n.title || '') + '</h3>' +
        '<p>' + SEMSAdmin.esc(n.body || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(n.createdAt)) + '</span>' +
        '<span>বিভাগ: ' + SEMSAdmin.esc(n.category || 'general') + '</span>' +
        (n.urgent ? '<span class="badge badge-urgent">জরুরি</span>' : '') + '</div>' +
        '<div class="list-actions"><button class="btn btn-sm btn-danger" data-del="' + SEMSAdmin.esc(n.id) + '">মুছুন</button></div></div>';
    }).join('');
    wrap.querySelectorAll('button[data-del]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!window.confirm('এই নোটিশটি মুছে ফেলবেন?')) return;
        try {
          await SEMSAdmin.deleteDoc('notices', 'sems_demo_notices', btn.getAttribute('data-del'));
          notices = notices.filter(function (n) { return n.id !== btn.getAttribute('data-del'); });
          render();
          if (window.SEMSToast) SEMSToast.success('নোটিশ মুছে ফেলা হয়েছে।');
        } catch (err) {
          if (window.SEMSToast) SEMSToast.error('মুছে ফেলা যায়নি।');
        }
      });
    });
  }
  try {
    notices = await SEMSAdmin.getNotices();
    render();
  } catch (err) {
    console.warn('[SEMS] নোটিশ লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('নোটিশ লোড করা যায়নি।');
  }
  document.getElementById('noticeForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      title: document.getElementById('noticeTitle').value.trim(),
      body: document.getElementById('noticeBody').value.trim(),
      category: document.getElementById('noticeCategory').value,
      urgent: document.getElementById('noticeUrgent').value === '1'
    };
    if (!data.title || !data.body) {
      errBox.textContent = 'নোটিশের শিরোনাম ও লেখা পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addNotice(user, data);
      notices.unshift(rec);
      render();
      SEMSLoader.hide();
      okBox.textContent = 'নোটিশ প্রকাশ হয়েছে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('নোটিশ প্রকাশ হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'নোটিশ প্রকাশ করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
