/* SEMS — js/teacher/attendance.js | Phase 3
 * উপস্থিতি: ক্লাস + তারিখ বেছে সেই ব্যাচের শিক্ষার্থীদের
 * উপস্থিত/অনুপস্থিত চিহ্নিত করে attendance কালেকশনে সংরক্ষণ।
 * (studentId, classId, batchId, teacherId, date, status)
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('attendance'); } catch (e) { return; }

  var classes = [];
  var currentClass = null;
  var currentStudents = [];
  var marks = {}; // studentId -> 'present' | 'absent'

  var dateInput = document.getElementById('dateInput');
  dateInput.value = SEMSTeacher.todayKey();

  function params() {
    var p = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  }

  function renderStudents() {
    var wrap = document.getElementById('attendanceWrap');
    var saveRow = document.getElementById('saveRow');
    if (!wrap) return;
    if (!currentStudents.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('users', 'এই ব্যাচে কোনো শিক্ষার্থী নেই', 'এই ক্লাসের ব্যাচে শিক্ষার্থী ভর্তি হলে এখানে তালিকা আসবে।');
      if (saveRow) saveRow.hidden = true;
      return;
    }
    wrap.innerHTML = '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>নাম</th><th>মোবাইল</th><th>উপস্থিতি</th></tr></thead><tbody>' +
      currentStudents.map(function (s) {
        var nm = s.fullName || s.name || s.email || 'শিক্ষার্থী';
        var st = marks[s.id] || 'present';
        return '<tr><td><strong>' + SEMSTeacher.esc(nm) + '</strong></td>' +
          '<td>' + SEMSTeacher.esc(s.mobile || s.phone || '—') + '</td>' +
          '<td><div class="att-toggle" data-id="' + SEMSTeacher.esc(s.id) + '">' +
          '<button type="button" data-status="present" class="' + (st === 'present' ? 'on-present' : '') + '">উপস্থিত</button>' +
          '<button type="button" data-status="absent" class="' + (st === 'absent' ? 'on-absent' : '') + '">অনুপস্থিত</button>' +
          '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
    if (saveRow) saveRow.hidden = false;
    wrap.querySelectorAll('.att-toggle').forEach(function (tg) {
      tg.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          marks[tg.getAttribute('data-id')] = btn.getAttribute('data-status');
          renderStudents();
        });
      });
    });
  }

  async function loadStudents() {
    var classId = document.getElementById('classSelect').value;
    var dateStr = dateInput.value;
    var msg = document.getElementById('attMsg');
    if (msg) msg.hidden = true;
    if (!classId) {
      if (window.SEMSToast) SEMSToast.error('প্রথমে একটি ক্লাস বাছুন।');
      return;
    }
    if (!dateStr) {
      if (window.SEMSToast) SEMSToast.error('তারিখ বাছুন।');
      return;
    }
    currentClass = null;
    classes.forEach(function (c) { if (c.id === classId) currentClass = c; });
    if (!currentClass) return;
    try {
      currentStudents = await SEMSTeacher.getStudentsForBatch(currentClass.batchId);
      var prev = await SEMSTeacher.getAttendanceForClass(user.uid, classId, dateStr);
      marks = {};
      currentStudents.forEach(function (s) { marks[s.id] = 'present'; });
      prev.forEach(function (a) { if (marks[a.studentId] !== undefined) marks[a.studentId] = a.status; });
      renderStudents();
    } catch (err) {
      console.warn('[SEMS] উপস্থিতি লোড ব্যর্থ:', err && err.message);
      if (window.SEMSToast) SEMSToast.error('শিক্ষার্থীর তালিকা লোড করা যায়নি।');
    }
  }

  try {
    classes = await SEMSTeacher.getMyClasses(user.uid);
    var sel = document.getElementById('classSelect');
    classes.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = (c.subject || 'ক্লাস') + ' — ' + SEMSTeacher.fmtDate(c.date) +
        (c.startTime ? ' ' + c.startTime : '');
      sel.appendChild(opt);
    });
    var q = params();
    if (q.classId) {
      sel.value = q.classId;
      var d = null;
      classes.forEach(function (c) { if (c.id === q.classId) d = SEMSTeacher.toDate(c.date); });
      if (d) dateInput.value = SEMSTeacher.dateKey(d);
      await loadStudents();
    }
    document.getElementById('loadBtn').addEventListener('click', loadStudents);
    document.getElementById('allPresentBtn').addEventListener('click', function () {
      currentStudents.forEach(function (s) { marks[s.id] = 'present'; });
      renderStudents();
    });
    document.getElementById('saveBtn').addEventListener('click', async function () {
      var dateStr = dateInput.value;
      if (!currentClass || !dateStr || !currentStudents.length) return;
      var list = currentStudents.map(function (s) {
        return { studentId: s.id, status: marks[s.id] || 'present' };
      });
      try {
        await SEMSTeacher.saveAttendance(user, currentClass, dateStr, list);
        var present = list.filter(function (m) { return m.status === 'present'; }).length;
        var msg = document.getElementById('attMsg');
        if (msg) {
          msg.textContent = 'উপস্থিতি সংরক্ষণ হয়েছে — ' + SEMSTeacher.bnDigits(present) + '/' +
            SEMSTeacher.bnDigits(list.length) + ' জন উপস্থিত (' + SEMSTeacher.fmtDate(dateStr) + ')।';
          msg.hidden = false;
        }
        if (window.SEMSToast) SEMSToast.success('উপস্থিতি সংরক্ষণ হয়েছে।');
      } catch (err) {
        console.warn('[SEMS] উপস্থিতি সংরক্ষণ ব্যর্থ:', err && err.message);
        if (window.SEMSToast) SEMSToast.error('উপস্থিতি সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      }
    });
  } catch (err) {
    console.warn('[SEMS] ক্লাস লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ক্লাস লোড করা যায়নি।');
  }
});
