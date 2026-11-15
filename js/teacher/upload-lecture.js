/* SEMS — js/teacher/upload-lecture.js | Phase 3
 * লেকচার আপলোড ফরম: lectures ডকে published=true, teacherId=uid
 * সহ লেখা হয়। ফাইল সরাসরি আপলোড করা হয় না — PDF/স্লাইড/
 * রেকর্ডিংয়ের লিংক নেওয়া হয় (Firebase Storage-এ ফাইল আপলোড
 * করতে Blaze প্ল্যান লাগে, দেখুন common.js-এর addLecture)।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSTeacher.init('upload-lecture'); } catch (e) { return; }

  try {
    var batches = await SEMSTeacher.getMyBatches(user.uid);
    var sel = document.getElementById('lecBatch');
    batches.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.name || b.title || SEMSTeacher.batchLabel(b.id);
      sel.appendChild(opt);
    });
    document.getElementById('lecDate').value = SEMSTeacher.todayKey();

    var form = document.getElementById('lectureForm');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var title = document.getElementById('lecTitle').value.trim();
      var subject = document.getElementById('lecSubject').value.trim();
      var chapter = document.getElementById('lecChapter').value.trim();
      var batchId = document.getElementById('lecBatch').value;
      var dateVal = document.getElementById('lecDate').value;
      var desc = document.getElementById('lecDesc').value.trim();
      var pdfUrl = document.getElementById('lecPdf').value.trim();
      var slidesUrl = document.getElementById('lecSlides').value.trim();
      var recordingUrl = document.getElementById('lecRecording').value.trim();
      var msg = document.getElementById('uploadMsg');

      if (!title || !subject || !batchId || !dateVal) {
        if (window.SEMSToast) SEMSToast.error('শিরোনাম, বিষয়, ব্যাচ ও প্রকাশের তারিখ — সবগুলো দিন।');
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        await SEMSTeacher.addLecture(user, {
          title: title, subject: subject, chapter: chapter,
          batchId: batchId, date: dateVal + 'T10:00:00', publishDate: dateVal + 'T10:00:00',
          description: desc, pdfUrl: pdfUrl, slidesUrl: slidesUrl, recordingUrl: recordingUrl
        });
        // নোটিফিকেশন: ব্যাচের শিক্ষার্থীদের জানানো (fire-and-forget)
        if (window.SEMSNotifications) {
          SEMSNotifications.sendToBatch(batchId, {
            title: 'নতুন লেকচার: ' + title,
            body: subject + (chapter ? ' — ' + chapter : ''),
            type: 'lecture', link: 'lectures.html'
          }).catch(function (e) { console.warn('[SEMS] লেকচার নোটিফিকেশন ব্যর্থ:', e && e.message); });
        }
        if (msg) { msg.textContent = 'লেকচার প্রকাশ হয়েছে। শিক্ষার্থীরা এখন দেখতে পাবে।'; msg.hidden = false; }
        if (window.SEMSToast) SEMSToast.success('লেকচার প্রকাশ হয়েছে।');
        form.reset();
        document.getElementById('lecDate').value = SEMSTeacher.todayKey();
      } catch (err) {
        console.warn('[SEMS] লেকচার প্রকাশ ব্যর্থ:', err && err.message);
        if (window.SEMSToast) SEMSToast.error('লেকচার প্রকাশ করা যায়নি। আবার চেষ্টা করুন।');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  } catch (err) {
    console.warn('[SEMS] ব্যাচ লোড ব্যর্থ:', err && err.message);
    if (window.SEMSToast) SEMSToast.error('ব্যাচের তালিকা লোড করা যায়নি।');
  }
});
