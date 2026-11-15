/* SEMS — js/student/dashboard.js | Phase 2
 * শিক্ষার্থী ড্যাশবোর্ড: স্বাগতম, প্রোফাইল সংক্ষেপ, আজকের ক্লাস,
 * আসন্ন ক্লাস, সর্বশেষ নোটিশ, সাম্প্রতিক লেকচার, উপস্থিতির সংক্ষেপ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('dashboard'); } catch (e) { return; }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function classRow(c) {
    var st = SEMSStudent.classStatus(c);
    return '<div class="list-item"><h3>' + SEMSStudent.esc(c.subject || 'ক্লাস') +
      ' <span class="badge ' + SEMSStudent.STATUS_CLASS[st] + '">' + SEMSStudent.STATUS_BN[st] + '</span></h3>' +
      '<div class="list-meta"><span>' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.fmtDate(c.date) + '</span>' +
      (c.startTime ? '<span>' + SEMSStudent.icon('clock') + ' ' + SEMSStudent.esc(c.startTime) + (c.endTime ? ' – ' + SEMSStudent.esc(c.endTime) : '') + '</span>' : '') +
      (c.teacherName ? '<span>' + SEMSStudent.icon('users') + ' ' + SEMSStudent.esc(c.teacherName) + '</span>' : '') +
      (c.mode ? '<span>' + (c.mode === 'online' ? SEMSStudent.icon('monitor') + ' অনলাইন' : SEMSStudent.icon('mapPin') + ' অফলাইন') + '</span>' : '') + '</div>' +
      (c.classLink ? '<div class="list-actions"><a class="btn btn-primary btn-sm" href="' + SEMSStudent.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাসে যোগ দিন</a></div>' : '') +
      '</div>';
  }

  try {
    var profile = await SEMSStudent.getProfile(user);
    var name = profile.fullName || profile.name || user.displayName || user.name || user.email || 'শিক্ষার্থী';
    var batchId = profile.courseBatch || profile.batchId || '';
    var batch = batchId ? await SEMSStudent.getBatch(batchId) : null;
    var batchName = batch ? (batch.name || batch.title || SEMSStudent.batchLabel(batchId)) : (batchId ? SEMSStudent.batchLabel(batchId) : '—');
    var studentId = 'SEMS-' + String(user.uid || '').slice(-6).toUpperCase();

    setHtml('welcomeText', 'স্বাগতম, ' + SEMSStudent.esc(name) + '!');
    setHtml('profileSummary',
      '<div class="profile-top">' +
      '<div class="profile-photo">' + (profile.photoURL ? '<img src="' + SEMSStudent.esc(profile.photoURL) + '" alt="ছবি">' : SEMSStudent.esc(String(name).charAt(0))) + '</div>' +
      '<div><h2>' + SEMSStudent.esc(name) + '</h2>' +
      '<dl class="kv">' +
      '<dt>শিক্ষার্থী আইডি</dt><dd>' + SEMSStudent.esc(studentId) + '</dd>' +
      '<dt>কোর্স / ব্যাচ</dt><dd>' + SEMSStudent.esc(batchName) + '</dd>' +
      '<dt>কলেজ</dt><dd>' + SEMSStudent.esc(profile.collegeName || '—') + '</dd>' +
      '<dt>মোবাইল</dt><dd>' + SEMSStudent.esc(profile.mobile || profile.phone || '—') + '</dd>' +
      '</dl>' +
      '<div class="list-actions"><a class="btn btn-outline btn-sm" href="profile.html">প্রোফাইল দেখুন</a></div>' +
      '</div></div>');

    var classes = await SEMSStudent.getClasses(batchId);
    var today = classes.filter(function (c) { return SEMSStudent.toDate(c.date) && SEMSStudent.dateKey(SEMSStudent.toDate(c.date)) === SEMSStudent.todayKey(); });
    setHtml('todayClass', today.length
      ? today.map(classRow).join('')
      : SEMSStudent.emptyState('calendar', 'আজ কোনো ক্লাস নেই', 'আজকের জন্য কোনো ক্লাস নির্ধারিত হয়নি।'));
    var upcoming = classes.filter(function (c) { return SEMSStudent.classStatus(c) !== 'Completed'; }).slice(0, 3);
    setHtml('upcomingClasses', upcoming.length
      ? upcoming.map(classRow).join('')
      : SEMSStudent.emptyState('calendar', 'আসন্ন কোনো ক্লাস নেই', 'অ্যাডমিন রুটিন যোগ করলে এখানে আসন্ন ক্লাস দেখা যাবে।'));

    var notices = await SEMSStudent.getNotices();
    setHtml('latestNotice', notices.length
      ? '<div class="list-item"><h3>' + SEMSStudent.esc(notices[0].title || 'নোটিশ') +
        (notices[0].urgent ? ' <span class="badge badge-urgent">জরুরি</span>' : '') + '</h3>' +
        '<p>' + SEMSStudent.esc(notices[0].body || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.fmtDate(notices[0].createdAt || notices[0].publishDate || notices[0].date) + '</span></div></div>'
      : SEMSStudent.emptyState('megaphone', 'কোনো নোটিশ নেই', 'অ্যাডমিন নোটিশ দিলে এখানে দেখা যাবে।'));

    var lectures = await SEMSStudent.getLectures();
    setHtml('recentLectures', lectures.length
      ? lectures.slice(0, 3).map(function (l) {
        return '<div class="list-item"><h3>' + SEMSStudent.esc(l.title || 'লেকচার') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSStudent.icon('book') + ' ' + SEMSStudent.esc(l.subject || '') + '</span>' +
          (l.chapter ? '<span>' + SEMSStudent.esc(l.chapter) + '</span>' : '') +
          '<span>' + SEMSStudent.icon('calendar') + ' ' + SEMSStudent.fmtDate(l.publishDate || l.date) + '</span></div>' +
          '<div class="list-actions"><a class="btn btn-outline btn-sm" href="lecture-details.html?id=' + encodeURIComponent(l.id) + '">বিস্তারিত</a></div></div>';
      }).join('')
      : SEMSStudent.emptyState('book', 'এখনো কোনো লেকচার প্রকাশিত হয়নি', 'শিক্ষক/অ্যাডমিন লেকচার প্রকাশ করলে এখানে দেখা যাবে।'));

    var attendance = await SEMSStudent.getAttendance(user.uid);
    var total = attendance.length;
    var present = attendance.filter(function (a) { return a.status === 'present'; }).length;
    var pct = total ? Math.round((present / total) * 100) : 0;
    setHtml('attendanceSummary', total
      ? '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(pct) + '%</div><div class="lbl">উপস্থিতি (' + SEMSStudent.bnDigits(present) + '/' + SEMSStudent.bnDigits(total) + ' ক্লাস)</div>' +
        '<div class="progress"><span style="width:' + pct + '%"></span></div></div>'
      : SEMSStudent.emptyState('checkCircle', 'উপস্থিতির তথ্য নেই', 'শিক্ষক উপস্থিতি নিলে এখানে হার দেখা যাবে।'));
  } catch (err) {
    console.warn('[SEMS] ড্যাশবোর্ড লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ড্যাশবোর্ডের তথ্য লোড করা যায়নি।');
  }
});
