/* SEMS — js/firebase/storage.js | Phase 1
 * Firebase Storage: শিক্ষার্থীর ছবি আপলোড।
 * ডেমো মোডে আপলোড হয় না — data URL সরাসরি ব্যবহার করা হয়।
 */
(function () {
  var SEMSStorage = {
    // শিক্ষার্থীর প্রোফাইল ছবি: students/{uid}/photo.jpg
    uploadStudentPhoto: async function (uid, file) {
      if (!file) return '';
      if (window.SEMS && SEMS.isDemo) return ''; // ডেমোতে data URL ব্যবহার হয়
      var ref = firebase.storage().ref('students/' + uid + '/photo.jpg');
      await ref.put(file);
      return await ref.getDownloadURL();
    },

    // লেকচার/স্লাইড ফাইল আপলোড (Phase 3/4-এ ব্যবহার হবে)
    uploadLectureFile: async function (batchId, file) {
      if (window.SEMS && SEMS.isDemo) return '';
      var path = 'lectures/' + batchId + '/' + Date.now() + '_' + file.name;
      var ref = firebase.storage().ref(path);
      await ref.put(file);
      return await ref.getDownloadURL();
    }
  };

  window.SEMSStorage = SEMSStorage;
})();
