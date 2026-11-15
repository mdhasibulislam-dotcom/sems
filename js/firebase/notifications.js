/* SEMS — js/firebase/notifications.js | Phase 1
 * Cloud Messaging (FCM) স্টাব — Phase 5-এ পূর্ণাঙ্গ হবে।
 * কনফিগ না থাকলে বা ব্রাউজার সাপোর্ট না করলে নিরাপদে কিছুই করে না।
 */
(function () {
  var SEMSNotifications = {
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
    }
  };

  window.SEMSNotifications = SEMSNotifications;
})();
