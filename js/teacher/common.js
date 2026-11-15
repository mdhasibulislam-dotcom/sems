/* SEMS — js/teacher/common.js | Phase 3
 * শিক্ষক পেজগুলোর শেয়ার্ড লজিক: রোল গার্ড, নেভবার/সাইডবার,
 * Firestore পড়া/লেখা, ডেমো মোডে localStorage (sems_demo_*) ফলব্যাক।
 *
 * শিক্ষকের সুযোগ শুধু নিজের ব্যাচ/ক্লাস: সব পড়া/লেখায়
 * teacherId == uid অথবা batchId ∈ নিজের ব্যাচ — অন্য শিক্ষকের
 * ডেটা কখনো দেখানো বা লেখা হয় না।
 *
 * ডেমো তথ্য সবসময় "ডেমো / নমুনা" লেবেলসহ দেখানো হয় — এগুলো আসল
 * ডেটা নয়, শুধু UI দেখার জন্য নমুনা। আসল ডেটা Firestore-এ
 * থাকলে তবেই দেখা যাবে।
 *
 * Firestore কালেকশন:
 * users, batches, classes, lectures, notices, exams, assignments,
 * attendance, results, submissions, students
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
  // ক্লাসের স্ট্যাটাস: তারিখ + সময় থেকে Upcoming / Ongoing / Completed
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

  // নম্বর থেকে গ্রেড
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
    'sems_demo_batches': function () {
      return [
        { id: 'demo-b1', name: 'HSC Physics Batch', subject: 'পদার্থবিজ্ঞান', teacherId: 'demo' },
        { id: 'demo-b2', name: 'HSC Chemistry Batch', subject: 'রসায়ন', teacherId: 'demo' },
        { id: 'demo-b3', name: 'HSC Higher Math Batch', subject: 'উচ্চতর গণিত', teacherId: 'demo' }
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
    'sems_demo_classes': function () {
      return [
        { id: 'demo-c1', subject: 'পদার্থবিজ্ঞান', chapter: 'ভেক্টর', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: 'demo-b1' },
        { id: 'demo-c2', subject: 'রসায়ন', chapter: 'পরিমাণগত রসায়ন', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 12, 0), startTime: '12:00', endTime: '13:30', mode: 'offline', classLink: '', batchId: 'demo-b2' },
        { id: 'demo-c3', subject: 'উচ্চতর গণিত', chapter: 'ত্রিকোণমিতি', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(1, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: 'demo-b3' },
        { id: 'demo-c4', subject: 'পদার্থবিজ্ঞান', chapter: 'গতিবিদ্যা', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(3, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'offline', classLink: '', batchId: 'demo-b1' }
      ];
    },
    'sems_demo_lectures': function () {
      return [
        { id: 'demo-l1', title: 'ভেক্টর ও স্কেলার রাশি', subject: 'পদার্থবিজ্ঞান', chapter: 'অধ্যায় ২: ভেক্টর', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', batchId: 'demo-b1', date: isoDaysFromNow(0, 10, 0), publishDate: isoDaysFromNow(0, 10, 0), description: 'ভেক্টর রাশির ধারণা, যোগ-বিয়োগ ও উপাংশ নিয়ে আলোচনা।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true },
        { id: 'demo-l2', title: 'মোল ও মোলার ভর', subject: 'রসায়ন', chapter: 'অধ্যায় ৩: পরিমাণগত রসায়ন', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', batchId: 'demo-b2', date: isoDaysFromNow(-1, 11, 0), publishDate: isoDaysFromNow(-1, 11, 0), description: 'মোল ধারণা, অ্যাভোগাড্রো সংখ্যা ও মোলার ভরের হিসাব।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true },
        { id: 'demo-l3', title: 'ত্রিকোণমিতিক অনুপাত', subject: 'উচ্চতর গণিত', chapter: 'অধ্যায় ১: ত্রিকোণমিতি', teacherId: 'demo', teacherName: 'নমুনা শিক্ষক', batchId: 'demo-b3', date: isoDaysFromNow(-3, 14, 40), publishDate: isoDaysFromNow(-3, 14, 40), description: 'ত্রিকোণমিতিক অনুপাত ও অভেদাবলি নিয়ে আলোচনা।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true }
      ];
    },
    'sems_demo_notices': function () {
      return [
        { id: 'demo-n1', title: 'আগামীকালের ক্লাসের সময় পরিবর্তন', body: 'আগামীকালের পদার্থবিজ্ঞান ক্লাস সকাল ১০টার বদলে সকাল ৯টায় হবে।', category: 'class', urgent: true, createdAt: isoDaysFromNow(0, 8, 0) },
        { id: 'demo-n2', title: 'মাসিক পরীক্ষার তারিখ ঘোষণা', body: 'এই মাসের মাসিক পরীক্ষা আগামী সপ্তাহে অনুষ্ঠিত হবে। রুটিন শীঘ্রই জানানো হবে।', category: 'exam', urgent: false, createdAt: isoDaysFromNow(-1, 9, 0) }
      ];
    },
    'sems_demo_attendance': function () {
      return [
        { id: 'demo-c1_' + todayKey() + '_demo-s1', studentId: 'demo-s1', classId: 'demo-c1', batchId: 'demo-b1', teacherId: 'demo', date: isoDaysFromNow(0, 10, 0), status: 'present' },
        { id: 'demo-c1_' + todayKey() + '_demo-s2', studentId: 'demo-s2', classId: 'demo-c1', batchId: 'demo-b1', teacherId: 'demo', date: isoDaysFromNow(0, 10, 0), status: 'present' }
      ];
    },
    'sems_demo_assignments': function () {
      return [
        { id: 'demo-as1', title: 'ভেক্টরের ১০টি গাণিতিক সমস্যা', subject: 'পদার্থবিজ্ঞান', batchId: 'demo-b1', teacherId: 'demo', description: 'অধ্যায় ২-এর অনুশীলনীর ১–১০ নম্বর সমস্যার সমাধান জমা দিন।', dueDate: isoDaysFromNow(2, 23, 59), createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-as2', title: 'মোল সংক্রান্ত হিসাব', subject: 'রসায়ন', batchId: 'demo-b2', teacherId: 'demo', description: 'মোল ও মোলার ভরের ৫টি হিসাব খাতায় করে ছবি/লিংক জমা দিন।', dueDate: isoDaysFromNow(-1, 23, 59), createdAt: isoDaysFromNow(-3, 9, 0) }
      ];
    },
    'sems_demo_exams': function () {
      return [
        { id: 'demo-e1', title: 'মাসিক পরীক্ষা — পদার্থবিজ্ঞান', subject: 'পদার্থবিজ্ঞান', batchId: 'demo-b1', teacherId: 'demo', date: isoDaysFromNow(5, 10, 0), startTime: '10:00', durationMinutes: 60, totalMarks: 50, createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-e2', title: 'সাপ্তাহিক কুইজ — রসায়ন', subject: 'রসায়ন', batchId: 'demo-b2', teacherId: 'demo', date: isoDaysFromNow(-4, 11, 0), startTime: '11:00', durationMinutes: 30, totalMarks: 25, createdAt: isoDaysFromNow(-6, 9, 0) }
      ];
    },
    'sems_demo_results': function () {
      return [
        { id: 'demo-e2_demo-s3', examId: 'demo-e2', examTitle: 'সাপ্তাহিক কুইজ — রসায়ন', studentId: 'demo-s3', teacherId: 'demo', marks: 20, totalMarks: 25, grade: 'A', date: isoDaysFromNow(-4, 11, 0) },
        { id: 'demo-e2_demo-s4', examId: 'demo-e2', examTitle: 'সাপ্তাহিক কুইজ — রসায়ন', studentId: 'demo-s4', teacherId: 'demo', marks: 16, totalMarks: 25, grade: 'A-', date: isoDaysFromNow(-4, 11, 0) }
      ];
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

  var SEMSTeacher = {
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
        user = await SEMSRoleGuard.requireRole('teacher');
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

    // প্রোফাইল: users ডক (ডেমোতে localStorage-এর ডেমো ইউজার)
    getProfile: async function (user) {
      var base = {
        name: user.displayName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        photoURL: '',
        uid: user.uid,
        role: 'teacher'
      };
      if (isDemo()) return base;
      if (!isReady()) return base;
      try {
        var snap = await db().collection('users').doc(user.uid).get();
        if (!snap.exists) return base;
        var u = snap.data();
        return Object.assign(base, u, {
          name: u.name || base.name,
          phone: u.phone || base.phone
        });
      } catch (err) {
        console.warn('[SEMS] প্রোফাইল পড়া যায়নি:', err && err.message);
        return base;
      }
    },

    // প্রোফাইল আপডেট: শুধু নাম/ফোন (নিরাপদ ফিল্ড)
    updateProfile: async function (user, data) {
      if (isDemo()) {
        var u = null;
        try { u = JSON.parse(localStorage.getItem('sems_demo_user') || 'null'); } catch (e) { u = null; }
        if (u) {
          if (data.name) { u.name = data.name; u.displayName = data.name; }
          if (data.phone) u.phone = data.phone;
          try { localStorage.setItem('sems_demo_user', JSON.stringify(u)); } catch (e) { /* ignore */ }
        }
        return;
      }
      await db().collection('users').doc(user.uid).set({
        name: data.name, phone: data.phone
      }, { merge: true });
    },

    // নিজের ব্যাচগুলো: batches where teacherId == uid (ডেমোতে নমুনা ব্যাচ)
    getMyBatches: async function (uid) {
      if (isDemo()) return demoList('sems_demo_batches', DEMO_SEEDS['sems_demo_batches']);
      if (!isReady()) return [];
      return firestoreList('batches', [{ field: 'teacherId', op: '==', value: uid }]);
    },

    getBatchById: async function (batchId, myBatches) {
      if (!batchId) return null;
      var list = myBatches || [];
      for (var i = 0; i < list.length; i++) if (list[i].id === batchId) return list[i];
      if (isDemo()) return { id: batchId, name: BATCH_LABELS[batchId] || batchId };
      if (!isReady()) return null;
      try {
        var snap = await db().collection('batches').doc(batchId).get();
        if (!snap.exists) return { id: batchId, name: BATCH_LABELS[batchId] || batchId };
        var d = snap.data(); d.id = snap.id;
        return d;
      } catch (err) { return { id: batchId, name: BATCH_LABELS[batchId] || batchId }; }
    },

    // নিজের ক্লাসগুলো: classes where teacherId == uid
    getMyClasses: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_classes', DEMO_SEEDS['sems_demo_classes'])
        : (isReady() ? await firestoreList('classes', [{ field: 'teacherId', op: '==', value: uid }]) : []);
      return sortByDateAsc(list, 'date');
    },

    // নিজের লেকচারগুলো: lectures where teacherId == uid
    getMyLectures: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_lectures', DEMO_SEEDS['sems_demo_lectures'])
        : (isReady() ? await firestoreList('lectures', [{ field: 'teacherId', op: '==', value: uid }]) : []);
      return sortByDateDesc(list, 'publishDate').length ? sortByDateDesc(list, 'publishDate') : sortByDateDesc(list, 'date');
    },

    getNotices: async function () {
      var list = isDemo()
        ? demoList('sems_demo_notices', DEMO_SEEDS['sems_demo_notices'])
        : (isReady() ? await firestoreList('notices') : []);
      return sortByDateDesc(list, 'createdAt').length ? sortByDateDesc(list, 'createdAt') : sortByDateDesc(list, 'publishDate');
    },

    // নিজের ব্যাচের শিক্ষার্থীরা: students where batchId ∈ নিজের ব্যাচ
    getStudentsForBatch: async function (batchId) {
      if (!batchId) return [];
      if (isDemo()) {
        var all = demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
        return all.filter(function (s) { return s.batchId === batchId; });
      }
      if (!isReady()) return [];
      return firestoreList('students', [{ field: 'batchId', op: '==', value: batchId }]);
    },

    // নিজের সব ব্যাচের শিক্ষার্থী (batchId অনুযায়ী গ্রুপ করে ফেরত)
    getMyStudents: async function (uid) {
      var batches = await SEMSTeacher.getMyBatches(uid);
      var ids = batches.map(function (b) { return b.id; });
      if (!ids.length) return [];
      if (isDemo()) {
        var all = demoList('sems_demo_students', DEMO_SEEDS['sems_demo_students']);
        return all.filter(function (s) { return ids.indexOf(s.batchId) !== -1; });
      }
      if (!isReady()) return [];
      if (ids.length <= 10) {
        return firestoreList('students', [{ field: 'batchId', op: 'in', value: ids }]);
      }
      var out = [];
      for (var i = 0; i < ids.length; i++) {
        var part = await firestoreList('students', [{ field: 'batchId', op: '==', value: ids[i] }]);
        out = out.concat(part);
      }
      return out;
    },

    // নিজের অ্যাসাইনমেন্ট: assignments where teacherId == uid
    getAssignments: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_assignments', DEMO_SEEDS['sems_demo_assignments'])
        : (isReady() ? await firestoreList('assignments', [{ field: 'teacherId', op: '==', value: uid }]) : []);
      return sortByDateDesc(list, 'dueDate');
    },

    // নিজের পরীক্ষা: exams where teacherId == uid
    getExams: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_exams', DEMO_SEEDS['sems_demo_exams'])
        : (isReady() ? await firestoreList('exams', [{ field: 'teacherId', op: '==', value: uid }]) : []);
      return sortByDateAsc(list, 'date');
    },

    // নিজের দেওয়া রেজাল্ট: results where teacherId == uid
    getResults: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_results', DEMO_SEEDS['sems_demo_results'])
        : (isReady() ? await firestoreList('results', [{ field: 'teacherId', op: '==', value: uid }]) : []);
      return sortByDateDesc(list, 'date');
    },

    getResultsForExam: async function (uid, examId) {
      var all = await SEMSTeacher.getResults(uid);
      return all.filter(function (r) { return r.examId === examId; });
    },

    // একটি ক্লাস+তারিখের উপস্থিতি
    getAttendanceForClass: async function (uid, classId, dateStr) {
      var all = isDemo()
        ? demoList('sems_demo_attendance', DEMO_SEEDS['sems_demo_attendance'])
        : (isReady() ? await firestoreList('attendance', [
            { field: 'teacherId', op: '==', value: uid },
            { field: 'classId', op: '==', value: classId }
          ]) : []);
      return all.filter(function (a) {
        var d = SEMSTeacher.toDate(a.date);
        return d && SEMSTeacher.dateKey(d) === dateStr;
      });
    },

    // অ্যাসাইনমেন্টের জমা (submissions) — শুধু নিজের অ্যাসাইনমেন্টের
    getSubmissionsForAssignment: async function (assignmentId) {
      if (isDemo()) {
        var subs = {};
        try { subs = JSON.parse(localStorage.getItem('sems_assignment_submissions') || '{}'); } catch (e) { subs = {}; }
        return subs[assignmentId] ? [subs[assignmentId]] : [];
      }
      if (!isReady()) return [];
      return firestoreList('submissions', [{ field: 'assignmentId', op: '==', value: assignmentId }]);
    },

    /* ---------- লেখা (Firestore; ডেমোতে localStorage) ---------- */

    // লেকচার প্রকাশ: lectures ডকে published=true, teacherId=uid
    // নোট: ফাইল আপলোড (PDF/স্লাইড) Firebase Storage-এ করতে হলে
    // Blaze (pay-as-you-go) প্ল্যান লাগে — ৩ ফেব্রুয়ারি ২০২৬ থেকে
    // Spark প্ল্যানে Storage বাকেট পাওয়া যায় না। তাই আপাতত
    // ফাইল আপলোডের বদলে PDF/স্লাইড/রেকর্ডিংয়ের লিংক নেওয়া হয়।
    addLecture: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: user.uid,
        teacherName: user.displayName || user.name || user.email || '',
        published: true,
        createdAt: new Date().toISOString()
      });
      if (isDemo()) {
        record.id = 'demo-l' + Date.now();
        var list = demoList('sems_demo_lectures', DEMO_SEEDS['sems_demo_lectures']);
        list.unshift(record);
        demoSave('sems_demo_lectures', list);
        return record;
      }
      var ref = await db().collection('lectures').add(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      record.id = ref.id;
      return record;
    },

    addAssignment: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: user.uid,
        teacherName: user.displayName || user.name || user.email || '',
        createdAt: new Date().toISOString()
      });
      if (isDemo()) {
        record.id = 'demo-as' + Date.now();
        var list = demoList('sems_demo_assignments', DEMO_SEEDS['sems_demo_assignments']);
        list.unshift(record);
        demoSave('sems_demo_assignments', list);
        return record;
      }
      var ref = await db().collection('assignments').add(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      record.id = ref.id;
      return record;
    },

    addExam: async function (user, data) {
      var record = Object.assign({}, data, {
        teacherId: user.uid,
        teacherName: user.displayName || user.name || user.email || '',
        createdAt: new Date().toISOString()
      });
      if (isDemo()) {
        record.id = 'demo-e' + Date.now();
        var list = demoList('sems_demo_exams', DEMO_SEEDS['sems_demo_exams']);
        list.unshift(record);
        demoSave('sems_demo_exams', list);
        return record;
      }
      var ref = await db().collection('exams').add(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      record.id = ref.id;
      return record;
    },

    // উপস্থিতি সংরক্ষণ: প্রত্যেক শিক্ষার্থীর জন্য attendance ডক
    // (studentId, classId, batchId, teacherId, date, status)
    // ডক আইডি classId_date_studentId — একই ক্লাসে দুবার নিলে পুরনোটি বদলে যায়।
    saveAttendance: async function (user, classDoc, dateStr, marks) {
      // marks: [{ studentId, status }] — status 'present' | 'absent'
      if (isDemo()) {
        var list = demoList('sems_demo_attendance', DEMO_SEEDS['sems_demo_attendance']);
        var kept = list.filter(function (a) {
          return !(a.classId === classDoc.id && SEMSTeacher.toDate(a.date) &&
            SEMSTeacher.dateKey(SEMSTeacher.toDate(a.date)) === dateStr);
        });
        marks.forEach(function (m) {
          kept.push({
            id: classDoc.id + '_' + dateStr + '_' + m.studentId,
            studentId: m.studentId, classId: classDoc.id,
            batchId: classDoc.batchId || '', teacherId: user.uid,
            date: dateStr + 'T10:00:00', status: m.status
          });
        });
        demoSave('sems_demo_attendance', kept);
        return;
      }
      var batch = db().batch();
      marks.forEach(function (m) {
        var docId = classDoc.id + '_' + dateStr + '_' + m.studentId;
        batch.set(db().collection('attendance').doc(docId), {
          studentId: m.studentId, classId: classDoc.id,
          batchId: classDoc.batchId || '', teacherId: user.uid,
          date: dateStr, status: m.status,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    },

    // নম্বর সংরক্ষণ: results ডক (examId, studentId, teacherId, marks, totalMarks, grade)
    // ডক আইডি examId_studentId — একই পরীক্ষায় আবার নম্বর দিলে পুরনোটি বদলে যায়।
    saveResult: async function (user, exam, studentId, marks) {
      var total = Number(exam.totalMarks) || 0;
      var record = {
        examId: exam.id, examTitle: exam.title || '',
        studentId: studentId, teacherId: user.uid,
        subject: exam.subject || '',
        marks: Number(marks), totalMarks: total,
        grade: gradeFromMarks(Number(marks), total),
        date: exam.date || new Date().toISOString()
      };
      if (isDemo()) {
        record.id = exam.id + '_' + studentId;
        var list = demoList('sems_demo_results', DEMO_SEEDS['sems_demo_results']);
        var kept = list.filter(function (r) { return r.id !== record.id; });
        kept.unshift(record);
        demoSave('sems_demo_results', kept);
        return record;
      }
      await db().collection('results').doc(exam.id + '_' + studentId).set(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }), { merge: true });
      record.id = exam.id + '_' + studentId;
      return record;
    }
  };

  window.SEMSTeacher = SEMSTeacher;
})();
