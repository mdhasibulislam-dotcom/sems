/* SEMS — js/admin/dashboard.js | Phase 4
 * অ্যাডমিন ড্যাশবোর্ড: মোট শিক্ষার্থী/শিক্ষক/ব্যাচ/ক্লাস, বাকি
 * ভর্তি আবেদন, আজকের ক্লাস, সর্বশেষ নোটিশ।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('dashboard'); } catch (e) { return; }
  // admin/dashboard.html-এ welcomeText এলিমেন্ট নেই (শুধু
  // student/teacher ড্যাশবোর্ডে আছে) — গার্ড ছাড়া এখানে থ্রো
  // করে পুরো ড্যাশবোর্ড লোড বন্ধ হয়ে যেতো।
  var welcomeEl = document.getElementById('welcomeText');
  if (welcomeEl) welcomeEl.textContent =
    'স্বাগতম, ' + (user.displayName || user.name || user.email || 'অ্যাডমিন') + '!';
  try {
    var students = await SEMSAdmin.getStudents();
    var teachers = await SEMSAdmin.getTeachers();
    var batches = await SEMSAdmin.getBatches();
    var classes = await SEMSAdmin.getClasses();
    var pending = await SEMSAdmin.getPendingAdmissions();
    var pendingTeachers = await SEMSAdmin.getPendingTeacherApplications();
    var notices = await SEMSAdmin.getNotices();
    var lectures = await SEMSAdmin.getLectures();
    var exams = await SEMSAdmin.getExams();
    document.getElementById('statStudents').textContent = SEMSAdmin.bnDigits(students.length);
    document.getElementById('statTeachers').textContent = SEMSAdmin.bnDigits(teachers.length);
    document.getElementById('statBatches').textContent = SEMSAdmin.bnDigits(batches.length);
    document.getElementById('statPending').textContent = SEMSAdmin.bnDigits(pending.length);
    document.getElementById('statTeacherRequests').textContent = SEMSAdmin.bnDigits(pendingTeachers.length);
    var today = SEMSAdmin.todayKey();
    var todayClasses = classes.filter(function (c) {
      var d = SEMSAdmin.toDate(c.date);
      return d && SEMSAdmin.dateKey(d) === today;
    });
    var tc = document.getElementById('todayClasses');
    if (!todayClasses.length) {
      tc.innerHTML = SEMSAdmin.emptyState('calendar', 'আজ কোনো ক্লাস নেই', 'রুটিনে ক্লাস যোগ করলে এখানে দেখা যাবে।');
    } else {
      tc.innerHTML = todayClasses.map(function (c) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(c.subject || 'ক্লাস') +
          (c.chapter ? ' — ' + SEMSAdmin.esc(c.chapter) : '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.batchName(c.batchId, batches)) + '</span>' +
          '<span>' + SEMSAdmin.esc(c.startTime || '') + (c.endTime ? '–' + SEMSAdmin.esc(c.endTime) : '') + '</span>' +
          '<span>' + SEMSAdmin.esc(c.teacherName || SEMSAdmin.teacherName(c.teacherId, teachers)) + '</span></div></div>';
      }).join('');
    }
    var pa = document.getElementById('pendingAdmissions');
    if (!pending.length) {
      pa.innerHTML = SEMSAdmin.emptyState('checkCircle', 'কোনো বাকি আবেদন নেই', 'নতুন ভর্তি আবেদন এলে এখানে দেখা যাবে।');
    } else {
      pa.innerHTML = pending.slice(0, 5).map(function (a) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(a.fullName || a.name || 'আবেদনকারী') + '</h3>' +
          '<p>' + SEMSAdmin.esc(a.collegeName || '') + ' · ' + SEMSAdmin.esc(SEMSAdmin.batchName(a.courseBatch, batches)) + '</p>' +
          '<div class="list-actions"><a class="btn btn-sm" href="admission-requests.html">পর্যালোচনা করুন</a></div></div>';
      }).join('');
    }
    var nt = document.getElementById('latestNotices');
    if (!notices.length) {
      nt.innerHTML = SEMSAdmin.emptyState('megaphone', 'কোনো নোটিশ নেই', 'নোটিশ যোগ করলে এখানে দেখা যাবে।');
    } else {
      nt.innerHTML = notices.slice(0, 4).map(function (n) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(n.title || '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(n.createdAt)) + '</span>' +
          (n.urgent ? '<span class="badge badge-urgent">জরুরি</span>' : '') + '</div></div>';
      }).join('');
    }
    var lc = document.getElementById('recentLectures');
    if (!lectures.length) {
      lc.innerHTML = SEMSAdmin.emptyState('book', 'কোনো লেকচার নেই', 'লেকচার আপলোড করলে এখানে দেখা যাবে।');
    } else {
      lc.innerHTML = lectures.slice(0, 4).map(function (l) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(l.title || '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(l.subject || '') + '</span>' +
          '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(l.publishDate || l.date)) + '</span></div></div>';
      }).join('');
    }
    var ex = document.getElementById('upcomingExams');
    var upcoming = exams.filter(function (e) {
      var d = SEMSAdmin.toDate(e.date);
      return d && SEMSAdmin.dateKey(d) >= today;
    });
    if (!upcoming.length) {
      ex.innerHTML = SEMSAdmin.emptyState('clipboard', 'আসন্ন কোনো পরীক্ষা নেই', 'পরীক্ষা তৈরি করলে এখানে দেখা যাবে।');
    } else {
      ex.innerHTML = upcoming.slice(0, 4).map(function (e) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(e.title || '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(e.subject || '') + '</span>' +
          '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(e.date)) + '</span>' +
          '<span>মোট ' + SEMSAdmin.bnDigits(e.totalMarks || 0) + ' নম্বর</span></div></div>';
      }).join('');
    }
  } catch (err) {
    console.warn('[SEMS] ড্যাশবোর্ড লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ড্যাশবোর্ড লোড করা যায়নি।');
  }
});
