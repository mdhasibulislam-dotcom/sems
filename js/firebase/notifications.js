/* SEMS — js/firebase/notifications.js | Phase 1 (FCM স্টাব) + Phase 5 (ইন-অ্যাপ)
 * ইন-অ্যাপ নোটিফিকেশন: অ্যাডমিন নোটিশ দিলে, শিক্ষক লেকচার /
 * অ্যাসাইনমেন্ট / পরীক্ষা প্রকাশ করলে বা রেজাল্ট দিলে সংশ্লিষ্ট
 * শিক্ষার্থী/শিক্ষক `notifications` কালেকশনে একটা করে ডক পায় —
 * নেভবারের ঘণ্টায় অপঠিত সংখ্যা (ব্যাজ) ওঠে, নোটিফিকেশন পেজে
 * তালিকা দেখা যায় ও পড়া হয়েছে বলে চিহ্ন দেওয়া যায়।
 *
 * নোট: এটি শুধু ইন-অ্যাপ নোটিফিকেশন। ফোনে পুশ নোটিফিকেশন
 * (FCM) এখানে নেই — সেটার জন্য Blaze (pay-as-you-go) প্ল্যান ও
 * Cloud Functions লাগবে; তাই আপাতত অ্যাপ খুললেই নোটিফিকেশন
 * দেখা যাবে, বন্ধ থাকা অবস্থায় ফোনে আসবে না। নিচের FCM স্টাব
 * (supported/init/onForegroundMessage) আগের মতোই আছে, Phase 5-এ
 * পুশ চালু করতে চাইলে সেটাই বাড়ানো হবে।
 *
 * ডক আকার: { userId, title, body, type, link, batchId, audience,
 *   createdAt, read } — link হলো প্রাপকের নিজের পেজের সাপেক্ষে
 *   আপেক্ষিক পথ (যেমন 'lectures.html', 'notices.html')।
 * ডেমো মোডে localStorage-এ (sems_demo_notifications) সংরক্ষণ হয়।
 */
