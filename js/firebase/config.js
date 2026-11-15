/* SEMS — js/firebase/config.js | Phase 1
 * ============================================================
 * TODO (বাংলা): আসল Firebase কনফিগ এখানে বসান
 * ------------------------------------------------------------
 * ১. Firebase Console (https://console.firebase.google.com) এ
 *    নতুন প্রজেক্ট তৈরি করুন।
 * ২. Project Settings > Your apps > Web app (</>) থেকে
 *    firebaseConfig অবজেক্টটি কপি করুন।
 * ৩. নিচের PLACEHOLDER মানগুলো আপনার আসল মান দিয়ে বদলান।
 *    আসল apiKey / projectId ছাড়া Firebase কাজ করবে না।
 * ৪. Authentication > Sign-in method-এ Email/Password ও
 *    Google চালু করুন।
 * ৫. Firestore Database তৈরি করুন (Production mode)।
 * ৬. firebase/firestore.rules ও storage.rules ডেপ্লয় করুন।
 *
 * যতক্ষণ কনফিগ placeholder থাকবে, অ্যাপটি DEMO MODE-এ চলবে:
 * লগইন/রেজিস্ট্রেশন/ভর্তি ফরম localStorage-এ কাজ করবে, যাতে
 * UI ফ্লো Firebase ছাড়াই পরীক্ষা করা যায়।
 * ============================================================
 * DO NOT invent real Firebase keys, URLs or project IDs here.
 */
(function () {
  var firebaseConfig = {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID'
    // measurementId: 'YOUR_MEASUREMENT_ID' // (ঐচ্ছিক, Analytics ব্যবহার করলে)
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
