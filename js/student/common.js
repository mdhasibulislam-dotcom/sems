/* SEMS — js/student/common.js | Phase 2
 * শিক্ষার্থী পেজগুলোর শেয়ার্ড লজিক: রোল গার্ড, নেভবার/সাইডবার,
 * Firestore পড়া, ডেমো মোডে localStorage (sems_demo_*) ফলব্যাক।
 *
 * ডেমো তথ্য সবসময় "ডেমো / নমুনা" লেবেলসহ দেখানো হয় — এগুলো আসল
 * ডেটা নয়, শুধু UI দেখার জন্য নমুনা। আসল ডেটা অ্যাডমিন/শিক্ষক
 * Firestore-এ যোগ করলে তবেই দেখা যাবে।
 *
 * Firestore কালেকশন (Phase 1 rules অনুযায়ী):
 * users, admissions, students, batches, lectures, notices,
 * exams, results, attendance, classes, assignments
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

  function emptyState(icon, title, hint) {
    return '<div class="empty-state"><div class="big">' + icon + '</div><strong>' + esc(title) + '</strong>' +
      (hint ? '<p>' + esc(hint) + '</p>' : '') + '</div>';
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
  var DEMO_SEEDS = {
    'sems_demo_notices': function () {
      return [
        { id: 'demo-n1', title: 'আগামীকালের ক্লাসের সময় পরিবর্তন', body: 'আগামীকালের পদার্থবিজ্ঞান ক্লাস সকাল ১০টার বদলে সকাল ৯টায় হবে।', category: 'class', urgent: true, createdAt: isoDaysFromNow(0, 8, 0) },
        { id: 'demo-n2', title: 'মাসিক পরীক্ষার তারিখ ঘোষণা', body: 'এই মাসের মাসিক পরীক্ষা আগামী সপ্তাহে অনুষ্ঠিত হবে। রুটিন শীঘ্রই জানানো হবে।', category: 'exam', urgent: false, createdAt: isoDaysFromNow(-1, 9, 0) },
        { id: 'demo-n3', title: 'নমুনা নোটিশ (ডেমো)', body: 'এটি একটি নমুনা নোটিশ — আসল নোটিশ অ্যাডমিন যোগ করলে এখানে দেখা যাবে।', category: 'general', urgent: false, createdAt: isoDaysFromNow(-2, 9, 0) }
      ];
    },
    'sems_demo_lectures': function () {
      return [
        { id: 'demo-l1', title: 'ভেক্টর ও স্কেলার রাশি', subject: 'পদার্থবিজ্ঞান', chapter: 'অধ্যায় ২: ভেক্টর', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 10, 0), publishDate: isoDaysFromNow(0, 10, 0), description: 'ভেক্টর রাশির ধারণা, যোগ-বিয়োগ ও উপাংশ নিয়ে আলোচনা।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true },
        { id: 'demo-l2', title: 'মোল ও মোলার ভর', subject: 'রসায়ন', chapter: 'অধ্যায় ৩: পরিমাণগত রসায়ন', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(-1, 11, 0), publishDate: isoDaysFromNow(-1, 11, 0), description: 'মোল ধারণা, অ্যাভোগাড্রো সংখ্যা ও মোলার ভরের হিসাব।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true },
        { id: 'demo-l3', title: 'ত্রিকোণমিতিক অনুপাত', subject: 'উচ্চতর গণিত', chapter: 'অধ্যায় ১: ত্রিকোণমিতি', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(-3, 14, 40), publishDate: isoDaysFromNow(-3, 14, 40), description: 'ত্রিকোণমিতিক অনুপাত ও অভেদাবলি নিয়ে আলোচনা।', pdfUrl: '', slidesUrl: '', recordingUrl: '', published: true }
      ];
    },
    'sems_demo_classes': function () {
      return [
        { id: 'demo-c1', subject: 'পদার্থবিজ্ঞান', chapter: 'ভেক্টর', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: '' },
        { id: 'demo-c2', subject: 'রসায়ন', chapter: 'পরিমাণগত রসায়ন', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(0, 12, 0), startTime: '12:00', endTime: '13:30', mode: 'offline', classLink: '', batchId: '' },
        { id: 'demo-c3', subject: 'উচ্চতর গণিত', chapter: 'ত্রিকোণমিতি', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(1, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'online', classLink: '', batchId: '' },
        { id: 'demo-c4', subject: 'পদার্থবিজ্ঞান', chapter: 'গতিবিদ্যা', teacherName: 'নমুনা শিক্ষক', date: isoDaysFromNow(3, 10, 0), startTime: '10:00', endTime: '11:30', mode: 'offline', classLink: '', batchId: '' }
      ];
    },
    'sems_demo_attendance': function () {
      var out = [];
      for (var i = 0; i < 8; i++) {
        out.push({ id: 'demo-a' + i, studentId: 'demo', subject: ['পদার্থবিজ্ঞান', 'রসায়ন', 'উচ্চতর গণিত'][i % 3], date: isoDaysFromNow(-i, 10, 0), status: i === 4 ? 'absent' : 'present' });
      }
      return out;
    },
    'sems_demo_assignments': function () {
      return [
        { id: 'demo-as1', title: 'ভেক্টরের ১০টি গাণিতিক সমস্যা', subject: 'পদার্থবিজ্ঞান', description: 'অধ্যায় ২-এর অনুশীলনীর ১–১০ নম্বর সমস্যার সমাধান জমা দিন।', dueDate: isoDaysFromNow(2, 23, 59) },
        { id: 'demo-as2', title: 'মোল সংক্রান্ত হিসাব', subject: 'রসায়ন', description: 'মোল ও মোলার ভরের ৫টি হিসাব খাতায় করে ছবি/লিংক জমা দিন।', dueDate: isoDaysFromNow(-1, 23, 59) }
      ];
    },
    'sems_demo_exams': function () {
      return [
        { id: 'demo-e1', title: 'মাসিক পরীক্ষা — পদার্থবিজ্ঞান', subject: 'পদার্থবিজ্ঞান', date: isoDaysFromNow(5, 10, 0), startTime: '10:00', durationMinutes: 60, totalMarks: 50 },
        { id: 'demo-e2', title: 'সাপ্তাহিক কুইজ — রসায়ন', subject: 'রসায়ন', date: isoDaysFromNow(-4, 11, 0), startTime: '11:00', durationMinutes: 30, totalMarks: 25 }
      ];
    },
    'sems_demo_results': function () {
      return [
        { id: 'demo-r1', studentId: 'demo', examTitle: 'সাপ্তাহিক কুইজ — রসায়ন', subject: 'রসায়ন', marks: 20, totalMarks: 25, grade: 'A', date: isoDaysFromNow(-4, 11, 0) },
        { id: 'demo-r2', studentId: 'demo', examTitle: 'মাসিক পরীক্ষা — গণিত', subject: 'উচ্চতর গণিত', marks: 38, totalMarks: 50, grade: 'A-', date: isoDaysFromNow(-11, 10, 0) }
      ];
    }
  };

  /* ---------- Firestore পড়া (ব্যর্থ হলে খালি তালিকা) ---------- */
  function firestoreList(coll, filter) {
    var q = db().collection(coll);
    if (filter) q = q.where(filter.field, filter.op, filter.value);
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

  var SEMSStudent = {
    isDemo: isDemo,
    isReady: isReady,
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
    emptyState: emptyState,
    sortByDateDesc: sortByDateDesc,
    sortByDateAsc: sortByDateAsc,

    // গার্ড: লগইন না থাকলে ../login.html, ভুল রোলে নিজের ড্যাশবোর্ড,
    // ভর্তি ফরম শেষ না হলে ../admission.html (role-guard-ই করে)।
    // গার্ড শেষ হলেই লোডার লুকানো হয় — আটকে থাকা "লোড হচ্ছে..." ঠেকাতে।
    init: async function (pageKey) {
      SEMSLoader.show();
      var user;
      try {
        user = await SEMSRoleGuard.requireRole('student');
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

    // প্রোফাইল: users ডক + admissions ডক একসাথে (ডেমোতে localStorage)
    getProfile: async function (user) {
      var base = {
        name: user.displayName || user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        photoURL: '',
        uid: user.uid
      };
      if (isDemo()) {
        var adm = null;
        try { adm = JSON.parse(localStorage.getItem('sems_demo_admission') || 'null'); } catch (e) { adm = null; }
        if (adm) {
          base = Object.assign(base, {
            fullName: adm.fullName, dob: adm.dob, gender: adm.gender,
            bloodGroup: adm.bloodGroup, mobile: adm.mobile,
            guardianName: adm.guardianName, guardianPhone: adm.guardianPhone,
            emergencyName: adm.emergencyName, emergencyPhone: adm.emergencyPhone,
            collegeName: adm.collegeName, address: adm.address,
            courseBatch: adm.courseBatch, previousEducation: adm.previousEducation,
            photoURL: adm.photoDataUrl || ''
          });
          base.name = adm.fullName || base.name;
          base.phone = adm.mobile || base.phone;
        }
        return base;
      }
      if (!isReady()) return base;
      try {
        var userSnap = await db().collection('users').doc(user.uid).get();
        var admSnap = await db().collection('admissions').doc(user.uid).get();
        var u = userSnap.exists ? userSnap.data() : {};
        var a = admSnap.exists ? admSnap.data() : {};
        return Object.assign(base, u, a, {
          name: (u && u.name) || (a && a.fullName) || base.name,
          phone: (u && u.phone) || (a && a.mobile) || base.phone,
          photoURL: (a && (a.photoURL || a.photoDataUrl)) || (u && u.photoURL) || ''
        });
      } catch (err) {
        console.warn('[SEMS] প্রোফাইল পড়া যায়নি:', err && err.message);
        return base;
      }
    },

    // প্রোফাইল আপডেট: নাম/ফোন/ঠিকানা (শুধু নিরাপদ ফিল্ড)
    updateProfile: async function (user, data) {
      if (isDemo()) {
        var u = null;
        try { u = JSON.parse(localStorage.getItem('sems_demo_user') || 'null'); } catch (e) { u = null; }
        if (u) {
          if (data.name) { u.name = data.name; u.displayName = data.name; }
          if (data.phone) u.phone = data.phone;
          try { localStorage.setItem('sems_demo_user', JSON.stringify(u)); } catch (e) { /* ignore */ }
        }
        var adm = null;
        try { adm = JSON.parse(localStorage.getItem('sems_demo_admission') || 'null'); } catch (e) { adm = null; }
        if (adm) {
          if (data.name) adm.fullName = data.name;
          if (data.phone) adm.mobile = data.phone;
          if (data.address) adm.address = data.address;
          try { localStorage.setItem('sems_demo_admission', JSON.stringify(adm)); } catch (e) { /* ignore */ }
        }
        return;
      }
      var batch = db().batch();
      batch.set(db().collection('users').doc(user.uid), {
        name: data.name, phone: data.phone
      }, { merge: true });
      batch.set(db().collection('admissions').doc(user.uid), {
        fullName: data.name, mobile: data.phone, address: data.address
      }, { merge: true });
      batch.set(db().collection('students').doc(user.uid), {
        fullName: data.name, mobile: data.phone, address: data.address
      }, { merge: true });
      await batch.commit();
    },

    getBatch: async function (batchId) {
      if (!batchId) return null;
      if (isDemo()) return { id: batchId, name: BATCH_LABELS[batchId] || batchId };
      if (!isReady()) return null;
      try {
        var snap = await db().collection('batches').doc(batchId).get();
        if (!snap.exists) return { id: batchId, name: BATCH_LABELS[batchId] || batchId };
        var d = snap.data(); d.id = snap.id;
        return d;
      } catch (err) { return { id: batchId, name: BATCH_LABELS[batchId] || batchId }; }
    },

    getNotices: async function () {
      var list = isDemo()
        ? demoList('sems_demo_notices', DEMO_SEEDS['sems_demo_notices'])
        : (isReady() ? await firestoreList('notices') : []);
      return sortByDateDesc(list, 'createdAt').length ? sortByDateDesc(list, 'createdAt') : sortByDateDesc(list, 'publishDate');
    },

    getLectures: async function () {
      var list = isDemo()
        ? demoList('sems_demo_lectures', DEMO_SEEDS['sems_demo_lectures'])
        : (isReady() ? await firestoreList('lectures', { field: 'published', op: '==', value: true }) : []);
      return sortByDateDesc(list, 'publishDate').length ? sortByDateDesc(list, 'publishDate') : sortByDateDesc(list, 'date');
    },

    getLectureById: async function (id) {
      if (isDemo()) {
        var list = demoList('sems_demo_lectures', DEMO_SEEDS['sems_demo_lectures']);
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return null;
      }
      if (!isReady()) return null;
      try {
        var snap = await db().collection('lectures').doc(id).get();
        if (!snap.exists) return null;
        var d = snap.data(); d.id = snap.id;
        return d;
      } catch (err) { return null; }
    },

    // classes কালেকশন থাকলে পড়ে; না থাকলে খালি তালিকা (বাংলা empty state দেখায়)
    getClasses: async function (batchId) {
      var list = isDemo()
        ? demoList('sems_demo_classes', DEMO_SEEDS['sems_demo_classes'])
        : (isReady() ? await firestoreList('classes', batchId ? { field: 'batchId', op: '==', value: batchId } : null) : []);
      return sortByDateAsc(list, 'date');
    },

    getAttendance: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_attendance', DEMO_SEEDS['sems_demo_attendance'])
        : (isReady() ? await firestoreList('attendance', { field: 'studentId', op: '==', value: uid }) : []);
      return sortByDateDesc(list, 'date');
    },

    getAssignments: async function (batchId) {
      var list = isDemo()
        ? demoList('sems_demo_assignments', DEMO_SEEDS['sems_demo_assignments'])
        : (isReady() ? await firestoreList('assignments', batchId ? { field: 'batchId', op: '==', value: batchId } : null) : []);
      return sortByDateDesc(list, 'dueDate');
    },

    getExams: async function () {
      var list = isDemo()
        ? demoList('sems_demo_exams', DEMO_SEEDS['sems_demo_exams'])
        : (isReady() ? await firestoreList('exams') : []);
      return sortByDateAsc(list, 'date');
    },

    getResults: async function (uid) {
      var list = isDemo()
        ? demoList('sems_demo_results', DEMO_SEEDS['sems_demo_results'])
        : (isReady() ? await firestoreList('results', { field: 'studentId', op: '==', value: uid }) : []);
      return sortByDateDesc(list, 'date');
    },

    // অ্যাসাইনমেন্ট জমা: Firestore-এ submissions লেখার চেষ্টা,
    // না পারলে এই ব্রাউজারে (localStorage) সংরক্ষণ + অবস্থা জানানো
    getSubmissions: function () {
      try { return JSON.parse(localStorage.getItem('sems_assignment_submissions') || '{}'); } catch (e) { return {}; }
    },
    saveSubmission: async function (user, assignment, text, link) {
      var record = {
        assignmentId: assignment.id, assignmentTitle: assignment.title || '',
        studentId: user.uid, studentName: user.displayName || user.name || user.email || '',
        answerText: text || '', fileLink: link || '',
        submittedAt: new Date().toISOString(), status: 'submitted'
      };
      var subs = SEMSStudent.getSubmissions();
      subs[assignment.id] = record;
      try { localStorage.setItem('sems_assignment_submissions', JSON.stringify(subs)); } catch (e) { /* ignore */ }
      if (!isDemo() && isReady()) {
        try {
          await db().collection('submissions').doc(user.uid + '_' + assignment.id).set(record);
          record.savedOnline = true;
        } catch (err) {
          console.warn('[SEMS] জমা অনলাইনে সংরক্ষণ হয়নি (স্থানীয়ভাবে আছে):', err && err.message);
          record.savedOnline = false;
        }
      }
      return record;
    }
  };

  window.SEMSStudent = SEMSStudent;
})();
