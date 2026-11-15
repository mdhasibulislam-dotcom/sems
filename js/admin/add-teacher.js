/* SEMS — js/admin/add-teacher.js | Phase 4
 * শিক্ষক যোগ: রেজিস্টার করা ইউজারকে ইমেইল দিয়ে খুঁজে তার users
 * ডকের role 'teacher' করা। ক্লায়েন্ট কোড দিয়ে অন্য কারো Auth
 * অ্যাকাউন্ট বানানো যায় না — শিক্ষককে আগে রেজিস্টার করতে হবে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('teachers'); } catch (e) { return; }
  var allUsers = [];
  var found = null;
  try { allUsers = await SEMSAdmin.getAllUsers(); } catch (err) { console.warn('[SEMS] ইউজার লোড ব্যর্থ:', err && err.message); }
  document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('searchEmail').value.trim().toLowerCase();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    found = null;
    allUsers.forEach(function (u) { if ((u.email || '').toLowerCase() === email) found = u; });
    var box = document.getElementById('foundBox');
    if (!found) {
      box.hidden = true;
      errBox.textContent = 'এই ইমেইলে কোনো রেজিস্টার করা অ্যাকাউন্ট পাওয়া যায়নি। শিক্ষককে আগে রেজিস্টার করতে বলুন, তারপর আবার চেষ্টা করুন।';
      errBox.hidden = false;
      return;
    }
    document.getElementById('foundName').textContent = found.name || found.displayName || found.email;
    document.getElementById('foundEmail').textContent = found.email || '';
    document.getElementById('foundRole').textContent = found.role === 'teacher' ? 'ইতিমধ্যে শিক্ষক' : 'বর্তমান রোল: ' + (found.role || 'student');
    box.hidden = false;
  });
  document.getElementById('roleForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!found) return;
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      subject: document.getElementById('subject').value.trim(),
      phone: document.getElementById('phone').value.trim()
    };
    if (!data.subject) {
      errBox.textContent = 'শিক্ষকের বিষয় লিখুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      await SEMSAdmin.setTeacherRole(found.uid || found.id, data);
      SEMSLoader.hide();
      okBox.textContent = 'শিক্ষক হিসেবে যোগ হয়েছে — এখন থেকে এই অ্যাকাউন্টে লগইন করলে শিক্ষক ড্যাশবোর্ড আসবে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('শিক্ষক যোগ হয়েছে।');
      e.target.reset();
      document.getElementById('foundBox').hidden = true;
      found = null;
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'শিক্ষক যোগ করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
