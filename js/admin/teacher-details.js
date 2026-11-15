/* SEMS — js/admin/teacher-details.js | Phase 4
 * একক শিক্ষকের বিস্তারিত (?id=): প্রোফাইল, তার ব্যাচ ও ক্লাস।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('teachers'); } catch (e) { return; }
  function params() {
    var p = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  }

  var q = params();
  var wrap = document.getElementById('detailWrap');
  if (!q.id) {
    wrap.innerHTML = SEMSAdmin.emptyState('graduationCap', 'শিক্ষক বাছা হয়নি', 'শিক্ষকের তালিকা থেকে একজনকে বাছুন।');
    return;
  }
  try {
    var t = await SEMSAdmin.getTeacherById(q.id);
    if (!t) {
      wrap.innerHTML = SEMSAdmin.emptyState('graduationCap', 'শিক্ষক পাওয়া যায়নি', 'আইডিটি সঠিক কিনা দেখুন।');
      return;
    }
    var batches = await SEMSAdmin.getBatches();
    var classes = await SEMSAdmin.getClasses();
    var myBatches = batches.filter(function (b) { return b.teacherId === q.id; });
    var myClasses = classes.filter(function (c) { return c.teacherId === q.id; });
    var students = await SEMSAdmin.getStudents();
    var myStudents = students.filter(function (s) {
      return myBatches.some(function (b) { return b.id === s.batchId; });
    });
    var initials = (t.name || t.displayName || '?').trim().charAt(0);
    var html = '<div class="profile-top"><div class="profile-photo">' + SEMSAdmin.esc(initials) + '</div>' +
      '<div><h2>' + SEMSAdmin.esc(t.name || t.displayName || 'শিক্ষক') + '</h2>' +
      '<p class="muted">' + SEMSAdmin.esc(t.email || '') + '</p></div></div>' +
      '<h3 class="section-title">তথ্য</h3><dl class="kv">' +
      '<dt>বিষয়</dt><dd>' + SEMSAdmin.esc(t.subject || '—') + '</dd>' +
      '<dt>মোবাইল</dt><dd>' + SEMSAdmin.esc(t.phone || '—') + '</dd>' +
      '<dt>ব্যাচ</dt><dd>' + SEMSAdmin.bnDigits(myBatches.length) + 'টি</dd>' +
      '<dt>শিক্ষার্থী</dt><dd>' + SEMSAdmin.bnDigits(myStudents.length) + ' জন</dd>' +
      '<dt>মোট ক্লাস</dt><dd>' + SEMSAdmin.bnDigits(myClasses.length) + 'টি</dd>' +
      '</dl>' +
      '<h3 class="section-title">তার ব্যাচ</h3>';
    if (!myBatches.length) {
      html += '<p class="muted">এই শিক্ষকের কোনো ব্যাচ দেওয়া হয়নি — ব্যাচ পেজ থেকে ব্যাচে শিক্ষক বসান।</p>';
    } else {
      html += '<div class="table-wrap"><table class="data"><thead><tr><th>ব্যাচ</th><th>বিষয়</th><th>শিক্ষার্থী</th></tr></thead><tbody>' +
        myBatches.map(function (b) {
          var n = students.filter(function (s) { return s.batchId === b.id; }).length;
          return '<tr><td>' + SEMSAdmin.esc(b.name || '') + '</td><td>' + SEMSAdmin.esc(b.subject || '') +
            '</td><td>' + SEMSAdmin.bnDigits(n) + ' জন</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    html += '<h3 class="section-title">সাম্প্রতিক ক্লাস</h3>';
    if (!myClasses.length) {
      html += '<p class="muted">এই শিক্ষকের কোনো ক্লাস নেই।</p>';
    } else {
      html += myClasses.slice(0, 5).map(function (c) {
        return '<div class="list-item"><h3>' + SEMSAdmin.esc(c.subject || 'ক্লাস') +
          (c.chapter ? ' — ' + SEMSAdmin.esc(c.chapter) : '') + '</h3>' +
          '<div class="list-meta"><span>' + SEMSAdmin.esc(SEMSAdmin.batchName(c.batchId, batches)) + '</span>' +
          '<span>' + SEMSAdmin.esc(SEMSAdmin.fmtDate(c.date)) + '</span></div></div>';
      }).join('');
    }
    wrap.innerHTML = html;
  } catch (err) {
    console.warn('[SEMS] বিস্তারিত লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('বিস্তারিত লোড করা যায়নি।');
  }
});
