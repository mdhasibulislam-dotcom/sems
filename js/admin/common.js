/* SEMS — js/admin/common.js | Phase 4
 * অ্যাডমিন পেজগুলোর শেয়ার্ড লজিক: রোল গার্ড, নেভবার/সাইডবার,
 * Firestore পড়া/লেখা, ডেমো মোডে localStorage (sems_demo_*) ফলব্যাক।
 *
 * অ্যাডমিনের সুযোগ পূর্ণ: সব কালেকশন পড়া/লেখা যায় (Firestore
 * Rules-এ isAdmin)। শিক্ষক যোগ করার নতুন উপায়: teacher-apply.html-এ
 * পাবলিক আবেদন → অ্যাডমিন teacher-requests.html-এ অনুমোদন →
 * অনুমোদিত ইমেইল দিয়ে রেজিস্টার করলে role 'teacher' হয়
 * (js/firebase/auth.js-এ যাচাই)। add-teacher.html এখনো আছে —
 * ইতিমধ্যে রেজিস্টার করা ইউজারকে সরাসরি teacher করার জন্য।
 *
 * ডেমো তথ্য সবসময় "ডেমো / নমুনা" লেবেলসহ দেখানো হয় — এগুলো আসল
 * ডেটা নয়, শুধু UI দেখার জন্য নমুনা। আসল ডেটা Firestore-এ
 * থাকলে তবেই দেখা যাবে।
 *
 * Firestore কালেকশন:
 * users, admissions, students, batches, courses, classes, lectures,
 * notices, exams, assignments, attendance, results, submissions,
 * settings, teacherApplications, notifications
 *
 * নোটিফিকেশন (Phase 5): `notifications` কালেকশনে অ্যাডমিন/শিক্ষক
 * লেখে; প্রত্যেক ইউজার শুধু নিজের (userId == নিজের uid) ডক পড়ে
 * ও পড়া চিহ্ন দেয়। নিয়ম `firebase/firestore.rules`-এ আছে।
 */
