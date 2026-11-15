/* SEMS — js/teacher/dashboard.js | Phase 3
 * শিক্ষক ড্যাশবোর্ড: স্বাগতম, নিজের ব্যাচ/শিক্ষার্থী/আজকের ক্লাসের
 * সংখ্যা, আজকের ক্লাস, নিজের ব্যাচ, সর্বশেষ নোটিশ, সাম্প্রতিক
 * লেকচার, জমা বাকি অ্যাসাইনমেন্ট ও আসন্ন পরীক্ষা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('dashboard'); } catch (e) { return; }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function classRow(c, batches) {
    var st = SEMSTeacher.classStatus(c);
    var batch = null;
    (batches || []).forEach(function (b) { if (b.id === c.batchId) batch = b; });
    return '<div class="list-item"><h3>' + SEMSTeacher.esc(c.subject || 'ক্লাস') +
      ' <span class="badge ' + SEMSTeacher.STATUS_CLASS[st] + '">' + SEMSTeacher.STATUS_BN[st] + '</span></h3>' +
      '<div class="list-meta"><span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(c.date) + '</span>' +
      (c.startTime ? '<span>' + SEMSTeacher.icon('clock') + ' ' + SEMSTeacher.esc(c.startTime) + (c.endTime ? ' – ' + SEMSTeacher.esc(c.endTime) : '') + '</span>' : '') +
      (batch ? '<span>' + SEMSTeacher.icon('users') + ' ' + SEMSTeacher.esc(batch.name || batch.title || '') + '</span>' : '') +
      (c.chapter ? '<span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(c.chapter) + '</span>' : '') + '</div>' +
      (c.classLink ? '<div class="list-actions"><a class="btn btn-primary btn-sm" href="' + SEMSTeacher.esc(c.classLink) + '" target="_blank" rel="noopener">ক্লাস লিংক</a></div>' : '') +
      '</div>';
  }

  try {
    var profile = await SEMSTeacher.getProfile(user);
    var name = profile.name || user.displayName || user.name || user.email || 'শিক্ষক';
    setHtml('welcomeText', 'স্বাগতম, ' + SEMSTeacher.esc(name) + '!');

    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var students = await SEMSTeacher.getMyStudents(user.uid);
    var classes = await SEMSTeacher.getMyClasses(user.uid);
    var today = classes.filter(function (c) {
      return SEMSTeacher.toDate(c.date) && SEMSTeacher.dateKey(SEMSTeacher.toDate(c.date)) === SEMSTeacher.todayKey();
    });
    var assignments = await SEMSTeacher.getAssignments(user.uid);
    var pending = assignments.filter(function (a) {
      var due = SEMSTeacher.toDate(a.dueDate);
      return !due || due >= new Date();
    });

    setText('statBatches', SEMSTeacher.bnDigits(batches.length));
    setText('statStudents', SEMSTeacher.bnDigits(students.length));
    setText('statToday', SEMSTeacher.bnDigits(today.length));
    setText('statPending', SEMSTeacher.bnDigits(pending.length));

    setHtml('todayClasses', today.length
      ? today.map(function (c) { return classRow(c, batches); }).join('')
      : SEMSTeacher.emptyState('calendar', 'আজ কোনো ক্লাস নেই', 'আজকের জন্য আপনার কোনো ক্লাস নির্ধারিত হয়নি।'));

    setHtml('myBatches', batches.length
      ? batches.map(function (b) {
          var count = students.filter(function (s) { return s.batchId === b.id; }).length;
          return '<div class="list-item"><h3>' + SEMSTeacher.esc(b.name || b.title || SEMSTeacher.batchLabel(b.id)) + '</h3>' +
            '<div class="list-meta"><span>' + SEMSTeacher.icon('users') + ' ' + SEMSTeacher.bnDigits(count) + ' জন শিক্ষার্থী</span>' +
            (b.subject ? '<span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(b.subject) + '</span>' : '') + '</div></div>';
        }).join('')
      : SEMSTeacher.emptyState('users', 'এখনো কোনো ব্যাচ নেই', 'অ্যাডমিন আপনাকে ব্যাচ দিলে এখানে দেখা যাবে।'));

    var notices = await SEMSTeacher.getNotices();
    setHtml('latestNotices', notices.length
      ? '<div class="list-item"><h3>' + SEMSTeacher.esc(notices[0].title || 'নোটিশ') +
        (notices[0].urgent ? ' <span class="badge badge-urgent">জরুরি</span>' : '') + '</h3>' +
        '<p>' + SEMSTeacher.esc(notices[0].body || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(notices[0].createdAt || notices[0].publishDate || notices[0].date) + '</span></div></div>'
      : SEMSTeacher.emptyState('megaphone', 'কোনো নোটিশ নেই', 'অ্যাডমিন নোটিশ দিলে এখানে দেখা যাবে।'));

    var lectures = await SEMSTeacher.getMyLectures(user.uid);
    setHtml('recentLectures', lectures.length
      ? lectures.slice(0, 3).map(function (l) {
          return '<div class="list-item"><h3>' + SEMSTeacher.esc(l.title || 'লেকচার') + '</h3>' +
            '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(l.subject || '') + '</span>' +
            (l.chapter ? '<span>' + SEMSTeacher.esc(l.chapter) + '</span>' : '') +
            '<span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(l.publishDate || l.date) + '</span></div></div>';
        }).join('')
      : SEMSTeacher.emptyState('book', 'এখনো কোনো লেকচার প্রকাশ করেননি', '"লেকচার আপলোড" পেজ থেকে নতুন লেকচার প্রকাশ করুন।'));

    var exams = await SEMSTeacher.getExams(user.uid);
    var upcomingExams = exams.filter(function (e) {
      var d = SEMSTeacher.toDate(e.date);
      return d && d >= new Date(new Date().toDateString());
    }).slice(0, 3);
    var pendingHtml = '';
    if (pending.length) {
      pendingHtml += pending.slice(0, 3).map(function (a) {
        return '<div class="list-item"><h3>' + SEMSTeacher.esc(a.title || 'অ্যাসাইনমেন্ট') +
          ' <span class="badge badge-exam">জমা বাকি</span></h3>' +
          '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(a.subject || '') + '</span>' +
          '<span>' + SEMSTeacher.icon('clock') + ' শেষ তারিখ: ' + SEMSTeacher.fmtDate(a.dueDate) + '</span></div></div>';
      }).join('');
    }
    if (upcomingExams.length) {
      pendingHtml += upcomingExams.map(function (e) {
        return '<div class="list-item"><h3>' + SEMSTeacher.esc(e.title || 'পরীক্ষা') +
          ' <span class="badge badge-info">পরীক্ষা</span></h3>' +
          '<div class="list-meta"><span>' + SEMSTeacher.icon('book') + ' ' + SEMSTeacher.esc(e.subject || '') + '</span>' +
          '<span>' + SEMSTeacher.icon('calendar') + ' ' + SEMSTeacher.fmtDate(e.date) + '</span>' +
          (e.totalMarks ? '<span>মোট নম্বর: ' + SEMSTeacher.bnDigits(e.totalMarks) + '</span>' : '') + '</div></div>';
      }).join('');
    }
    setHtml('pendingWork', pendingHtml || SEMSTeacher.emptyState('fileText', 'জমা বাকি কিছু নেই', 'নতুন অ্যাসাইনমেন্ট বা পরীক্ষা তৈরি করলে এখানে দেখা যাবে।'));
  } catch (err) {
    console.warn('[SEMS] ড্যাশবোর্ড লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ড্যাশবোর্ডের তথ্য লোড করা যায়নি।');
  }
});
