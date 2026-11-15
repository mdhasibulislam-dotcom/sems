/* SEMS — js/admin/teachers.js | Phase 4
 * সব শিক্ষকের তালিকা — বিষয় খোঁজা, বিস্তারিত লিংক।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('teachers'); } catch (e) { return; }
  var teachers = [], batches = [];
  function render() {
    var wrap = document.getElementById('teacherList');
    var q = (document.getElementById('searchInput').value || '').toLowerCase();
    var list = teachers.filter(function (t) {
      if (!q) return true;
      var hay = ((t.name || '') + ' ' + (t.email || '') + ' ' + (t.subject || '')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
    document.getElementById('countText').textContent = 'মোট ' + SEMSAdmin.bnDigits(list.length) + ' জন শিক্ষক';
    if (!list.length) {
      wrap.innerHTML = SEMSAdmin.emptyState('graduationCap', 'কোনো শিক্ষক পাওয়া যায়নি', 'শিক্ষক যোগ করুন।');
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>নাম</th><th>বিষয়</th><th>মোবাইল</th><th>ব্যাচ</th><th></th></tr></thead><tbody>' +
      list.map(function (t) {
        var myBatches = batches.filter(function (b) { return b.teacherId === (t.uid || t.id); });
        return '<tr><td><strong>' + SEMSAdmin.esc(t.name || t.displayName || 'শিক্ষক') + '</strong><br><span class="muted">' +
          SEMSAdmin.esc(t.email || '') + '</span></td>' +
          '<td>' + SEMSAdmin.esc(t.subject || '—') + '</td>' +
          '<td>' + SEMSAdmin.esc(t.phone || '—') + '</td>' +
          '<td>' + SEMSAdmin.bnDigits(myBatches.length) + 'টি</td>' +
          '<td><a class="btn btn-sm btn-outline" href="teacher-details.html?id=' + encodeURIComponent(t.uid || t.id) + '">বিস্তারিত</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  try {
    teachers = await SEMSAdmin.getTeachers();
    batches = await SEMSAdmin.getBatches();
    render();
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] শিক্ষক লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('শিক্ষকের তালিকা লোড করা যায়নি।');
  }
});