(function () {
  function isDemo() { return !!(window.SEMS && window.SEMS.isDemo); }
  function isReady() { return !!(window.SEMS && window.SEMS.firebaseReady); }
  function db() { return firebase.firestore(); }

  function esc(v) {
    return window.SEMSHelpers ? SEMSHelpers.escapeHtml(v) : String(v == null ? '' : v);
  }
  function bnDigits(v) {
    return window.SEMSHelpers ? SEMSHelpers.toBnDigits(v) : String(v);
  }
  function toDate(v) {
    if (!v) return null;
    if (typeof v.toDate === 'function') { try { return v.toDate(); } catch (e) { return null; } }
    if (v instanceof Date) return v;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDate(v) {
    var d = toDate(v);
    if (!d) return '';
    return window.SEMSHelpers ? SEMSHelpers.formatDateBn(d.toISOString()) : d.toLocaleDateString('bn-BD');
  }
  function fmtDateShort(v) {
    var d = toDate(v);
    if (!d) return '';
    var months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    return bnDigits(d.getDate()) + ' ' + months[d.getMonth()];
  }
  function dateKey(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  function todayKey() { return dateKey(new Date()); }
  function timeToMinutes(t) {
    if (!t) return null;
    var p = String(t).split(':');
    if (p.length < 2) return null;
    var h = parseInt(p[0], 10), m = parseInt(p[1], 10);
    return isNaN(h) || isNaN(m) ? null : h * 60 + m;
  }
  function classStatus(c) {
    var d = toDate(c.date);
    if (!d) return 'Upcoming';
    var key = dateKey(d);
    if (key < todayKey()) return 'Completed';
    if (key > todayKey()) return 'Upcoming';
    var start = timeToMinutes(c.startTime), end = timeToMinutes(c.endTime);
    var now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    if (start != null && end != null && nowMin >= start && nowMin <= end) return 'Ongoing';
    if (end != null && nowMin > end) return 'Completed';
    return 'Upcoming';
  }
  var STATUS_BN = { Upcoming: 'আসন্ন', Ongoing: 'চলমান', Completed: 'সম্পন্ন' };
  var STATUS_CLASS = { Upcoming: 'badge-upcoming', Ongoing: 'badge-ongoing', Completed: 'badge-completed' };

  function gradeFromMarks(marks, total) {
    if (!total || total <= 0) return '';
    var pct = (marks / total) * 100;
    if (pct >= 80) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 60) return 'A-';
    if (pct >= 50) return 'B';
    if (pct >= 40) return 'C';
    if (pct >= 33) return 'D';
    return 'F';
  }

  // খালি অবস্থা: icon = SEMSIcons-এর নাম (যেমন 'calendar'), ইমোজি নয়।
  function emptyState(icon, title, hint) {
    var ic = (window.SEMSIcons && icon) ? SEMSIcons.icon(icon, 'ic-lg') : '';
    return '<div class="empty-state"><div class="big">' + ic + '</div><strong>' + esc(title) + '</strong>' +
      (hint ? '<p>' + esc(hint) + '</p>' : '') + '</div>';
  }
  function ic(name) {
    return window.SEMSIcons ? SEMSIcons.icon(name, 'ic-sm') : '';
  }

  /* ---------- ডেমো (নমুনা) ডেটা: শুধু SEMS.isDemo হলে ---------- */
  function isoDaysFromNow(n, h, m) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(h == null ? 10 : h, m == null ? 0 : m, 0, 0);
    return d.toISOString();
  }
  function demoList(key, seedFn) {
    try {
      var raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* পড়া যায়নি — নতুন করে বানাও */ }
    var data = seedFn();
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* ignore */ }
    return data;
  }
  function demoSave(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }
  var DEMO_SEEDS = {
    'sems_demo_courses': function () {
      return [
        { id: 'demo-co1', name: 'HSC বিজ্ঞান কোর্স', subject: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত', description: 'HSC বিজ্ঞান বিভাগের সম্পূর্ণ প্রস্তুতি।' },
        { id: 'demo-co2', name: 'DU A Unit ভর্তি কোর্স', subject: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, বাংলা', description: 'ঢাকা বিশ্ববিদ্যালয় ক ইউনিট ভর্তি পরীক্ষার প্রস্তুতি।' }
      ];
    },
    'sems_demo_batches': function () {
      return [
        { id: 'demo-b1', name: 'HSC Physics Batch', subject: 'পদার্থবিজ্ঞান', courseId: 'demo-co1', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', startDate: isoDaysFromNow(-30, 9, 0) },
        { id: 'demo-b2', name: 'HSC Chemistry Batch', subject: 'রসায়ন', courseId: 'demo-co1', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', startDate: isoDaysFromNow(-30, 9, 0) },
        { id: 'demo-b3', name: 'DU A Unit Admission Batch', subject: 'ভর্তি প্রস্তুতি', courseId: 'demo-co2', teacherId: 'demo-t2', teacherName: 'নমুনা শিক্ষক ২', startDate: isoDaysFromNow(-15, 9, 0) }
      ];
    },
    'sems_demo_teachers': function () {
      return [
        { id: 'demo-t1', uid: 'demo-t1', name: 'নমুনা শিক্ষক', email: 'teacher1@demo.sems', phone: '01700000011', subject: 'পদার্থবিজ্ঞান', role: 'teacher' },
        { id: 'demo-t2', uid: 'demo-t2', name: 'নমুনা শিক্ষক ২', email: 'teacher2@demo.sems', phone: '01700000012', subject: 'রসায়ন', role: 'teacher' }
      ];
    },
    'sems_demo_students': function () {
      return [
        { id: 'demo-s1', fullName: 'নমুনা শিক্ষার্থী ১', name: 'নমুনা শিক্ষার্থী ১', email: 'student1@demo.sems', mobile: '01700000001', batchId: 'demo-b1', collegeName: 'নমুনা কলেজ' },
        { id: 'demo-s2', fullName: 'নমুনা শিক্ষার্থী ২', name: 'নমুনা শিক্ষার্থী ২', email: 'student2@demo.sems', mobile: '01700000002', batchId: 'demo-b1', collegeName: 'নমুনা কলেজ' },
        { id: 'demo-s3', fullName: 'নমুনা শিক্ষার্থী ৩', name: 'নমুনা শিক্ষার্থী ৩', email: 'student3@demo.sems', mobile: '01700000003', batchId: 'demo-b2', collegeName: 'নমুনা কলেজ' },
        { id: 'demo-s4', fullName: 'নমুনা শিক্ষার্থী ৪', name: 'নমুনা শিক্ষার্থী ৪', email: 'student4@demo.sems', mobile: '01700000004', batchId: 'demo-b2', collegeName: 'নমুনা কলেজ' },
        { id: 'demo-s5', fullName: 'নমুনা শিক্ষার্থী ৫', name: 'নমুনা শিক্ষার্থী ৫', email: 'student5@demo.sems', mobile: '01700000005', batchId: 'demo-b3', collegeName: 'নমুনা কলেজ' }
      ];
    },
    'sems_demo_admissions': function () {
      return [
        { id: 'demo-a1', uid: 'demo-s6', fullName: 'নতুন আবেদনকারী ১', email: 'apply1@demo.sems', mobile: '01700000006', collegeName: 'নমুনা কলেজ', courseBatch: 'demo-b1', status: 'pending', createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-a2', uid: 'demo-s7', fullName: 'নতুন আবেদনকারী ২', email: 'apply2@demo.sems', mobile: '01700000007', collegeName: 'নমুনা কলেজ', courseBatch: 'demo-b3', status: 'pending', createdAt: isoDaysFromNow(0, 8, 0) },
        { id: 'demo-a3', uid: 'demo-s1', fullName: 'নমুনা শিক্ষার্থী ১', email: 'student1@demo.sems', mobile: '01700000001', collegeName: 'নমুনা কলেজ', courseBatch: 'demo-b1', status: 'approved', createdAt: isoDaysFromNow(-10, 9, 0) }
      ];
    },
    'sems_demo_teacher_applications': function () {
      return [
        { id: 'demo-ta1', fullName: 'নমুনা শিক্ষক আবেদনকারী ১', email: 'apply-teacher1@demo.sems', mobile: '01700000021', institution: 'নমুনা কলেজ', subjects: ['পদার্থবিজ্ঞান'], subject: 'পদার্থবিজ্ঞান', qualification: 'বিএসসি (অনার্স) পদার্থবিজ্ঞান', experience: '৩–৫ বছর', address: 'নমুনা ঠিকানা', status: 'pending', createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-ta2', fullName: 'নমুনা শিক্ষক আবেদনকারী ২', email: 'apply-teacher2@demo.sems', mobile: '01700000022', institution: 'নমুনা স্কুল', subjects: ['রসায়ন', 'জীববিজ্ঞান'], subject: 'রসায়ন, জীববিজ্ঞান', qualification: 'এমএসসি রসায়ন', experience: '১–৩ বছর', address: 'নমুনা ঠিকানা', status: 'pending', createdAt: isoDaysFromNow(0, 8, 0) },
        { id: 'demo-ta3', fullName: 'নমুনা শিক্ষক ৩', email: 'apply-teacher3@demo.sems', mobile: '01700000023', institution: 'নমুনা কলেজ', subjects: ['উচ্চতর গণিত'], subject: 'উচ্চতর গণিত', qualification: 'বিএসসি গণিত', experience: '৫ বছরের বেশি', address: 'নমুনা ঠিকানা', status: 'approved', createdAt: isoDaysFromNow(-10, 9, 0) }
      ];
    },
    'sems_demo_classes': function () {
      return [
        { id: 'demo-c1', subject: 'পদার্থবিজ্ঞান', chapter: 'ভেক্টর', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: 'demo-b1' },
        { id: 'demo-c2', subject: 'রসায়ন', chapter: 'পরিমাণগত রসায়ন', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 12, 0), startTime: '12:00', endTime: '13:30', mode: 'offline', classLink: '', batchId: 'demo-b2' },
        { id: 'demo-c3', subject: 'উচ্চতর গণিত', chapter: 'ত্রিকোণমিতি', teacherId: 'demo-t2', teacherName: 'নমুনা শিক্ষক ২', date: isoDaysFromNow(1, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: 'demo-b3' }
      ];
    },
    'sems_demo_lectures': function () {
      return [
        { id: 'demo-l1', title: 'ভেক্টর ও স্কেলার রাশি', subject: 'পদার্থবিজ্ঞান', chapter: 'অধ্যায় ২: ভেক্টর', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', batchId: 'demo-b1', date: isoDaysFromNow(0, 10, 0), publishDate: isoDaysFromNow(0, 10, 0), description: 'ভেক্টর রাশির ধারণা, যোগ-বিয়োগ ও উপাংশ নিয়ে আলোচনা।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true },
        { id: 'demo-l2', title: 'মোল ও মোলার ভর', subject: 'রসায়ন', chapter: 'অধ্যায় ৩: পরিমাণগত রসায়ন', teacherId: 'demo-t1', teacherName: 'নমুনা শিক্ষক', batchId: 'demo-b2', date: isoDaysFromNow(-1, 11, 0), publishDate: isoDaysFromNow(-1, 11, 0), description: 'মোল ধারণা, অ্যাভোগাড্রো সংখ্যা ও মোলার ভরের হিসাব।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true }
      ];
    },
    'sems_demo_notices': function () {
      return [
        { id: 'demo-n1', title: 'আগামীকালের ক্লাসের সময় পরিবর্তন', body: 'আগামীকালের পদার্থবিজ্ঞান ক্লাস সকাল ১০টার বদলে সকাল ৯টায় হবে।', category: 'class', urgent: true, createdAt: isoDaysFromNow(0, 8, 0) },
        { id: 'demo-n2', title: 'মাসিক পরীক্ষার তারিখ ঘোষণা', body: 'এই মাসের মাসিক পরীক্ষা আগামী সপ্তাহে অনুষ্ঠিত হবে। রুটিন শীঘ্রই জানানো হবে।', category: 'exam', urgent: false, createdAt: isoDaysFromNow(-1, 9, 0) }
      ];
    },
    'sems_demo_assignments': function () {
      return [
        { id: 'demo-as1', title: 'ভেক্টরের ১০টি গাণিতিক সমস্যা', subject: 'পদার্থবিজ্ঞান', batchId: 'demo-b1', teacherId: 'demo-t1', description: 'অধ্যায় ২-এর অনুশীলনীর ১–১০ নম্বর সমস্যার সমাধান জমা দিন।', dueDate: isoDaysFromNow(2, 23, 59), createdAt: isoDaysFromNow(-1, 9, 0) }
      ];
    },
    'sems_demo_exams': function () {
      return [
        { id: 'demo-e1', title: 'মাসিক পরীক্ষা — পদার্থবিজ্ঞান', subject: 'পদার্থবিজ্ঞান', batchId: 'demo-b1', teacherId: 'demo-t1', date: isoDaysFromNow(5, 10, 0), startTime: '10:00', durationMinutes: 60, totalMarks: 50, createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-e2', title: 'সাপ্তাহিক কুইজ — রসায়ন', subject: 'রসায়ন', batchId: 'demo-b2', teacherId: 'demo-t1', date: isoDaysFromNow(-4, 11, 0), startTime: '11:00', durationMinutes: 30, totalMarks: 25, createdAt: isoDaysFromNow(-6, 9, 0) }
      ];
    },
    'sems_demo_attendance': function () {
      return [
        { id: 'demo-c1_' + todayKey() + '_demo-s1', studentId: 'demo-s1', classId: 'demo-c1', batchId: 'demo-b1', teacherId: 'demo-t1', date: isoDaysFromNow(0, 10, 0), status: 'present' },
        { id: 'demo-c1_' + todayKey() + '_demo-s2', studentId: 'demo-s2', classId: 'demo-c1', batchId: 'demo-b1', teacherId: 'demo-t1', date: isoDaysFromNow(0, 10, 0), status: 'absent' },
        { id: 'demo-c2_' + todayKey() + '_demo-s3', studentId: 'demo-s3', classId: 'demo-c2', batchId: 'demo-b2', teacherId: 'demo-t1', date: isoDaysFromNow(0, 12, 0), status: 'present' }
      ];
    },
    'sems_demo_results': function () {
      return [
        { id: 'demo-e2_demo-s3', examId: 'demo-e2', examTitle: 'সাপ্তাহিক কুইজ — রসায়ন', studentId: 'demo-s3', teacherId: 'demo-t1', marks: 20, totalMarks: 25, grade: 'A', date: isoDaysFromNow(-4, 11, 0) },
        { id: 'demo-e2_demo-s4', examId: 'demo-e2', examTitle: 'সাপ্তাহিক কুইজ — রসায়ন', studentId: 'demo-s4', teacherId: 'demo-t1', marks: 16, totalMarks: 25, grade: 'A-', date: isoDaysFromNow(-4, 11, 0) }
      ];
    },
    'sems_demo_settings': function () {
      return { siteName: 'SEMS — Sinha Education Management System', instituteName: 'সিনহা এডুকেশন', contactEmail: '', contactPhone: '', notice: '' };
    }
  };

  /* ---------- Firestore পড়া (ব্যর্থ হলে খালি তালিকা) ---------- */
  function firestoreList(coll, filters) {
    var q = db().collection(coll);
    (filters || []).forEach(function (f) { q = q.where(f.field, f.op, f.value); });
    return q.get().then(function (snap) {
      var out = [];
      snap.forEach(function (doc) { var d = doc.data(); d.id = doc.id; out.push(d); });
      return out;
    }).catch(function (err) {
      console.warn('[SEMS] ' + coll + ' পড়া যায়নি:', err && err.message);
      return [];
    });
  }
  function firestoreDoc(coll, id) {
    return db().collection(coll).doc(id).get().then(function (snap) {
      if (!snap.exists) return null;
      var d = snap.data(); d.id = snap.id;
      return d;
    }).catch(function (err) {
      console.warn('[SEMS] ' + coll + '/' + id + ' পড়া যায়নি:', err && err.message);
      return null;
    });
  }
  function sortByDateDesc(list, field) {
    return list.slice().sort(function (a, b) {
      var da = toDate(a[field]) || new Date(0), dbb = toDate(b[field]) || new Date(0);
      return dbb - da;
    });
  }
  function sortByDateAsc(list, field) {
    return list.slice().sort(function (a, b) {
      var da = toDate(a[field]) || new Date(0), dbb = toDate(b[field]) || new Date(0);
      return da - dbb;
    });
  }

  var BATCH_LABELS = {
    'hsc-physics': 'HSC Physics Batch',
    'hsc-chemistry': 'HSC Chemistry Batch',
    'hsc-math': 'HSC Higher Math Batch',
    'admission-a': 'DU A Unit Admission Batch',
    'admission-general': 'Admission (General) Batch'
  };

  var SEMSAdmin = {
    isDemo: isDemo,
    isReady: isReady,
    icon: ic,
    esc: esc,
    bnDigits: bnDigits,
    toDate: toDate,
    fmtDate: fmtDate,
    fmtDateShort: fmtDateShort,
    dateKey: dateKey,
    todayKey: todayKey,
    classStatus: classStatus,
    STATUS_BN: STATUS_BN,
    STATUS_CLASS: STATUS_CLASS,
    gradeFromMarks: gradeFromMarks,
    emptyState: emptyState,
    sortByDateDesc: sortByDateDesc,
    sortByDateAsc: sortByDateAsc,

    // গার্ড: লগইন না থাকলে ../login.html, ভুল রোলে নিজের ড্যাশবোর্ড।
    // গার্ড শেষ হলেই লোডার লুকানো হয় — আটকে থাকা "লোড হচ্ছে..." ঠেকাতে।
    init: async function (pageKey) {
      SEMSLoader.show();
      var user;
      try {
        user = await SEMSRoleGuard.requireRole('admin');
      } catch (e) {
        SEMSLoader.hide();
        throw e;
      }
      SEMSLoader.hide();
      if (window.SEMSNavbar) SEMSNavbar.render('navbarRoot', user);
      var links = document.querySelectorAll('#sidebarRoot a[data-page]');
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute('data-page') === pageKey) links[i].classList.add('active');
        else links[i].classList.remove('active');
      }
      var badge = document.getElementById('demoBadge');
      if (badge) badge.hidden = !isDemo();
      return user;
    },

    batchLabel: function (batchId) {
      return BATCH_LABELS[batchId] || batchId || '';
    },
    batchName: function (batchId, batches) {
      if (!batchId) return '';
      var list = batches || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === batchId) return list[i].name || batchId;
      return BATCH_LABELS[batchId] || batchId;
    },
    teacherName: function (teacherId, teachers) {
      if (!teacherId) return '';
      var list = teachers || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === teacherId || list[i].uid === teacherId) return list[i].name || list[i].displayName || teacherId;
      return teacherId;
    },
    studentName: function (studentId, students) {
      if (!studentId) return '';
      var list = students || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === studentId) return list[i].fullName || list[i].name || studentId;
      return studentId;
    },

    /* ---------- পড়া: সব কালেকশন (অ্যাডমিনের পূর্ণ সুযোগ) ---------- */
    getAllUsers: async function () {
      if (isDemo()) {
        var teachers = demoList('sems_demo_teachers', DEMO_SEEDS['sems_demo_teachers']);
        var students = demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
        var out = teachers.map(function (t) { return Object.assign({}, t, { role: 'teacher' }); });
        students.forEach(function (s) {
          out.push({ id: s.id, uid: s.id, name: s.fullName || s.name, email: s.email, phone: s.mobile, role: 'student' });
        });
        return out;
      }
      if (!isReady()) return [];
      return firestoreList('users');
    },
    getTeachers: async function () {
      if (isDemo()) return demoList('sems_demo_teachers', DEMO_SEEDS['sems_demo_teachers']);
      if (!isReady()) return [];
      return firestoreList('users', [{ field: 'role', op: '==', value: 'teacher' }]);
    },
    getStudents: async function () {
      if (isDemo()) return demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
      if (!isReady()) return [];
      return firestoreList('students');
    },
    getStudentById: async function (id) {
      if (isDemo()) {
        var list = demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
      }
      if (!isReady()) return null;
      return firestoreDoc('students', id);
    },
    getTeacherById: async function (id) {
      if (isDemo()) {
        var list = demoList('sems_demo_teachers', DEMO_SEEDS['sems_demo_teachers']);
        for (var i = 0; i < list.length; i++) if (list[i].id === id || list[i].uid === id) return list[i];
        return null;
      }
      if (!isReady()) return null;
      return firestoreDoc('users', id);
    },
    getAdmissions: async function () {
      var list = isDemo()
        ? demoList('sems_demo_admissions', DEMO_SEEDS['sems_demo_admissions'])
        : (isReady() ? await firestoreList('admissions') : []);
      return sortByDateDesc(list, 'createdAt');
    },
    getPendingAdmissions: async function () {
      var all = await SEMSAdmin.getAdmissions();
      return all.filter(function (a) { return (a.status || 'pending') === 'pending'; });
    },
    // শিক্ষক আবেদন (teacherApplications): পাবলিক ফরম থেকে আসে।
    getTeacherApplications: async function () {
      var list = isDemo()
        ? demoList('sems_demo_teacher_applications', DEMO_SEEDS['sems_demo_teacher_applications'])
        : (isReady() ? await firestoreList('teacherApplications') : []);
      return sortByDateDesc(list, 'createdAt');
    },
    getPendingTeacherApplications: async function () {
      var all = await SEMSAdmin.getTeacherApplications();
      return all.filter(function (a) { return (a.status || 'pending') === 'pending'; });
    },
    getCourses: async function () {
      if (isDemo()) return demoList('sems_demo_courses', DEMO_SEEDS['sems_demo_courses']);
      if (!isReady()) return [];
      return firestoreList('courses');
    },
    getBatches: async function () {
      if (isDemo()) return demoList('sems_demo_batches', DEMO_SEEDS['sems_demo_batches']);
      if (!isReady()) return [];
      return firestoreList('batches');
    },
    getBatchById: async function (batchId) {
      if (!batchId) return null;
      if (isDemo()) {
        var list = demoList('sems_demo_batches', DEMO_SEEDS['sems_demo_batches']);
        for (var i = 0; i < list.length; i++) if (list[i].id === batchId) return list[i];
        return { id: batchId, name: BATCH_LABELS[batchId] || batchId };
      }
      if (!isReady()) return null;
      var d = await firestoreDoc('batches', batchId);
      return d || { id: batchId, name: BATCH_LABELS[batchId] || batchId };
    },
    getClasses: async function () {
      var list = isDemo()
        ? demoList('sems_demo_classes', DEMO_SEEDS['sems_demo_classes'])
        : (isReady() ? await firestoreList('classes') : []);
      return sortByDateAsc(list, 'date');
    },
    getLectures: async function () {
      var list = isDemo()
        ? demoList('sems_demo_lectures', DEMO_SEEDS['sems_demo_lectures'])
        : (isReady() ? await firestoreList('lectures') : []);
      return sortByDateDesc(list, 'publishDate').length ? sortByDateDesc(list, 'publishDate') : sortByDateDesc(list, 'date');
    },
    getNotices: async function () {
      var list = isDemo()
        ? demoList('sems_demo_notices', DEMO_SEEDS['sems_demo_notices'])
        : (isReady() ? await firestoreList('notices') : []);
      return sortByDateDesc(list, 'createdAt').length ? sortByDateDesc(list, 'createdAt') : sortByDateDesc(list, 'publishDate');
    },
    getAssignments: async function () {
      var list = isDemo()
        ? demoList('sems_demo_assignments', DEMO_SEEDS['sems_demo_assignments'])
        : (isReady() ? await firestoreList('assignments') : []);
      return sortByDateDesc(list, 'dueDate');
    },
    getExams: async function () {
      var list = isDemo()
        ? demoList('sems_demo_exams', DEMO_SEEDS['sems_demo_exams'])
        : (isReady() ? await firestoreList('exams') : []);
      return sortByDateAsc(list, 'date');
    },
    getResults: async function () {
      var list = isDemo()
        ? demoList('sems_demo_results', DEMO_SEEDS['sems_demo_results'])
        : (isReady() ? await firestoreList('results') : []);
      return sortByDateDesc(list, 'date');
    },
    getAttendance: async function () {
      var list = isDemo()
        ? demoList('sems_demo_attendance', DEMO_SEEDS['sems_demo_attendance'])
        : (isReady() ? await firestoreList('attendance') : []);
      return sortByDateDesc(list, 'date');
    },
    getAttendanceForStudent: async function (studentId) {
      var all = await SEMSAdmin.getAttendance();
      return all.filter(function (a) { return a.studentId === studentId; });
    },
    getResultsForStudent: async function (studentId) {
      var all = await SEMSAdmin.getResults();
      return all.filter(function (r) { return r.studentId === studentId; });
    },
    getSettings: async function () {
      if (isDemo()) {
        try { return JSON.parse(localStorage.getItem('sems_demo_settings') || 'null') || DEMO_SEEDS['sems_demo_settings'](); } catch (e) { return DEMO_SEEDS['sems_demo_settings'](); }
      }
      if (!isReady()) return {};
      var d = await firestoreDoc('settings', 'general');
      return d || {};
    },

    /* ---------- লেখা (Firestore; ডেমোতে localStorage) ---------- */
    addDoc: async function (coll, key, record) {
      if (isDemo()) {
        record.id = 'demo-' + Date.now();
        var list = demoList(key, DEMO_SEEDS[key]);
        list.unshift(record);
        demoSave(key, list);
        return record;
      }
      var ref = await db().collection(coll).add(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      record.id = ref.id;
      return record;
    },
    // কোর্স তৈরি — সতর্কতা: firestore.rules-এ courses-এর কোনো
    // match ব্লক নেই, তাই আসল Firebase-এ অ্যাডমিন লিখতে গেলে
    // permission-denied আসবে যতক্ষণ না Rules-এ courses যোগ হয়।
    addCourse: async function (data) {
      return SEMSAdmin.addDoc('courses', 'sems_demo_courses', Object.assign({}, data, {
        createdAt: new Date().toISOString()
      }));
    },
    addBatch: async function (data) {
      return SEMSAdmin.addDoc('batches', 'sems_demo_batches', Object.assign({}, data, {
        createdAt: new Date().toISOString()
      }));
    },
    addClass: async function (data) {
      return SEMSAdmin.addDoc('classes', 'sems_demo_classes', Object.assign({}, data, {
        createdAt: new Date().toISOString()
      }));
    },
    // লেকচার প্রকাশ — লিংক দিয়ে (ফাইল আপলোডে Storage-এর Blaze লাগে)
    addLecture: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: data.teacherId || user.uid,
        published: true,
        createdAt: new Date().toISOString()
      });
      return SEMSAdmin.addDoc('lectures', 'sems_demo_lectures', record);
    },
    addNotice: async function (user, data) {
      var record = Object.assign({}, data, {
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      });
      return SEMSAdmin.addDoc('notices', 'sems_demo_notices', record);
    },
    addAssignment: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: data.teacherId || user.uid,
        createdAt: new Date().toISOString()
      });
      return SEMSAdmin.addDoc('assignments', 'sems_demo_assignments', record);
    },
    addExam: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: data.teacherId || user.uid,
        createdAt: new Date().toISOString()
      });
      return SEMSAdmin.addDoc('exams', 'sems_demo_exams', record);
    },
    deleteDoc: async function (coll, key, id) {
      if (isDemo()) {
        var list = demoList(key, DEMO_SEEDS[key]);
        demoSave(key, list.filter(function (d) { return d.id !== id; }));
        return;
      }
      await db().collection(coll).doc(id).delete();
    },
    // শিক্ষার্থী সরাসরি যোগ: students ডকে রেকর্ড (অ্যাডমিন create
    // অনুমোদিত)। নোট: Auth অ্যাকাউন্ট এতে বানানো হয় না —
    // শিক্ষার্থীকে রেজিস্টার করতে হবে, তারপর ভর্তি অনুমোদন দিলে
    // users ডকের admissionCompleted সত্য হয়।
    addStudentRecord: async function (data) {
      var record = Object.assign({}, data, { status: 'active', createdAt: new Date().toISOString() });
      return SEMSAdmin.addDoc('students', 'sems_demo_students', record);
    },
    // শিক্ষক করা: রেজিস্টার করা ইউজারের users ডকের role বদলে
    // 'teacher' করা (অ্যাডমিন update অনুমোদিত)। ক্লায়েন্ট কোড
    // দিয়ে অন্য কারো Auth অ্যাকাউন্ট বানানো যায় না।
    setTeacherRole: async function (uid, data) {
      if (isDemo()) {
        var list = demoList('sems_demo_teachers', DEMO_SEEDS['sems_demo_teachers']);
        var found = null;
        list.forEach(function (t) { if (t.id === uid || t.uid === uid) found = t; });
        if (found) {
          Object.assign(found, data, { role: 'teacher' });
        } else {
          found = Object.assign({ id: uid, uid: uid, role: 'teacher' }, data);
          list.unshift(found);
        }
        demoSave('sems_demo_teachers', list);
        return found;
      }
      await db().collection('users').doc(uid).set(Object.assign({ role: 'teacher' }, data), { merge: true });
      return Object.assign({ id: uid }, data, { role: 'teacher' });
    },
    // ভর্তি অনুমোদন: admissions status approved + users ডকের
    // admissionCompleted=true + students ডকে রেকর্ড তৈরি।
    approveAdmission: async function (admission) {
      var uid = admission.uid || admission.id;
      if (isDemo()) {
        var list = demoList('sems_demo_admissions', DEMO_SEEDS['sems_demo_admissions']);
        list.forEach(function (a) { if (a.id === admission.id) a.status = 'approved'; });
        demoSave('sems_demo_admissions', list);
        var students = demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
        var exists = false;
        students.forEach(function (s) { if (s.id === uid) exists = true; });
        if (!exists) {
          students.unshift(Object.assign({}, admission, { id: uid, status: 'active' }));
          demoSave('sems_demo_students', students);
        }
        return;
      }
      var batch = db().batch();
      batch.set(db().collection('admissions').doc(uid), { status: 'approved' }, { merge: true });
      batch.set(db().collection('users').doc(uid), { admissionCompleted: true }, { merge: true });
      batch.set(db().collection('students').doc(uid), Object.assign({}, admission, { status: 'active' }), { merge: true });
      await batch.commit();
    },
    rejectAdmission: async function (admission) {
      var uid = admission.uid || admission.id;
      if (isDemo()) {
        var list = demoList('sems_demo_admissions', DEMO_SEEDS['sems_demo_admissions']);
        list.forEach(function (a) { if (a.id === admission.id) a.status = 'rejected'; });
        demoSave('sems_demo_admissions', list);
        return;
      }
      await db().collection('admissions').doc(uid).set({ status: 'rejected' }, { merge: true });
    },
    // শিক্ষক আবেদন অনুমোদন/বাতিল: শুধু status বদলায়। অনুমোদনের
    // পর আবেদনকারীকে একই ইমেইল দিয়ে রেজিস্টার করতে হয় — তখন
    // auth.js অনুমোদিত আবেদন দেখে role 'teacher' দিয়ে দেয়।
    // আগে রেজিস্টার করা থাকলে add-teacher.html দিয়ে role বদলাতে হয়।
    approveTeacherApplication: async function (application) {
      if (isDemo()) {
        var list = demoList('sems_demo_teacher_applications', DEMO_SEEDS['sems_demo_teacher_applications']);
        list.forEach(function (a) { if (a.id === application.id) a.status = 'approved'; });
        demoSave('sems_demo_teacher_applications', list);
        return;
      }
      await db().collection('teacherApplications').doc(application.id).set({ status: 'approved' }, { merge: true });
    },
    rejectTeacherApplication: async function (application) {
      if (isDemo()) {
        var list2 = demoList('sems_demo_teacher_applications', DEMO_SEEDS['sems_demo_teacher_applications']);
        list2.forEach(function (a) { if (a.id === application.id) a.status = 'rejected'; });
        demoSave('sems_demo_teacher_applications', list2);
        return;
      }
      await db().collection('teacherApplications').doc(application.id).set({ status: 'rejected' }, { merge: true });
    },
    updateSettings: async function (data) {
      if (isDemo()) {
        try { localStorage.setItem('sems_demo_settings', JSON.stringify(data)); } catch (e) { /* ignore */ }
        return;
      }
      await db().collection('settings').doc('general').set(data, { merge: true });
    }
  };

  window.SEMSAdmin = SEMSAdmin;
})();
