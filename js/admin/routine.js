/* SEMS — js/admin/routine.js | Phase 4
 * পুরো রুটিন — সব ক্লাস তারিখ অনুযায়ী গ্রুপ করে, "আজ" ট্যাগসহ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('routine'); } catch (e) { return; }
  var classes = [], batches = [], teachers = [];
  function render() {
    var wrap = document.getElementById('routineWrap');
    var b = document.getElementById('batchFilter').value;
    var list = classes.filter(function (c) { return !b || c.batchId === b; });
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('timer', 'রুটিনে কোনো ক্লাস নেই', 'ক্লাস তৈরি করলে এখানে তারিখ অনুযায়ী দেখা যাবে।');
      return;
    }
    var groups = {};
    list.forEach(function (c) {
      var d = SEMSAdmin.toDate(c.date);
      var key = d ? SEMSAdmin.dateKey(d) : 'তারিখ নেই';
      (groups[key] = groups[key] || []).push(c);
    });
    var today = SEMSAdmin.todayKey();
    wrap.innerHTML = Object.keys(groups).sort().map(function (key) {
      var day = groups[key];
      var label = key === today ? SEMSAdmin.fmtDate(key) + ' <span class="today-tag">আজ</span>' : SEMSAdmin.fmtDate(key);
      return '<div class="day-block"><h3>' + label + '</h3>' + day.map(function (c) {
        var st = SEMSAdmin.classStatus(c);
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(c.subject || 'ক্লাস') +
          (c.chapter ? ' — ' + SEMSAdmin.esc(c.chapter) : '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.batchName(c.batchId, batches)) + '</span>' +
          '<span>' + SEMSAdmin.esc(c.startTime || '') + (c.endTime ? '–' + SEMSAdmin.esc(c.endTime) : '') + '</span>' +
          '<span>' + SEMSAdmin.esc(c.teacherName || SEMSAdmin.teacherName(c.teacherId, teachers)) + '</span>' +
          '<span class="badge ' + SEMSAdmin.STATUS_CLASS[st] + '">' + SEMSAdmin.STATUS_BN[st] + '</span></div></div>';
      }).join('') + '</div>';
    }).join('');
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
    console.warn('[SEMS] রুটিন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রুটিন লোড করা যায়নি।');
  }
});
