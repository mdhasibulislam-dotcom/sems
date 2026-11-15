/* SEMS — js/teacher/routine.js | Phase 3
 * নিজের সাপ্তাহিক রুটিন: নিজের ক্লাসগুলো তারিখ অনুযায়ী গ্রুপ করে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('routine'); } catch (e) { return; }

  try {
    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var classes = await SEMSTeacher.getMyClasses(user.uid);
    var wrap = document.getElementById('routineWrap');
    if (!wrap) return;

    function batchName(id) {
      for (var i = 0; i < batches.length; i++) {
        if (batches[i].id === id) return batches[i].name || batches[i].title || SEMSTeacher.batchLabel(id);
      }
      return id ? SEMSTeacher.batchLabel(id) : '';
    }

    if (!classes.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('clock', 'রুটিনে এখনো কোনো ক্লাস নেই', 'অ্যাডমিন আপনার জন্য ক্লাস নির্ধারণ করলে এখানে রুটিন দেখা যাবে।');
      return;
    }

    // তারিখ অনুযায়ী গ্রুপ
    var groups = {};
    classes.forEach(function (c) {
      var d = SEMSTeacher.toDate(c.date);
      if (!d) return;
      var key = SEMSTeacher.dateKey(d);
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    var keys = Object.keys(groups).sort();
    var today = SEMSTeacher.todayKey();

    wrap.innerHTML = keys.map(function (key) {
      var list = groups[key];
      var isToday = key === today;
      var head = SEMSTeacher.fmtDate(list[0].date) + (isToday ? ' <span class="today-tag">আজ</span>' : '');
      return '<div class="day-block"><h3>' + head + '</h3>' +
        list.map(function (c) {
          var st = SEMSTeacher.classStatus(c);
          return '<div class="list-item"><h3>' + SEMSTeacher.esc(c.subject || 'ক্লাস') +
            ' <span class="badge ' + SEMSTeacher.STATUS_CLASS[st] + '">' + SEMSTeacher.STATUS_BN[st] + '</span></h3>' +
            '<div class="list-meta">' +
            (c.startTime ? '<span>' + SEMSTeacher.icon('clock') + ' ' + SEMSTeacher.esc(c.startTime) + (c.endTime ? ' – ' + SEMSTeacher.esc(c.endTime) : '') + '</span>' : '') +
            (c.batchId ? '<span>' + SEMSTeacher.icon('users') + ' ' + SEMSTeacher.esc(batchName(c.batchId)) + '</span>' : '') +
            (c.chapter ? '<span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(c.chapter) + '</span>' : '') +
            (c.mode ? '<span>' + (c.mode === 'online' ? SEMSTeacher.icon('monitor') + ' অনলাইন' : SEMSTeacher.icon('mapPin') + ' অফলাইন') + '</span>' : '') + '</div>' +
            (c.classLink ? '<div class="list-actions"><a class="btn btn-primary btn-sm" href="' + SEMSTeacher.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাস লিংক</a></div>' : '') +
            '</div>';
        }).join('') + '</div>';
    }).join('');
  } catch (err) {
    console.warn('[SEMS] রুটিন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রুটিন লোড করা যায়নি।');
  }
});
