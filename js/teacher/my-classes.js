/* SEMS — js/teacher/my-classes.js | Phase 3
 * নিজের ক্লাসের তালিকা: classes where teacherId == uid।
 * ব্যাচ ফিল্টার + বিষয়/অধ্যায় খোঁজা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('my-classes'); } catch (e) { return; }

  var allClasses = [];
  var batches = [];

  function batchName(id) {
    for (var i = 0; i < batches.length; i++) {
      if (batches[i].id === id) return batches[i].name || batches[i].title || SEMSTeacher.batchLabel(id);
    }
    return id ? SEMSTeacher.batchLabel(id) : '';
  }

  function render() {
    var wrap = document.getElementById('classesWrap');
    if (!wrap) return;
    var bf = document.getElementById('batchFilter').value;
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    var list = allClasses.filter(function (c) {
      if (bf && c.batchId !== bf) return false;
      if (q) {
        var hay = ((c.subject || '') + ' ' + (c.chapter || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (!list.length) {
      wrap.innerHTML = allClasses.length
        ? SEMSTeacher.emptyState('search', 'খুঁজে কিছু পাওয়া যায়নি', 'অন্য ব্যাচ বা অন্য শব্দ দিয়ে চেষ্টা করুন।')
        : SEMSTeacher.emptyState('calendar', 'এখনো কোনো ক্লাস নেই', 'অ্যাডমিন আপনার জন্য ক্লাস নির্ধারণ করলে এখানে দেখা যাবে।');
      return;
    }
    wrap.innerHTML = list.map(function (c) {
      var st = SEMSTeacher.classStatus(c);
      return '<div class="list-item"><h3>' + SEMSTeacher.esc(c.subject || 'ক্লাস') +
        ' <span class="badge ' + SEMSTeacher.STATUS_CLASS[st] + '">' + SEMSTeacher.STATUS_BN[st] + '</span></h3>' +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(c.date) + '</span>' +
        (c.startTime ? '<span>' + SEMSTeacher.icon('clock') + ' ' + SEMSTeacher.esc(c.startTime) + (c.endTime ? ' – ' + SEMSTeacher.esc(c.endTime) : '') + '</span>' : '') +
        (c.batchId ? '<span>' + SEMSTeacher.icon('users') + ' ' + SEMSTeacher.esc(batchName(c.batchId)) + '</span>' : '') +
        (c.chapter ? '<span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(c.chapter) + '</span>' : '') +
        (c.mode ? '<span>' + (c.mode === 'online' ? SEMSTeacher.icon('monitor') + ' অনলাইন' : SEMSTeacher.icon('mapPin') + ' অফলাইন') + '</span>' : '') + '</div>' +
        (c.classLink ? '<div class="list-actions"><a class="btn btn-primary btn-sm" href="' + SEMSTeacher.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাস লিংক</a></div>' : '') +
        '<div class="list-actions"><a class="btn btn-outline btn-sm" href="attendance.html?classId=' + encodeURIComponent(c.id) + '">উপস্থিতি নিন</a></div>' +
        '</div>';
    }).join('');
  }

  try {
    batches = await SEMSTeacher.getMyBatches(user.uid);
    var sel = document.getElementById('batchFilter');
    batches.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || b.title || SEMSTeacher.batchLabel(b.id);
      sel.appendChild(opt);
    });
    allClasses = await SEMSTeacher.getMyClasses(user.uid);
    render();
    sel.addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] ক্লাস লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ক্লাস লোড করা যায়নি।');
  }
});
