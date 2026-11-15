/* SEMS — js/admin/courses.js | Phase 4
 * কোর্সের তালিকা + নতুন কোর্স তৈরি। সতর্কতা: firestore.rules-এ
 * courses-এর match ব্লক নেই — আসল Firebase-এ লেখা
 * permission-denied হবে যতক্ষণ না Rules-এ courses যোগ হয়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('courses'); } catch (e) { return; }
  var courses = [];
  function render() {
    var wrap = document.getElementById('courseList');
    if (!courses.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('book', 'কোনো কোর্স নেই', 'নিচের ফরম থেকে কোর্স যোগ করুন।');
      return;
    }
    wrap.innerHTML = courses.map(function (c) {
      return '<div class="list-item"><h3>' + SEMSAdmin.esc(c.name || '') + '</h3>' +
        '<p>' + SEMSAdmin.esc(c.description || '') + '</p>' +
        '<div class="list-meta"><span>' + SEMSAdmin.esc(c.subject || '') + '</span></div></div>';
    }).join('');
  }
  try {
    courses = await SEMSAdmin.getCourses();
    render();
  } catch (err) {
    console.warn('[SEMS] কোর্স লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('কোর্স লোড করা যায়নি।');
  }
  document.getElementById('courseForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      name: document.getElementById('courseName').value.trim(),
      subject: document.getElementById('courseSubject').value.trim(),
      description: document.getElementById('courseDesc').value.trim()
    };
    if (!data.name) {
      errBox.textContent = 'কোর্সের নাম লিখুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addCourse(data);
      courses.unshift(rec);
      render();
      SEMSLoader.hide();
      okBox.textContent = 'কোর্স যোগ হয়েছে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('কোর্স যোগ হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      var msg = err && err.message ? err.message : 'কোর্স যোগ করা যায়নি।';
      if (msg.indexOf('permission-denied') !== -1 || msg.indexOf('PERMISSION_DENIED') !== -1) {
        msg = 'কোর্স যোগ করা যায়নি: Firestore-এর Rules-এ courses-এর নিয়ম নেই। Rules ফাইলে courses-এর allow যোগ করে Publish করতে হবে।';
      }
      errBox.textContent = msg;
      errBox.hidden = false;
    }
  });
});
