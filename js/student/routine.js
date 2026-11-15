/* SEMS — js/student/routine.js | Phase 2
 * সাপ্তাহিক ক্লাস রুটিন: classes কালেকশন (batchId অনুযায়ী)।
 * স্ট্যাটাস: তারিখ+সময় থেকে আসন্ন / চলমান / সম্পন্ন।
 * classes কালেকশনে কিছু না থাকলে বাংলায় খালি অবস্থা দেখায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('routine'); } catch (e) { return; }

  var DAYS = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];
  // JS getDay(): 0=রবি ... 6=শনি — বাংলাদেশের সপ্তাহ শনিবার থেকে শুরু
  var DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

  try {
    var profile = await SEMSStudent.getProfile(user);
    var batchId = profile.courseBatch || profile.batchId || '';
    var classes = await SEMSStudent.getClasses(batchId);
    var wrap = document.getElementById('routineWrap');
    if (!wrap) return;
    if (!classes.length) {
      wrap.innerHTML = SEMSStudent.emptyState('🗓️', 'এখনো কোনো ক্লাস রুটিন দেওয়া হয়নি',
        'অ্যাডমিন রুটিন যোগ করলে এখানে সপ্তাহের ক্লাসের সময়সূচি দেখা যাবে।');
      return;
    }
    var byDay = {};
    classes.forEach(function (c) {
      var d = SEMSStudent.toDate(c.date);
      if (!d) return;
      var key = d.getDay();
      if (!byDay[key]) byDay[key] = [];
      byDay[key].push(c);
    });
    var todayDay = new Date().getDay();
    var html = '';
    DAY_ORDER.forEach(function (dayNum) {
      var list = byDay[dayNum] || [];
      html += '<div class="day-block"><h3>' + DAYS[dayNum === 6 ? 0 : dayNum + 1] +
        (dayNum === todayDay ? '<span class="today-tag">আজ</span>' : '') + '</h3>';
      if (!list.length) {
        html += '<p class="muted">এই দিনে কোনো ক্লাস নেই।</p>';
      } else {
        list.forEach(function (c) {
          var st = SEMSStudent.classStatus(c);
          html += '<div class="list-item"><h3>' + SEMSStudent.esc(c.subject || 'ক্লাস') +
            ' <span class="badge ' + SEMSStudent.STATUS_CLASS[st] + '">' + SEMSStudent.STATUS_BN[st] + '</span></h3>' +
            '<div class="list-meta"><span>📅 ' + SEMSStudent.fmtDate(c.date) + '</span>' +
            (c.startTime ? '<span>🕐 ' + SEMSStudent.esc(c.startTime) + (c.endTime ? ' – ' + SEMSStudent.esc(c.endTime) : '') + '</span>' : '') +
            (c.teacherName ? '<span>👨‍🏫 ' + SEMSStudent.esc(c.teacherName) + '</span>' : '') +
            (c.mode ? '<span>' + (c.mode === 'online' ? '💻 অনলাইন' : '🏫 অফলাইন') + '</span>' : '') + '</div>' +
            (c.classLink ? '<div class="list-actions"><a class="btn btn-primary btn-sm" href="' + SEMSStudent.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাসে যোগ দিন</a></div>' : '') +
            '</div>';
        });
      }
      html += '</div>';
    });
    wrap.innerHTML = html;
  } catch (err) {
    console.warn('[SEMS] রুটিন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('রুটিন লোড করা যায়নি।');
  }
});
