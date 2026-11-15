/* SEMS — js/admin/notifications.js | Phase 4
 * নোটিফিকেশন কেন্দ্র (অ্যাডমিন দৃষ্টিকোণ): প্রকাশিত নোটিশ +
 * সাম্প্রতিক কার্যকলাপ (নতুন আবেদন, নতুন পরীক্ষা, নতুন লেকচার)।
 * নোট: notifications নামে আলাদা কালেকশন Rules-এ নেই, তাই এই
 * পেজ নতুন কালেকশনে লেখে না — নোটিশ + কার্যকলাপ দেখায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('notices'); } catch (e) { return; }
  try {
    var notices = await SEMSAdmin.getNotices();
    var admissions = await SEMSAdmin.getAdmissions();
    var exams = await SEMSAdmin.getExams();
    var lectures = await SEMSAdmin.getLectures();
    var nt = document.getElementById('noticeList');
    if (!notices.length) {
      nt.innerHTML = SEMSAdmin.emptyState('megaphone', 'কোনো নোটিশ নেই', 'নোটিশ পেজ থেকে নোটিশ প্রকাশ করুন।');
    } else {
      nt.innerHTML = notices.map(function (n) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(n.title || '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(n.createdAt)) + '</span>' +
          (n.urgent ? '<span class="badge badge-urgent">জরুরি</span>' : '') + '</div></div>';
      }).join('');
    }
    var activity = [];
    admissions.slice(0, 5).forEach(function (a) {
      activity.push({ when: a.createdAt, text: 'নতুন ভর্তি আবেদন: ' + (a.fullName || a.name || 'আবেদনকারী'), icon: 'users' });
    });
    exams.slice(0, 5).forEach(function (e) {
      activity.push({ when: e.createdAt || e.date, text: 'পরীক্ষা: ' + (e.title || ''), icon: 'clipboard' });
    });
    lectures.slice(0, 5).forEach(function (l) {
      activity.push({ when: l.createdAt || l.publishDate, text: 'লেকচার প্রকাশ: ' + (l.title || ''), icon: 'book' });
    });
    activity.sort(function (a, b) {
      var da = SEMSAdmin.toDate(a.when) || new Date(0), dbb = SEMSAdmin.toDate(b.when) || new Date(0);
      return dbb - da;
    });
    var aw = document.getElementById('activityList');
    if (!activity.length) {
      aw.innerHTML = SEMSAdmin.emptyState('bell', 'কোনো কার্যকলাপ নেই', 'আবেদন, পরীক্ষা বা লেকচার এলে এখানে দেখা যাবে।');
    } else {
      aw.innerHTML = activity.slice(0, 10).map(function (a) {
        return '<div class="list-item"><h3>' + SEMSAdmin.icon(a.icon) + ' ' + SEMSAdmin.esc(a.text) + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(a.when)) + '</span></div></div>';
      }).join('');
    }
  } catch (err) {
    console.warn('[SEMS] নোটিফিকেশন লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('নোটিফিকেশন লোড করা যায়নি।');
  }
});
