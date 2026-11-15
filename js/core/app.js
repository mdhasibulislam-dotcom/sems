/* SEMS — js/core/app.js | Phase 1
 * অ্যাপ শুরু: ডেমো মোডের সতর্কতা, Firebase Auth state শোনা।
 */
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    if (window.SEMS && SEMS.isDemo) {
      console.warn('[SEMS] Demo mode — Firebase config বসানো হয়নি।');
    }
    // Firebase চালু থাকলে Auth state পরিবর্তন শুনে রাখো (পেজগুলো
    // নিজেরাই getCurrentUser() দিয়ে গার্ড চালায়; এখানে শুধু লগ রাখা হয়)
    if (window.SEMS && SEMS.firebaseReady && typeof firebase !== 'undefined') {
      firebase.auth().onAuthStateChanged(function (user) {
        console.info('[SEMS] Auth state:', user ? user.email : 'logged out');
      });
    }
  });
})();
