/* SEMS — js/teacher/profile.js | Phase 3
 * শিক্ষক প্রোফাইল: users ডক থেকে তথ্য।
 * সম্পাদনা শুধু নিরাপদ ফিল্ডে — নাম, মোবাইল।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('profile'); } catch (e) { return; }

  function kv(k, v) {
    return '<dt>' + SEMSTeacher.esc(k) + '</dt><dd>' + SEMSTeacher.esc(v || '—') + '</dd>';
  }

  try {
    var profile = await SEMSTeacher.getProfile(user);
    var name = profile.name || user.displayName || user.name || user.email || 'শিক্ষক';
    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var students = await SEMSTeacher.getMyStudents(user.uid);
    var teacherId = 'SEMS-T-' + String(user.uid || '').slice(-6).toUpperCase();

    var photoEl = document.getElementById('profilePhoto');
    if (photoEl) {
      photoEl.innerHTML = profile.photoURL
        ? '<img src="' + SEMSTeacher.esc(profile.photoURL) + '" alt="শিক্ষকের ছবি">'
        : SEMSTeacher.esc(String(name).charAt(0));
    }
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
    var metaEl = document.getElementById('profileMeta');
    if (metaEl) metaEl.textContent = teacherId + ' • শিক্ষক';

    var infoEl = document.getElementById('infoList');
    if (infoEl) {
      var batchNames = batches.length
        ? batches.map(function (b) { return b.name || b.title || SEMSTeacher.batchLabel(b.id); }).join(', ')
        : '—';
      infoEl.innerHTML =
        '<h3 class="section-title">ব্যক্তিগত তথ্য</h3><dl class="kv">' +
        kv('পুরো নাম', name) + kv('ইমেইল', profile.email) +
        kv('মোবাইল', profile.phone) +
        kv('শিক্ষক আইডি', teacherId) + '</dl>' +
        '<h3 class="section-title">আমার ব্যাচ</h3><dl class="kv">' +
        kv('ব্যাচ', batchNames) +
        kv('মোট ব্যাচ', String(batches.length)) +
        kv('মোট শিক্ষার্থী', String(students.length)) + '</dl>';
    }

    document.getElementById('editName').value = name;
    document.getElementById('editPhone').value = profile.phone || '';

    var form = document.getElementById('editForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var newName = document.getElementById('editName').value.trim();
        var newPhone = document.getElementById('editPhone').value.trim();
        var msg = document.getElementById('profileMsg');
        if (!newName) { if (msg) { msg.textContent = 'নাম খালি রাখা যাবে না।'; msg.hidden = false; } return; }
        if (newPhone && !/^01[3-9]\d{8}$/.test(newPhone)) {
          if (msg) { msg.textContent = 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।'; msg.hidden = false; }
          return;
        }
        try {
          await SEMSTeacher.updateProfile(user, { name: newName, phone: newPhone });
          if (msg) { msg.textContent = 'প্রোফাইল আপডেট হয়েছে।'; msg.hidden = false; }
          if (window.SEMSToast) SEMSToast.success('প্রোফাইল আপডেট হয়েছে।');
          setTimeout(function () { window.location.reload(); }, 800);
        } catch (err) {
          if (msg) { msg.textContent = 'আপডেট করা যায়নি। আবার চেষ্টা করুন।'; msg.hidden = false; }
        }
      });
    }
  } catch (err) {
    console.warn('[SEMS] প্রোফাইল লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('প্রোফাইল লোড করা যায়নি।');
  }
});
