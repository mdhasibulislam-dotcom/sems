/* SEMS — js/admin/add-student.js | Phase 4
 * শিক্ষার্থী সরাসরি যোগ: students ডকে রেকর্ড। Auth অ্যাকাউন্ট
 * এতে বানানো হয় না — শিক্ষার্থীকে রেজিস্টার করতে হবে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('students'); } catch (e) { return; }
  var batches = [];
  try {
    batches = await SEMSAdmin.getBatches();
    var sel = document.getElementById('courseBatch');
    batches.forEach(function (bt) {
      var opt = document.createElement('option');
      opt.value = bt.id;
      opt.textContent = bt.name || bt.id;
      sel.appendChild(opt);
    });
  } catch (err) { console.warn('[SEMS] ব্যাচ লোড ব্যর্থ:', err && err.message); }
  document.getElementById('addStudentForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      fullName: document.getElementById('fullName').value.trim(),
      email: document.getElementById('email').value.trim(),
      mobile: document.getElementById('mobile').value.trim(),
      collegeName: document.getElementById('collegeName').value.trim(),
      batchId: document.getElementById('courseBatch').value,
      address: document.getElementById('address').value.trim()
    };
    if (!data.fullName || !data.mobile || !data.batchId) {
      errBox.textContent = 'নাম, মোবাইল ও ব্যাচ পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      var rec = await SEMSAdmin.addStudentRecord(data);
      SEMSLoader.hide();
      okBox.textContent = 'শিক্ষার্থী যোগ হয়েছে। মনে রাখবেন: শিক্ষার্থীকে অ্যাপে রেজিস্টার করতে হবে, নাহলে সে লগইন করতে পারবে না।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('শিক্ষার্থী যোগ হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'শিক্ষার্থী যোগ করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
