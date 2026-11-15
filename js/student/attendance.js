/* SEMS — js/student/attendance.js | Phase 2
 * নিজের উপস্থিতির ইতিহাস: attendance কালেকশন (studentId == uid)।
 * উপস্থিত/অনুপস্থিত %, মাস অনুযায়ী দেখা।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSStudent.init('attendance'); } catch (e) { return; }

  var allRecords = [];

  function render(list) {
    var total = list.length;
    var present = list.filter(function (a) { return a.status === 'present'; }).length;
    var pct = total ? Math.round((present / total) * 100) : 0;
    var sumEl = document.getElementById('attSummary');
    if (sumEl) {
      sumEl.innerHTML = total
        ? '<div class="stat-grid">' +
          '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(pct) + '%</div><div class="lbl">উপস্থিতির হার</div></div>' +
          '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(present) + '</div><div class="lbl">উপস্থিত</div></div>' +
          '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(total - present) + '</div><div class="lbl">অনুপস্থিত</div></div>' +
          '<div class="stat-card"><div class="num">' + SEMSStudent.bnDigits(total) + '</div><div class="lbl">মোট ক্লাস</div></div>' +
          '</div>'
        : '';
    }
    var wrap = document.getElementById('attendanceWrap');
    if (!wrap) return;
    if (!total) {
      wrap.innerHTML = SEMSStudent.emptyState('checkCircle', 'উপস্থিতির কোনো রেকর্ড নেই',
        'শিক্ষক উপস্থিতি নিলে এখানে আপনার উপস্থিতির ইতিহাস দেখা যাবে।');
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr><th>তারিখ</th><th>বিষয়</th><th>অবস্থা</th></tr></thead><tbody>' +
      list.map(function (a) {
        var isPresent = a.status === 'present';
        return '<tr><td>' + SEMSStudent.fmtDate(a.date) + '</td><td>' + SEMSStudent.esc(a.subject || '—') + '</td>' +
          '<td><span class="badge ' + (isPresent ? 'badge-present' : 'badge-absent') + '">' + (isPresent ? 'উপস্থিত' : 'অনুপস্থিত') + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  try {
    allRecords = await SEMSStudent.getAttendance(user.uid);
    var months = [];
    allRecords.forEach(function (a) {
      var d = SEMSStudent.toDate(a.date);
      if (!d) return;
      var key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
      if (months.indexOf(key) === -1) months.push(key);
    });
    var sel = document.getElementById('monthFilter');
    var monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    months.forEach(function (key) {
      var parts = key.split('-');
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = monthNames[parseInt(parts[1], 10) - 1] + ' ' + SEMSStudent.bnDigits(parts[0]);
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      var v = sel.value;
      render(v ? allRecords.filter(function (a) {
        var d = SEMSStudent.toDate(a.date);
        return d && (d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2)) === v;
      }) : allRecords);
    });
    render(allRecords);
  } catch (err) {
    console.warn('[SEMS] উপস্থিতি লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('উপস্থিতি লোড করা যায়নি।');
  }
});
