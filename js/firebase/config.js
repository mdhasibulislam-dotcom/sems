/* SEMS — js/firebase/config.js | Phase 1
 * ============================================================
 * Firebase কনফিগ বসানো হয়েছে — 2026-11-15
 * প্রজেক্ট: educational-systems-a4eaa
 * ------------------------------------------------------------
 * Authentication > Sign-in method-এ Email/Password ও Google
 * চালু আছে কিনা দেখে নিন, আর Firestore Database তৈরি আছে
 * কিনা দেখে নিন। firebase/firestore.rules ও storage.rules
 * ডেপ্লয় করতে হবে।
 *
 * এই apiKey হলো ওয়েব ক্লায়েন্ট key — ফ্রন্টএন্ডে থাকা স্বাভাবিক।
 * আসল নিরাপত্তা Firebase Security Rules দিয়ে, এই key দিয়ে নয়।
 * Service Account-এর private key কখনো এখানে বসাবেন না।
 * ============================================================
 */
(function () {
  var firebaseConfig = {
    apiKey: 'AIzaSyBw4UnTnWR_5IV2VUNBbfyrYQNLbJbP2is',
    authDomain: 'educational-systems-a4eaa.firebaseapp.com',
    projectId: 'educational-systems-a4eaa',
    storageBucket: 'educational-systems-a4eaa.firebasestorage.app',
    messagingSenderId: '304654413488',
    appId: '1:304654413488:web:1328af7c06e33b87aed575',
    measurementId: 'G-CSPREP008J'
  };

  // Placeholder কিনা চেক করা — কোনো একটা মানও 'YOUR_' দিয়ে শুরু
  // হলেই ধরে নেওয়া হবে আসল কনফিগ এখনো বসানো হয়নি।
  function isPlaceholder(cfg) {
    return !cfg || Object.keys(cfg).some(function (k) {
      return typeof cfg[k] === 'string' && cfg[k].indexOf('YOUR_') === 0;
    });
  }

  var isDemo = isPlaceholder(firebaseConfig);

  window.SEMS = window.SEMS || {};
  window.SEMS.firebaseConfig = firebaseConfig;
  window.SEMS.isDemo = isDemo;

  // আসল কনফিগ থাকলে Firebase অ্যাপ শুরু করো; ডেমো মোডে স্কিপ করো।
  if (!isDemo && typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      window.SEMS.firebaseReady = true;
    } catch (e) {
      console.error('[SEMS] Firebase initialize ব্যর্থ:', e);
      window.SEMS.firebaseReady = false;
    }
  } else {
    window.SEMS.firebaseReady = false;
    if (isDemo) console.warn('[SEMS] Demo mode: Firebase config বসানো হয়নি। localStorage ডেমো ব্যবহার হচ্ছে।');
  }
})();
