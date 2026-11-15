/* SEMS — js/admin/settings.js | Phase 4
 * সেটিংস: প্রতিষ্ঠানের সাধারণ তথ্য (settings/general ডক)।
 * Rules-এ settings শুধু অ্যাডমিন পড়তে/লিখতে পারে।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('settings'); } catch (e) { return; }
  var current = {};
  try {
    current = await SEMSAdmin.getSettings();
    document.getElementById('siteName').value = current.siteName || 'SEMS — Sinha Education Management System';
    document.getElementById('instituteName').value = current.instituteName || '';
    document.getElementById('contactEmail').value = current.contactEmail || '';
    document.getElementById('contactPhone').value = current.contactPhone || '';
    document.getElementById('notice').value = current.notice || '';
  } catch (err) {
    console.warn('[SEMS] সেটিংস লোড ব্যর্থ:', err && err.message);
  }
  document.getElementById('settingsForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      siteName: document.getElementById('siteName').value.trim(),
      instituteName: document.getElementById('instituteName').value.trim(),
      contactEmail: document.getElementById('contactEmail').value.trim(),
      contactPhone: document.getElementById('contactPhone').value.trim(),
      notice: document.getElementById('notice').value.trim()
    };
    SEMSLoader.show();
    try {
      await SEMSAdmin.updateSettings(data);
      SEMSLoader.hide();
      okBox.textContent = 'সেটিংস সংরক্ষণ হয়েছে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('সেটিংস সংরক্ষণ হয়েছে।');
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'সেটিংস সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
