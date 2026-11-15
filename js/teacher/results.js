/* SEMS — js/teacher/results.js | Phase 3
 * নম্বর দেওয়া: পরীক্ষা বেছে সেই ব্যাচের প্রত্যেক শিক্ষার্থীর
 * নম্বর লিখে results কালেকশনে সংরক্ষণ
 * (examId, studentId, teacherId, marks, totalMarks, grade)।
 * আগে দেওয়া নম্বরও নিচে দেখা যায়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('results'); } catch (e) { return; }

  var exams = [];
  var currentExam = null;
  var currentStudents = [];
  var savedForExam = [];

  function params() {
    var p = {};
    (window.location.search || '').replace(/^\?/, '').split('&').forEach(function (kv) {
      var parts = kv.split('=');
      if (parts[0]) p[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
    });
    return p;
  }

  function studentName(s) { return s.fullName || s.name || s.email || 'শিক্ষার্থী'; }

  function savedMark(studentId) {
    for (var i = 0; i < savedForExam.length; i++) {
      if (savedForExam[i].studentId === studentId) return savedForExam[i];
    }
    return null;
  }

  function renderForm() {
    var wrap = document.getElementById('resultsWrap');
    var saveRow = document.getElementById('saveRow');
    if (!wrap) return;
    if (!currentExam) {
      wrap.innerHTML = '<p class="muted">পরীক্ষা বাছুন — সেই ব্যাচের শিক্ষার্থীদের নম্বর দেওয়ার ফরম আসবে।</p>';
      if (saveRow) saveRow.hidden = true;
      return;
    }
    if (!currentStudents.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('users', 'এই পরীক্ষার ব্যাচে কোনো শিক্ষার্থী নেই', 'এই ব্যাচে শিক্ষার্থী ভর্তি হলে এখানে নম্বর দেওয়ার ফরম আসবে।');
      if (saveRow) saveRow.hidden = true;
      return;
    }
    var total = Number(currentExam.totalMarks) || 0;
    wrap.innerHTML = '<p class="muted">পরীক্ষা: <strong>' + SEMSTeacher.esc(currentExam.title || '') + '</strong> — মোট নম্বর: ' +
      SEMSTeacher.bnDigits(total) + '</p>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
      '<th>নাম</th><th>নম্বর (/' + SEMSTeacher.bnDigits(total) + ')</th><th>গ্রেড</th></tr></thead><tbody>' +
      currentStudents.map(function (s) {
        var sv = savedMark(s.id);
        return '<tr><td><strong>' + SEMSTeacher.esc(studentName(s)) + '</strong></td>' +
          '<td><input type="number" class="marks-input" data-id="' + SEMSTeacher.esc(s.id) + '" min="0" max="' + total + '" step="0.5" value="' + (sv ? sv.marks : '') + '" placeholder="—" aria-label="' + SEMSTeacher.esc(studentName(s)) + ' এর নম্বর"></td>' +
          '<td class="grade-cell" data-id="' + SEMSTeacher.esc(s.id) + '">' + (sv ? SEMSTeacher.esc(sv.grade || '') : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    if (saveRow) saveRow.hidden = false;
    wrap.querySelectorAll('.marks-input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var v = parseFloat(inp.value);
        var cell = wrap.querySelector('.grade-cell[data-id="' + inp.getAttribute('data-id') + '"]');
        if (cell) cell.textContent = (isNaN(v) ? '—' : SEMSTeacher.gradeFromMarks(v, total));
      });
    });
  }

  async function renderSaved() {
    var wrap = document.getElementById('savedWrap');
    if (!wrap) return;
    var all = await SEMSTeacher.getResults(user.uid);
    if (!all.length) {
      wrap.innerHTML = SEMSTeacher.emptyState('trophy', 'এখনো কোনো নম্বর দেওয়া হয়নি', 'উপরের ফরম থেকে পরীক্ষা বেছে নম্বর দিন।');
      return;
    }
    // পরীক্ষা অনুযায়ী গ্রুপ
    var byExam = {};
    all.forEach(function (r) {
      if (!byExam[r.examId]) byExam[r.examId] = [];
      byExam[r.examId].push(r);
    });
    var examName = {};
    exams.forEach(function (e) { examName[e.id] = e.title || ''; });
    wrap.innerHTML = Object.keys(byExam).map(function (examId) {
      var list = byExam[examId];
      return '<div class="day-block"><h3>' + SEMSTeacher.esc(examName[examId] || list[0].examTitle || 'পরীক্ষা') + '</h3>' +
        '<div class="table-wrap"><table class="data"><thead><tr><th>শিক্ষার্থী</th><th>নম্বর</th><th>গ্রেড</th></tr></thead><tbody>' +
        list.map(function (r) {
          var s = null;
          currentStudents.forEach(function (cs) { if (cs.id === r.studentId) s = cs; });
          var nm = s ? studentName(s) : r.studentId;
          return '<tr><td>' + SEMSTeacher.esc(nm) + '</td><td>' +
            SEMSTeacher.bnDigits(r.marks) + ' / ' + SEMSTeacher.bnDigits(r.totalMarks) + '</td><td>' +
            SEMSTeacher.esc(r.grade || '') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }).join('');
  }

  async function loadExam(examId) {
    currentExam = null;
    exams.forEach(function (e) { if (e.id === examId) currentExam = e; });
    if (!currentExam) { renderForm(); return; }
    try {
      currentStudents = await SEMSTeacher.getStudentsForBatch(currentExam.batchId);
      savedForExam = await SEMSTeacher.getResultsForExam(user.uid, examId);
      renderForm();
    } catch (err) {
      console.warn('[SEMS] নম্বরের ফরম লোড ব্যর্থ:', err && err.message);
      if (window.SEMSToast) SEMSToast.error('শিক্ষার্থীর তালিকা লোড করা যায়নি।');
    }
  }

  try {
    exams = await SEMSTeacher.getExams(user.uid);
    var sel = document.getElementById('examSelect');
    exams.forEach(function (e) {
      var opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = (e.title || 'পরীক্ষা') + ' — ' + SEMSTeacher.fmtDate(e.date);
      sel.appendChild(opt);
    });
    await renderSaved();
    sel.addEventListener('change', function () { loadExam(sel.value); });
    var q = params();
    if (q.examId) { sel.value = q.examId; await loadExam(q.examId); }

    document.getElementById('saveBtn').addEventListener('click', async function () {
      if (!currentExam) return;
      var total = Number(currentExam.totalMarks) || 0;
      var inputs = document.querySelectorAll('#resultsWrap .marks-input');
      var entries = [];
      var bad = false;
      inputs.forEach(function (inp) {
        var raw = inp.value.trim();
        if (raw === '') return;
        var v = parseFloat(raw);
        if (isNaN(v) || v < 0 || v > total) bad = true;
        else entries.push({ studentId: inp.getAttribute('data-id'), marks: v });
      });
      if (bad) {
        if (window.SEMSToast) SEMSToast.error('নম্বর ০ থেকে ' + total + '-এর মধ্যে হতে হবে।');
        return;
      }
      if (!entries.length) {
        if (window.SEMSToast) SEMSToast.error('অন্তত একজন শিক্ষার্থীর নম্বর দিন।');
        return;
      }
      try {
        for (var i = 0; i < entries.length; i++) {
          await SEMSTeacher.saveResult(user, currentExam, entries[i].studentId, entries[i].marks);
        }
        var msg = document.getElementById('resMsg');
        if (msg) {
          msg.textContent = SEMSTeacher.bnDigits(entries.length) + ' জন শিক্ষার্থীর নম্বর সংরক্ষণ হয়েছে।';
          msg.hidden = false;
        }
        if (window.SEMSToast) SEMSToast.success('নম্বর সংরক্ষণ হয়েছে।');
        savedForExam = await SEMSTeacher.getResultsForExam(user.uid, currentExam.id);
        renderForm();
        await renderSaved();
      } catch (err) {
        console.warn('[SEMS] নম্বর সংরক্ষণ ব্যর্থ:', err && err.message);
        if (window.SEMSToast) SEMSToast.error('নম্বর সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      }
    });
  } catch (err) {
    console.warn('[SEMS] পরীক্ষা লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('পরীক্ষার তালিকা লোড করা যায়নি।');
  }
});
