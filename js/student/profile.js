/* SEMS — js/student/profile.js | Phase 2
 * শিক্ষার্থী প্রোফাইল: users + admissions ডক থেকে তথ্য।
 * সম্পাদনা শুধু নিরাপদ ফিল্ডে — নাম, মোবাইল, ঠিকানা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('profile'); } catch (e) { return; }

  var GENDER_BN = { male: 'ছেলে', female: 'মেয়ে', other: 'অন্যান্য' };
  var EDU_BN = { ssc: 'এসএসসি (SSC)', hsc: 'এইচএসসি (HSC)', 'hsc-running': 'এইচএসসি চলমান', other: 'অন্যান্য' };

  function kv(k, v) {
    return '<dt>' + SEMSStudent.esc(k) + '</dt><dd>' + SEMSStudent.esc(v || '—') + '</dd>';
  }

  try {
    var profile = await SEMSStudent.getProfile(user);
    var name = profile.fullName || profile.name || user.displayName || user.name || user.email || 'শিক্ষার্থী';
    var batchId = profile.courseBatch || profile.batchId || '';
    var batch = batchId ? await SEMSStudent.getBatch(batchId) : null;
    var batchName = batch ? (batch.name || batch.title || SEMSStudent.batchLabel(batchId)) : (batchId ? SEMSStudent.batchLabel(batchId) : '—');
    var studentId = 'SEMS-' + String(user.uid || '').slice(-6).toUpperCase();

    var photoEl = document.getElementById('profilePhoto');
    if (photoEl) {
      photoEl.innerHTML = profile.photoURL
        ? '<img src="' + SEMSStudent.esc(profile.photoURL) + '" alt="শিক্ষার্থীর ছবি">'
        : SEMSStudent.esc(String(name).charAt(0));
    }
    var nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = name;
    var metaEl = document.getElementById('profileMeta');
    if (metaEl) metaEl.textContent = studentId + ' • ' + batchName;

    var infoEl = document.getElementById('infoList');
    if (infoEl) {
      infoEl.innerHTML =
        '<h3 class="section-title">ব্যক্তিগত তথ্য</h3><dl class="kv">' +
        kv('পুরো নাম', name) + kv('ইমেইল', profile.email) +
        kv('মোবাইল', profile.mobile || profile.phone) +
        kv('জন্ম তারিখ', profile.dob ? SEMSStudent.fmtDate(profile.dob) : '') +
        kv('লিঙ্গ', GENDER_BN[profile.gender] || profile.gender) +
        kv('রক্তের গ্রুপ', profile.bloodGroup) + '</dl>' +
        '<h3 class="section-title">অভিভাবক ও জরুরি যোগাযোগ</h3><dl class="kv">' +
        kv('অভিভাবকের নাম', profile.guardianName) +
        kv('অভিভাবকের মোবাইল', profile.guardianPhone) +
        kv('জরুরি যোগাযোগ', profile.emergencyName) +
        kv('জরুরি মোবাইল', profile.emergencyPhone) + '</dl>' +
        '<h3 class="section-title">শিক্ষাগত ও ভর্তি তথ্য</h3><dl class="kv">' +
        kv('কলেজের নাম', profile.collegeName) +
        kv('পূর্ববর্তী শিক্ষা', EDU_BN[profile.previousEducation] || profile.previousEducation) +
        kv('কোর্স / ব্যাচ', batchName) +
        kv('ঠিকানা', profile.address) +
        kv('ভর্তির অবস্থা', profile.status || 'pending') + '</dl>';
    }

    document.getElementById('editName').value = name;
    document.getElementById('editPhone').value = profile.mobile || profile.phone || '';
    document.getElementById('editAddress').value = profile.address || '';

    var form = document.getElementById('editForm');
    if (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        var newName = document.getElementById('editName').value.trim();
        var newPhone = document.getElementById('editPhone').value.trim();
        var newAddress = document.getElementById('editAddress').value.trim();
        var msg = document.getElementById('profileMsg');
        if (!newName) { if (msg) { msg.textContent = 'নাম খালি রাখা যাবে না।'; msg.hidden = false; } return; }
        if (newPhone && !/^01[3-9]\d{8}$/.test(newPhone)) {
          if (msg) { msg.textContent = 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)।'; msg.hidden = false; }
          return;
        }
        try {
          await SEMSStudent.updateProfile(user, { name: newName, phone: newPhone, address: newAddress });
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
