/* SEMS — js/admin/classes.js | Phase 4
 * সব ক্লাসের তালিকা — ব্যাচ/শিক্ষক ফিল্টার, মুছে ফেলা যায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('classes'); } catch (e) { return; }
  var classes = [], batches = [], teachers = [];
  function render() {
    var wrap = document.getElementById('classList');
    var b = document.getElementById('batchFilter').value;
    var list = classes.filter(function (c) { return !b || c.batchId === b; });
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('clock', 'কোনো ক্লাস নেই', 'নতুন ক্লাস তৈরি করুন।');
      return;
    }
    wrap.innerHTML = list.map(function (c) {
      var st = SEMSAdmin.classStatus(c);
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(c.subject || 'ক্লাস') +
        (c.chapter ? ' — ' + SEMSAdmin.esc(c.chapter) : '') + '</h3>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.batchName(c.batchId, batches)) + '</span>' +
        '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(c.date)) + '</span>' +
        '<span>' + SEMSAdmin.esc(c.startTime || '') + (c.endTime ? '–' + SEMSAdmin.esc(c.endTime) : '') + '</span>' +
        '<span>' + SEMSAdmin.esc(c.teacherName || SEMSAdmin.teacherName(c.teacherId, teachers)) + '</span>' +
        '<span class="badge ' + SEMSAdmin.STATUS_CLASS[st] + '">' + SEMSAdmin.STATUS_BN[st] + '</span>' +
        '<span>' + SEMSAdmin.esc(c.mode === 'online' ? 'অনলাইন' : 'অফলাইন') + '</span></div>' +
        '<div class="list-actions">' +
        (c.classLink ? '<a class="btn btn-sm btn-outline" href="' + SEMSAdmin.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাস লিংক</a>' : '') +
        '<button class="btn btn-sm btn-danger" data-del="' + SEMSAdmin.esc(c.id) + '">মুছুন</button></div></div>';
    }).join('');
    wrap.querySelectorAll('button[data-del]').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        if (!window.confirm('এই ক্লাসটি মুছে ফেলবেন?')) return;
        try {
          await SEMSAdmin.deleteDoc('classes', 'sems_demo_classes', btn.getAttribute('data-del'));
          classes = classes.filter(function (c) { return c.id !== btn.getAttribute('data-del'); });
          render();
          if (window.SEMSToast) SEMSToast.success('ক্লাস মুছে ফেলা হয়েছে।');
        } catch (err) {
          if (window.SEMSToast) SEMSToast.error('মুছে ফেলা যায়নি।');
        }
      });
    });
  }
  try {
    classes = await SEMSAdmin.getClasses();
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    var sel = document.getElementById('batchFilter');
    batches.forEach(function (bt) {
      var opt = document.createElement('option');
      opt.value = bt.id;
      opt.textContent = bt.name || bt.id;
      sel.appendChild(opt);
    });
    render();
    sel.addEventListener('change', render);
  } catch (err) {
    console.warn('[SEMS] ক্লাস লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ক্লাস লোড করা যায়নি।');
  }
});
