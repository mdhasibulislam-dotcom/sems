/* SEMS — js/admin/students.js | Phase 4
 * সব শিক্ষার্থীর তালিকা — ব্যাচ ফিল্টার + নাম/ইমেইল খোঁজা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('students'); } catch (e) { return; }
  var students = [], batches = [];
  function render() {
    var wrap = document.getElementById('studentList');
    var b = document.getElementById('batchFilter').value;
    var q = (document.getElementById('searchInput').value || '').toLowerCase();
    var list = students.filter(function (s) {
      if (b && s.batchId !== b) return false;
      if (q) {
        var hay = ((s.fullName || s.name || '') + ' ' + (s.email || '') + ' ' + (s.mobile || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    document.getElementById('countText').textContent = 'মোট ' + SEMSAdmin.bnDigits(list.length) + ' জন শিক্ষার্থী';
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('users', 'কোনো শিক্ষার্থী পাওয়া যায়নি', 'শিক্ষার্থী যোগ করুন বা ভর্তি আবেদন অনুমোদন করুন।');
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>নাম</th><th>মোবাইল</th><th>ব্যাচ</th><th>কলেজ</th><th></th></tr></thead><tbody>' +
      list.map(function (s) {
        return '<tr><td><strong>' + SEMSAdmin.esc(s.fullName || s.name || 'শিক্ষার্থী') + '</strong><br><span class="muted">' +
          SEMSAdmin.esc(s.email || '') + '</span></td>' +
          '<td>' + SEMSAdmin.esc(s.mobile || s.phone || '—') + '</td>' +
          '<td>' + SEMSAdmin.esc(SEMSAdmin.batchName(s.batchId, batches)) + '</td>' +
          '<td>' + SEMSAdmin.esc(s.collegeName || '—') + '</td>' +
          '<td><a class="btn btn-sm btn-outline" href="student-details.html?id=' + encodeURIComponent(s.id) + '">বিস্তারিত</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  try {
    students = await SEMSAdmin.getStudents();
    batches = await SEMSAdmin.getBatches();
    var sel = document.getElementById('batchFilter');
    batches.forEach(function (bt) {
      var opt = document.createElement('option');
      opt.value = bt.id;
      opt.textContent = bt.name || bt.id;
      sel.appendChild(opt);
    });
    render();
    sel.addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] শিক্ষার্থী লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('শিক্ষার্থীর তালিকা লোড করা যায়নি।');
  }
});
