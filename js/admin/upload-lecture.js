/* SEMS — js/admin/upload-lecture.js | Phase 4
 * লেকচার আপলোড (প্রকাশ): শিরোনাম, বিষয়, অধ্যায়, ব্যাচ, শিক্ষক,
 * প্রকাশের তারিখ, বিবরণ, PDF/স্লাইড/রেকর্ডিং লিংক। ফাইল আপলোডে
 * Storage-এর Blaze প্ল্যান লাগে বলে আপাতত লিংক নেওয়া হয়।
 */
document.addEventListener('DOMContentLoaded', async function () {
  var user;
  try { user = await SEMSAdmin.init('lectures'); } catch (e) { return; }
  var batches = [], teachers = [];
  function fillSelect(id, list, withSubject) {
    var sel = document.getElementById(id);
    list.forEach(function (it) {
      var opt = document.createElement('option');
      opt.value = it.id;
      opt.textContent = (it.name || it.displayName || it.id) + (withSubject && it.subject ? ' — ' + it.subject : '');
      sel.appendChild(opt);
    });
  }
  try {
    batches = await SEMSAdmin.getBatches();
    teachers = await SEMSAdmin.getTeachers();
    fillSelect('lecBatch', batches);
    fillSelect('lecTeacher', teachers, true);
  } catch (err) { console.warn('[SEMS] ব্যাচ/শিক্ষক লোড ব্যর্থ:', err && err.message); }
  document.getElementById('lectureForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var errBox = document.getElementById('errorBox');
    var okBox = document.getElementById('successBox');
    errBox.hidden = true; okBox.hidden = true;
    var data = {
      title: document.getElementById('lecTitle').value.trim(),
      subject: document.getElementById('lecSubject').value.trim(),
      chapter: document.getElementById('lecChapter').value.trim(),
      batchId: document.getElementById('lecBatch').value,
      teacherId: document.getElementById('lecTeacher').value,
      publishDate: document.getElementById('lecDate').value,
      date: document.getElementById('lecDate').value,
      description: document.getElementById('lecDesc').value.trim(),
      pdfUrl: document.getElementById('lecPdf').value.trim(),
      slidesUrl: document.getElementById('lecSlides').value.trim(),
      recordingUrl: document.getElementById('lecVideo').value.trim()
    };
    if (!data.title || !data.subject || !data.batchId || !data.publishDate) {
      errBox.textContent = 'শিরোনাম, বিষয়, ব্যাচ ও প্রকাশের তারিখ পূরণ করুন।';
      errBox.hidden = false;
      return;
    }
    SEMSLoader.show();
    try {
      await SEMSAdmin.addLecture(user, data);
      SEMSLoader.hide();
      okBox.textContent = 'লেকচার প্রকাশ হয়েছে — শিক্ষার্থীরা এখন দেখতে পারবে।';
      okBox.hidden = false;
      if (window.SEMSToast) SEMSToast.success('লেকচার প্রকাশ হয়েছে।');
      e.target.reset();
    } catch (err) {
      SEMSLoader.hide();
      errBox.textContent = err && err.message ? err.message : 'লেকচার প্রকাশ করা যায়নি। আবার চেষ্টা করুন।';
      errBox.hidden = false;
    }
  });
});
