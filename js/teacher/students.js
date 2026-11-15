/* SEMS — js/teacher/students.js | Phase 3
 * নিজের ব্যাচের শিক্ষার্থীরা: students where batchId ∈ নিজের ব্যাচ।
 * ব্যাচ ফিল্টার + নাম/ইমেইল খোঁজা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('students'); } catch (e) { return; }

  var allStudents = [];
  var batches = [];

  function batchName(id) {
    for (var i = 0; i < batches.length; i++) {
      if (batches[i].id === id) return batches[i].name || batches[i].title || SEMSTeacher.batchLabel(id);
    }
    return id ? SEMSTeacher.batchLabel(id) : '';
  }

  function render() {
    var wrap = document.getElementById('studentsWrap');
    if (!wrap) return;
    var bf = document.getElementById('batchFilter').value;
    var q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    var list = allStudents.filter(function (s) {
      if (bf && s.batchId !== bf) return false;
      if (q) {
        var hay = ((s.fullName || s.name || '') + ' ' + (s.email || '')).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    var totalEl = document.getElementById('statTotal');
    if (totalEl) totalEl.textContent = SEMSTeacher.bnDigits(list.length);
    if (!list.length) {
      wrap.innerHTML = allStudents.length
        ? SEMSTeacher.emptyState('search', 'খুঁজে কিছু পাওয়া যায়নি', 'অন্য ব্যাচ বা অন্য নাম দিয়ে চেষ্টা করুন।')
        : SEMSTeacher.emptyState('users', 'আপনার ব্যাচে এখনো কোনো শিক্ষার্থী নেই', 'শিক্ষার্থী ভর্তি হলে এখানে তাদের তালিকা দেখা যাবে।');
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>নাম</th><th>ব্যাচ</th><th>মোবাইল</th><th>ইমেইল</th></tr></thead><tbody>' +
      list.map(function (s) {
        var nm = s.fullName || s.name || s.email || 'শিক্ষার্থী';
        return '<tr><td><strong>' + SEMSTeacher.esc(nm) + '</strong></td>' +
          '<td>' + SEMSTeacher.esc(batchName(s.batchId)) + '</td>' +
          '<td>' + SEMSTeacher.esc(s.mobile || s.phone || '—') + '</td>' +
          '<td>' + SEMSTeacher.esc(s.email || '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  try {
    batches = await SEMSTeacher.getMyBatches(user.uid);
    var sel = document.getElementById('batchFilter');
    batches.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || b.title || SEMSTeacher.batchLabel(b.id);
      sel.appendChild(opt);
    });
    var bEl = document.getElementById('statBatches');
    if (bEl) bEl.textContent = SEMSTeacher.bnDigits(batches.length);
    allStudents = await SEMSTeacher.getMyStudents(user.uid);
    render();
    sel.addEventListener('change', render);
    document.getElementById('searchInput').addEventListener('input', render);
  } catch (err) {
    console.warn('[SEMS] শিক্ষার্থী লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('শিক্ষার্থীর তালিকা লোড করা যায়নি।');
  }
});
