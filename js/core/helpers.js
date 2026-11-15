/* SEMS — js/core/helpers.js | Phase 1
 * ছোট ছোট সহায়ক ফাংশন: তারিখ ফরম্যাট, Firebase এরর বার্তা বাংলায়।
 */
(function () {
  var AUTH_ERRORS = {
    'auth/user-not-found': 'এই ইমেইল/ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি।',
    'auth/wrong-password': 'ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।',
    'auth/invalid-email': 'সঠিক ইমেইল ঠিকানা দিন।',
    'auth/email-already-in-use': 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।',
    'auth/weak-password': 'পাসওয়ার্ড খুব দুর্বল। কমপক্ষে ৮ অক্ষর ব্যবহার করুন।',
    'auth/too-many-requests': 'অনেকবার ভুল চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
    'auth/popup-closed-by-user': 'Google সাইন-ইন উইন্ডোটি বন্ধ করা হয়েছে।',
    'auth/cancelled-popup-request': 'Google সাইন-ইন বাতিল হয়েছে।',
    'auth/network-request-failed': 'ইন্টারনেট সংযোগে সমস্যা। সংযোগ চেক করে আবার চেষ্টা করুন।',
    'auth/username-taken': 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে।',
    'auth/demo-mode': 'ডেমো মোডে এই সুবিধাটি কাজ করে না। Firebase config বসানোর পর কাজ করবে।',
    'auth/invalid-role': 'অ্যাডমিন নিজে রেজিস্টার করতে পারবে না।'
  };

  var SEMSHelpers = {
    // Firebase এরর কোডকে বাংলায় সহজ বার্তায় বদলানো
    friendlyAuthError: function (err) {
      if (!err) return 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
      if (err.code && AUTH_ERRORS[err.code]) return AUTH_ERRORS[err.code];
      return err.message || 'কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।';
    },

    // তারিখ: 2026-11-15 -> ১৫ নভেম্বর ২০২৬ (বাংলা সংখ্যায়)
    formatDateBn: function (isoDate) {
      if (!isoDate) return '';
      var d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      var months = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      var bn = function (n) { return String(n).replace(/\d/g, function (x) { return '০১২৩৪৫৬৭৮৯'[x]; }); };
      return bn(d.getDate()) + ' ' + months[d.getMonth()] + ' ' + bn(d.getFullYear());
    },

    // ইংরেজি সংখ্যাকে বাংলায়
    toBnDigits: function (value) {
      return String(value).replace(/\d/g, function (x) { return '০১২৩৪৫৬৭৮৯'[x]; });
    },

    // HTML escape (XSS প্রতিরোধে ইউজার ইনপুট দেখানোর সময়)
    escapeHtml: function (str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  };

  window.SEMSHelpers = SEMSHelpers;
})();
