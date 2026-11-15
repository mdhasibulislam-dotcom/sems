/* SEMS — js/firebase/firestore.js | Phase 1
 * Firestore অপারেশন: ভর্তি ফরম সংরক্ষণ, প্রোফাইল পড়া।
 * ডেমো মোডে localStorage-এ সংরক্ষণ করা হয়।
 */
(function () {
  var DEMO_ADMISSION_KEY = 'sems_demo_admission';

  var SEMSFirestore = {
    // ভর্তি ফরম সংরক্ষণ: admissions কালেকশন + users প্রোফাইল আপডেট
    // photoFile: আসল File (Firebase Storage-এ আপলোডের জন্য)
    // photoDataUrl: ডেমো মোডে প্রিভিউ data URL (localStorage-এ সংরক্ষণ)
    saveAdmission: async function (user, data, photoFile, photoDataUrl) {
      if (window.SEMS && SEMS.isDemo) {
        var record = Object.assign({}, data, {
          photoDataUrl: photoDataUrl || '',
          submittedAt: new Date().toISOString(),
          status: 'pending'
        });
        localStorage.setItem(DEMO_ADMISSION_KEY, JSON.stringify(record));
        await SEMSAuth.markAdmissionCompleted(user.uid);
        return record;
      }
      // ছবি আপলোড: Storage-এর নিয়ম (Rules) না বসানো থাকলে বা
      // Storage চালু না থাকলে আপলোড আটকে/ব্যর্থ হতে পারে। ছবি
      // ফরমের মূল অংশ না — আপলোড না হলে ছবি ছাড়াই ফরম জমা হবে,
      // যাতে "লোড হচ্ছে..."-এ আটকে ড্যাশবোর্ড না আসার মতো অবস্থা
      // আর না হয়। (নিয়ম বসালে পরের বার ছবিসহ জমা হবে।)
      var photoURL = '';
      if (photoFile) {
        try {
          photoURL = await Promise.race([
            SEMSStorage.uploadStudentPhoto(user.uid, photoFile),
            new Promise(function (resolve) {
              setTimeout(function () { resolve(''); }, 15000);
            })
          ]);
        } catch (e) {
          console.warn('[SEMS] ছবি আপলোড হয়নি, ছবি ছাড়াই জমা হচ্ছে:', e && e.message);
          photoURL = '';
        }
      }
      var db = firebase.firestore();
      var record = Object.assign({}, data, {
        photoURL: photoURL,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // admissions/{uid} ও students/{uid} — দুই জায়গায় একই তথ্য
      var batch = db.batch();
      batch.set(db.collection('admissions').doc(user.uid), record);
      batch.set(db.collection('students').doc(user.uid), record);
      await batch.commit();
      await SEMSAuth.markAdmissionCompleted(user.uid);
      return record;
    },

    // ভর্তি ফরম পড়া (ইতিমধ্যে জমা দেওয়া আছে কিনা দেখতে)
    getAdmission: async function (uid) {
      if (window.SEMS && SEMS.isDemo) {
        try { return JSON.parse(localStorage.getItem(DEMO_ADMISSION_KEY) || 'null'); } catch (e) { return null; }
      }
      var snap = await firebase.firestore().collection('admissions').doc(uid).get();
      return snap.exists ? snap.data() : null;
    },

    // ইউজার প্রোফাইল পড়া
    getUserProfile: async function (uid) {
      if (window.SEMS && SEMS.isDemo) return null;
      var snap = await firebase.firestore().collection('users').doc(uid).get();
      return snap.exists ? snap.data() : null;
    }
  };

  window.SEMSFirestore = SEMSFirestore;
})();