(function () {
  var DEMO_KEY = 'sems_demo_notifications';

  function isDemo() { return !!(window.SEMS && window.SEMS.isDemo); }
  function isReady() { return !!(window.SEMS && window.SEMS.firebaseReady); }
  function db() { return firebase.firestore(); }

  function toDate(v) {
    if (!v) return null;
    if (typeof v.toDate === 'function') { try { return v.toDate(); } catch (e) { return null; } }
    if (v instanceof Date) return v;
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function isoDaysFromNow(n, h, m) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    d.setHours(h == null ? 10 : h, m == null ? 0 : m, 0, 0);
    return d.toISOString();
  }
  function demoRead() {
    try {
      var raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* পড়া যায়নি */ }
    return null;
  }
  function demoSeed() {
    var data = [
      { id: 'demo-nt1', userId: 'demo', title: 'নতুন নোটিশ: মাসিক পরীক্ষার তারিখ ঘোষণা', body: 'এই মাসের মাসিক পরীক্ষা আগামী সপ্তাহে অনুষ্ঠিত হবে। রুটিন শীঘ্রই জানানো হবে।', type: 'notice', link: 'notices.html', batchId: '', audience: 'all', createdAt: isoDaysFromNow(0, 8, 0), read: false },
      { id: 'demo-nt2', userId: 'demo', title: 'নতুন লেকচার: ভেক্টর ও স্কেলার রাশি', body: 'পদার্থবিজ্ঞান — অধ্যায় ২: ভেক্টর। লেকচার পেজে দেখুন।', type: 'lecture', link: 'lectures.html', batchId: '', audience: 'batch', createdAt: isoDaysFromNow(-1, 10, 0), read: false },
      { id: 'demo-nt3', userId: 'demo', title: 'রেজাল্ট প্রকাশ হয়েছে: সাপ্তাহিক কুইজ — রসায়ন', body: 'আপনি ২৫-এর মধ্যে ২০ পেয়েছেন। গ্রেড: A।', type: 'result', link: 'results.html', batchId: '', audience: 'user', createdAt: isoDaysFromNow(-2, 11, 0), read: true }
    ];
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    return data;
  }
  function demoList() {
    var list = demoRead();
    return list || demoSeed();
  }
  function demoSave(list) {
    try { localStorage.setItem(DEMO_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  // Firestore-এ ব্যাচ লেখা: সর্বোচ্চ ৫০০ অপারেশন/ব্যাচ — নিরাপদে ৪০০ করে।
  async function writeDocs(records) {
    var total = 0;
    for (var i = 0; i < records.length; i += 400) {
      var chunk = records.slice(i, i + 400);
      var batch = db().batch();
      chunk.forEach(function (rec) {
        var ref = db().collection('notifications').doc();
        batch.set(ref, Object.assign({}, rec, {
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }));
      });
      await batch.commit();
      total += chunk.length;
    }
    return total;
  }

  // প্রাপক খোঁজা: ব্যাচের শিক্ষার্থী (students ডকের uid-ই Auth uid;
  // ভর্তি ফরমে students/{uid} ডকে uid ফিল্ড থাকে)
  async function studentUidsForBatch(batchId) {
    if (!batchId) return [];
    if (!isReady()) return [];
    try {
      var snap = await db().collection('students').where('batchId', '==', batchId).get();
      var ids = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        // অ্যাডমিনের হাতে বানানো রেকর্ডের (uid ছাড়া, auto-id) কোনো
        // লগইন অ্যাকাউন্ট নেই — তাকে নোটিফিকেশন পাঠানো যায় না।
        if (d.uid) ids.push(d.uid);
      });
      return ids.filter(function (v, i, a) { return a.indexOf(v) === i; });
    } catch (err) {
      console.warn('[SEMS] ব্যাচের শিক্ষার্থী খুঁজতে ব্যর্থ:', err && err.message);
      return [];
    }
  }
  // সব শিক্ষার্থী: students কালেকশন থেকে uid-সহ ডকগুলো
  async function allStudentUids() {
    if (!isReady()) return [];
    try {
      var snap = await db().collection('students').get();
      var ids = [];
      snap.forEach(function (doc) {
        var d = doc.data() || {};
        if (d.uid) ids.push(d.uid);
      });
      return ids.filter(function (v, i, a) { return a.indexOf(v) === i; });
    } catch (err) {
      console.warn('[SEMS] শিক্ষার্থীদের খুঁজতে ব্যর্থ:', err && err.message);
      return [];
    }
  }
  // সব শিক্ষক: users কালেকশন থেকে role == 'teacher'
  async function allTeacherUids() {
    if (!isReady()) return [];
    try {
      var snap = await db().collection('users').where('role', '==', 'teacher').get();
      var ids = [];
      snap.forEach(function (doc) { ids.push(doc.id); });
      return ids;
    } catch (err) {
      console.warn('[SEMS] শিক্ষকদের খুঁজতে ব্যর্থ:', err && err.message);
      return [];
    }
  }

  function sortList(list) {
    return list.slice().sort(function (a, b) {
      if (!!a.read !== !!b.read) return a.read ? 1 : -1;
      var da = toDate(a.createdAt) || new Date(0);
      var dbb = toDate(b.createdAt) || new Date(0);
      return dbb - da;
    });
  }

  var SEMSNotifications = {
    TYPES_BN: {
      notice: 'নোটিশ', lecture: 'লেকচার', assignment: 'অ্যাসাইনমেন্ট',
      exam: 'পরীক্ষা', result: 'রেজাল্ট', general: 'সাধারণ'
    },
    typeLabel: function (type) {
      return SEMSNotifications.TYPES_BN[type] || 'নোটিফিকেশন';
    },

    /* ---------- Phase 1 FCM স্টাব (আগের মতোই, অপরিবর্তিত) ---------- */
    supported: function () {
      return !!(window.SEMS && !SEMS.isDemo && SEMS.firebaseReady &&
        typeof firebase !== 'undefined' && firebase.messaging &&
        'Notification' in window && 'serviceWorker' in navigator);
    },

    // নোটিফিকেশনের অনুমতি চাওয়া ও FCM টোকেন সংগ্রহ করা
    // Phase 5-এ: টোকেনটি users/{uid} ডকুমেন্টে সংরক্ষণ করা হবে।
    init: async function () {
      if (!this.supported()) {
        console.info('[SEMS] Notifications: FCM চালু নয় (ডেমো মোড বা সাপোর্ট নেই) — স্কিপ করা হচ্ছে।');
        return null;
      }
      try {
        var messaging = firebase.messaging();
        var permission = await Notification.requestPermission();
        if (permission !== 'granted') return null;
        var token = await messaging.getToken({
          vapidKey: 'YOUR_VAPID_KEY' // TODO: Firebase Console > Cloud Messaging থেকে VAPID key বসান (Phase 5)
        });
        console.info('[SEMS] FCM token পাওয়া গেছে।');
        return token;
      } catch (e) {
        console.warn('[SEMS] FCM শুরু করা যায়নি:', e);
        return null;
      }
    },

    // ফোরগ্রাউন্ডে মেসেজ এলে Toast দেখানো (Phase 5-এ চালু হবে)
    onForegroundMessage: function (callback) {
      if (!this.supported()) return;
      try {
        firebase.messaging().onMessage(function (payload) {
          if (typeof callback === 'function') callback(payload);
        });
      } catch (e) {
        console.warn('[SEMS] onMessage সেট করা যায়নি:', e);
      }
    },

    /* ---------- Phase 5 ইন-অ্যাপ নোটিফিকেশন ---------- */

    // একজনের জন্য একটি নোটিফিকেশন লেখা
    createNotification: async function (data) {
      if (!data || !data.userId || !data.title) return null;
      var record = {
        userId: data.userId,
        title: String(data.title),
        body: data.body || '',
        type: data.type || 'general',
        link: data.link || '',
        batchId: data.batchId || '',
        audience: data.audience || 'user',
        read: false,
        createdAt: new Date().toISOString()
      };
      if (isDemo()) {
        record.id = 'demo-nt' + Date.now();
        var list = demoList();
        list.unshift(record);
        demoSave(list);
        return record;
      }
      if (!isReady()) return null;
      var ref = await db().collection('notifications').add(Object.assign({}, record, {
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }));
      record.id = ref.id;
      return record;
    },

    // অনেকজনের জন্য একই নোটিফিকেশন (প্রতি প্রাপকে একটি ডক)
    sendToUserIds: async function (userIds, data) {
      var ids = (userIds || []).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
      if (!ids.length) return 0;
      if (isDemo()) {
        // ডেমোতে প্রাপক যেই হোক, ডেমো ইউজারের ('demo') তালিকায়
        // একটাই নমুনা নোটিফিকেশন যোগ হয় — যাতে ডেমো পেজে দেখা যায়।
        await SEMSNotifications.createNotification(Object.assign({}, data, { userId: 'demo' }));
        return 1;
      }
      if (!isReady()) return 0;
      var records = ids.map(function (uid) {
        return {
          userId: uid, title: String(data.title || ''),
          body: data.body || '', type: data.type || 'general',
          link: data.link || '', batchId: data.batchId || '',
          audience: data.audience || 'user', read: false
        };
      });
      return writeDocs(records);
    },

    // একটি ব্যাচের সব শিক্ষার্থীকে
    sendToBatch: async function (batchId, data) {
      if (!batchId) return 0;
      if (isDemo()) {
        await SEMSNotifications.createNotification(Object.assign({}, data, { userId: 'demo', batchId: batchId, audience: 'batch' }));
        return 1;
      }
      var ids = await studentUidsForBatch(batchId);
      return SEMSNotifications.sendToUserIds(ids, Object.assign({}, data, { batchId: batchId, audience: 'batch' }));
    },

    // সব শিক্ষার্থীকে
    sendToAllStudents: async function (data) {
      if (isDemo()) {
        await SEMSNotifications.createNotification(Object.assign({}, data, { userId: 'demo', audience: 'all' }));
        return 1;
      }
      var ids = await allStudentUids();
      return SEMSNotifications.sendToUserIds(ids, Object.assign({}, data, { audience: 'all' }));
    },

    // সব শিক্ষককে
    sendToAllTeachers: async function (data) {
      if (isDemo()) {
        await SEMSNotifications.createNotification(Object.assign({}, data, { userId: 'demo', audience: 'all' }));
        return 1;
      }
      var ids = await allTeacherUids();
      return SEMSNotifications.sendToUserIds(ids, Object.assign({}, data, { audience: 'all' }));
    },

    // নিজের নোটিফিকেশন — অপঠিত আগে, তারপর নতুন থেকে পুরনো
    getMyNotifications: async function (uid) {
      if (!uid) return [];
      if (isDemo()) {
        var list = demoList().filter(function (n) { return n.userId === 'demo' || n.userId === uid; });
        return sortList(list);
      }
      if (!isReady()) return [];
      try {
        // orderBy না দিয়ে ক্লায়েন্টে সাজানো হয় — নাহলে Firestore
        // কম্পোজিট ইনডেক্স চাইতো।
        var snap = await db().collection('notifications').where('userId', '==', uid).get();
        var out = [];
        snap.forEach(function (doc) { var d = doc.data(); d.id = doc.id; out.push(d); });
        return sortList(out);
      } catch (err) {
        console.warn('[SEMS] নোটিফিকেশন পড়া যায়নি:', err && err.message);
        return [];
      }
    },

    getUnreadCount: async function (uid) {
      if (!uid) return 0;
      if (isDemo()) {
        return demoList().filter(function (n) {
          return (n.userId === 'demo' || n.userId === uid) && !n.read;
        }).length;
      }
      if (!isReady()) return 0;
      try {
        var snap = await db().collection('notifications')
          .where('userId', '==', uid).where('read', '==', false).get();
        return snap.size;
      } catch (err) {
        console.warn('[SEMS] অপঠিত সংখ্যা পড়া যায়নি:', err && err.message);
        return 0;
      }
    },

    markRead: async function (id) {
      if (!id) return;
      if (isDemo()) {
        var list = demoList();
        list.forEach(function (n) { if (n.id === id) n.read = true; });
        demoSave(list);
        return;
      }
      if (!isReady()) return;
      await db().collection('notifications').doc(id).update({ read: true });
    },

    markAllRead: async function (uid) {
      if (!uid) return 0;
      if (isDemo()) {
        var list = demoList();
        var count = 0;
        list.forEach(function (n) {
          if ((n.userId === 'demo' || n.userId === uid) && !n.read) { n.read = true; count++; }
        });
        demoSave(list);
        return count;
      }
      if (!isReady()) return 0;
      var unread = await SEMSNotifications.getMyNotifications(uid);
      unread = unread.filter(function (n) { return !n.read; });
      var total = 0;
      for (var i = 0; i < unread.length; i += 400) {
        var chunk = unread.slice(i, i + 400);
        var batch = db().batch();
        chunk.forEach(function (n) {
          batch.update(db().collection('notifications').doc(n.id), { read: true });
        });
        await batch.commit();
        total += chunk.length;
      }
      return total;
    }
  };

  window.SEMSNotifications = SEMSNotifications;
})();
