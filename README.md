# SEMS — Sinha Education Management System

কোচিং/শিক্ষা প্রতিষ্ঠান পরিচালনার প্ল্যাটফর্ম — শিক্ষার্থী, শিক্ষক ও অ্যাডমিন প্যানেল।
টেক: HTML, CSS, Vanilla JavaScript, Firebase (Auth, Firestore, Storage, Cloud Messaging, Hosting)।

> **বর্তমান অবস্থা: Phase 4 সম্পূর্ণ।** Phase 5 এখনো বানানো হয়নি।

---

## Phase 1 — যা আছে

- **ল্যান্ডিং পেজ** (`index.html`) — লগইন না করা থাকলে লগইন পেজে, লগইন করা থাকলে রোল অনুযায়ী ড্যাশবোর্ডে পাঠায়।
- **লগইন** (`login.html`) — ইমেইল/ইউজারনেম + পাসওয়ার্ড, Continue with Google, Forgot Password ও Registration লিংক। লগইনের পর রোল চেক:
  - Admin → `admin/dashboard.html`
  - Teacher → `teacher/dashboard.html`
  - Student → ভর্তি ফরম শেষ না হলে `admission.html`, শেষ হলে `student/dashboard.html`
- **রেজিস্ট্রেশন** (`register.html`) — নাম, ইমেইল, ইউজারনেম, ফোন, পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর, কনফার্ম), রোল Student/Teacher। **অ্যাডমিন নিজে রেজিস্টার করতে পারে না** — অ্যাডমিন অ্যাকাউন্ট শুধু অ্যাডমিন তৈরি করেন। Google সাইন আপও আছে।
- **ভর্তি ফরম** (`admission.html`) — পুরো নাম, ছবি আপলোড (প্রিভিউসহ), জন্ম তারিখ, লিঙ্গ, রক্তের গ্রুপ, মোবাইল, অভিভাবকের নাম/ফোন, কলেজের নাম, ঠিকানা, কোর্স/ব্যাচ নির্বাচন, পূর্ববর্তী শিক্ষা, জরুরি যোগাযোগ। শিক্ষার্থীর ড্যাশবোর্ডে ঢোকার আগে ফরম পূরণ বাধ্যতামূলক। Firestore-এর `admissions` ও `students` কালেকশনে সংরক্ষিত হয়।
- **পাসওয়ার্ড রিসেট** (`forgot-password.html`) — ইমেইলে `sendPasswordResetEmail`।
- **প্লেসহোল্ডার ড্যাশবোর্ড** — `admin/dashboard.html` (Phase 4)। প্রতিটিতে লগআউট বাটন আছে, auth-guard ও role-guard দিয়ে সুরক্ষিত।
- **Firebase Rules** — `firebase/firestore.rules` (রোল-ভিত্তিক), `firebase/storage.rules`, `firebase/firestore.indexes.json`।

## Phase 2 — Student Dashboard ও প্রোফাইল (সম্পূর্ণ)

শিক্ষার্থীর সব পেজ বাংলায়, মোবাইল রেসপন্সিভ, সাইডবার নেভিগেশন ও লগআউটসহ। প্রতিটি পেজ `SEMSRoleGuard.requireRole('student')` দিয়ে সুরক্ষিত — লগইন না থাকলে `../login.html`, ভুল রোলে নিজের ড্যাশবোর্ড, ভর্তি ফরম শেষ না হলে `../admission.html`। গার্ড শেষ হলেই `SEMSLoader.hide()` কল হয়, তাই "লোড হচ্ছে..." আটকে থাকে না। Firebase চালু থাকলে (`SEMS.firebaseReady`) Firestore থেকে পড়ে; ডেমো মোডে (`SEMS.isDemo`) localStorage-এর `sems_demo_*` নমুনা ডেটা দেখায় — সব নমুনা "ডেমো তথ্য" লেবেলসহ।

| পেজ | যা দেখায় | Firestore থেকে যা পড়ে |
|---|---|---|
| `student/dashboard.html` | স্বাগতম, প্রোফাইল সংক্ষেপ, শিক্ষার্থী আইডি, কোর্স/ব্যাচ, আজকের ক্লাস, আসন্ন ক্লাস, সর্বশেষ নোটিশ, সাম্প্রতিক লেকচার, উপস্থিতির হার | `users`, `admissions`, `batches`, `classes`, `notices`, `lectures`, `attendance` |
| `student/profile.html` | ছবি, নাম, মোবাইল, কলেজ, রক্তের গ্রুপ, অভিভাবক, ঠিকানা, ভর্তি তথ্য; শুধু নাম/ফোন/ঠিকানা সম্পাদনা যায় | `users`, `admissions` (পড়া + আপডেট) |
| `student/routine.html` | সাপ্তাহিক রুটিন — তারিখ, সময়, বিষয়, শিক্ষক, অবস্থা (আসন্ন/চলমান/সম্পন্ন), অনলাইন ক্লাস লিংক | `classes` (নিজের `batchId` অনুযায়ী), `batches` |
| `student/lectures.html` | তারিখ অনুযায়ী লেকচার, অধ্যায়ভিত্তিক, বিষয় ফিল্টার + খোঁজা, PDF/স্লাইড/রেকর্ডিং | `lectures` (`published == true` শুধু) |
| `student/lecture-details.html` | একক লেকচারের বিস্তারিত (`?id=`) ও ডাউনলোড লিংক | `lectures/{id}` |
| `student/notices.html` | নোটিশ বোর্ড — পরীক্ষার তারিখ, ক্লাসের সময় পরিবর্তন, ছুটি, জরুরি ঘোষণা; বিভাগ ফিল্টার | `notices` |
| `student/attendance.html` | নিজের উপস্থিতির ইতিহাস, উপস্থিত/অনুপস্থিত %, মাসভিত্তিক দেখা | `attendance` (`studentId == uid`) |
| `student/assignments.html` | অ্যাসাইনমেন্ট তালিকা, শেষ তারিখ, জমার অবস্থা; লেখা উত্তর / ফাইল লিংক জমা | `assignments`, জমা `submissions`-এ লেখার চেষ্টা (না পারলে এই ব্রাউজারে সংরক্ষণ) |
| `student/exams.html` | আসন্ন/গত পরীক্ষা, সময়কাল, মোট নম্বর; পরীক্ষার তথ্য থাকলে "পরীক্ষা শুরু" (ইঞ্জিন Phase 5-এ) | `exams` |
| `student/results.html` | পরীক্ষার নম্বর, গ্রেড (না থাকলে হিসাব করে), গড় নম্বর ও অগ্রগতি | `results` (`studentId == uid`) |
| `student/notifications.html` | নোটিফিকেশন কেন্দ্র — নিজের নোটিফিকেশন (অপঠিত আগে), ক্লিক করলে পড়া চিহ্ন হয়ে সংশ্লিষ্ট পেজে যায়, "সব পড়া হয়েছে" বোতাম | `notifications` (নিজের `userId`) |

সহায়ক ফাইল: `css/student.css` (global.css-এর ব্র্যান্ড রঙ), `js/student/common.js` (গার্ড, নেভবার/সাইডবার, Firestore পড়া, ডেমো ফলব্যাক, তারিখ/স্ট্যাটাস হিসাব) ও প্রতি পেজের আলাদা JS (`js/student/dashboard.js`, `profile.js`, `routine.js`, `lectures.js`, `lecture-details.js`, `notices.js`, `attendance.js`, `assignments.js`, `exams.js`, `results.js`, `notifications.js`)।

## Phase 3 — Teacher Panel (সম্পূর্ণ)

শিক্ষকের সব পেজ বাংলায়, মোবাইল রেসপন্সিভ, সাইডবার নেভিগেশনসহ। প্রতিটি পেজ `SEMSRoleGuard.requireRole('teacher')` দিয়ে সুরক্ষিত — লগইন না থাকলে `../login.html`, ভুল রোলে নিজের ড্যাশবোর্ড। গার্ড শেষ হলেই `SEMSLoader.hide()` কল হয়, তাই "লোড হচ্ছে..." আটকে থাকে না। Firebase চালু থাকলে (`SEMS.firebaseReady`) Firestore থেকে পড়ে/লেখে; ডেমো মোডে (`SEMS.isDemo`) localStorage-এর `sems_demo_*` নমুনা ডেটা দেখায় — সব নমুনা "ডেমো তথ্য" লেবেলসহ।

**শিক্ষকের সুযোগ শুধু নিজের ব্যাচ/ক্লাস:** সব পড়া/লেখায় `teacherId == uid` অথবা `batchId ∈` নিজের ব্যাচ (`batches where teacherId == uid`) — অন্য শিক্ষকের ডেটা কখনো দেখানো বা লেখা হয় না।

| পেজ | যা করে | Firestore |
|---|---|---|
| `teacher/dashboard.html` | স্বাগতম, নিজের ব্যাচ/শিক্ষার্থী/আজকের ক্লাস/জমা বাকি অ্যাসাইনমেন্টের সংখ্যা, আজকের ক্লাস, নিজের ব্যাচ, সর্বশেষ নোটিশ, সাম্প্রতিক লেকচার, জমা বাকি কাজ | `users`, `batches`, `classes`, `notices`, `lectures`, `assignments`, `exams`, `students` |
| `teacher/profile.html` | নিজের প্রোফাইল (নাম, ইমেইল, মোবাইল, শিক্ষক আইডি, নিজের ব্যাচ); শুধু নাম/ফোন সম্পাদনা যায় | `users` (পড়া + আপডেট), `batches` |
| `teacher/my-classes.html` | নিজের ক্লাসের তালিকা — ব্যাচ ফিল্টার + বিষয়/অধ্যায় খোঁজা, উপস্থিতি নেওয়ার লিংক | `classes` (`teacherId == uid`), `batches` |
| `teacher/routine.html` | নিজের ক্লাসের সাপ্তাহিক রুটিন — তারিখ অনুযায়ী গ্রুপ, "আজ" ট্যাগ, অবস্থা (আসন্ন/চলমান/সম্পন্ন) | `classes` (`teacherId == uid`), `batches` |
| `teacher/students.html` | নিজের ব্যাচের শিক্ষার্থীদের তালিকা — ব্যাচ ফিল্টার + নাম/ইমেইল খোঁজা | `students` (`batchId ∈ নিজের ব্যাচ`), `batches` |
| `teacher/attendance.html` | ক্লাস + তারিখ বেছে সেই ব্যাচের শিক্ষার্থীদের উপস্থিত/অনুপস্থিত চিহ্নিত করে সংরক্ষণ (আগের নেওয়া উপস্থিতি থাকলে তা দেখায়) | `classes`, `students`, `attendance`-এ লেখা (`studentId, classId, batchId, teacherId, date, status`) |
| `teacher/lectures.html` | নিজের লেকচারের তালিকা — বিষয় ফিল্টার + খোঁজা, PDF/স্লাইড/রেকর্ডিং লিংক | `lectures` (`teacherId == uid`) |
| `teacher/upload-lecture.html` | লেকচার প্রকাশের ফরম (শিরোনাম, বিষয়, অধ্যায়, ব্যাচ, প্রকাশের তারিখ, বিবরণ, PDF/স্লাইড/রেকর্ডিং লিংক) | `lectures`-এ লেখা (`published: true`, `teacherId: uid`) |
| `teacher/assignments.html` | অ্যাসাইনমেন্ট তৈরি (শিরোনাম, বিষয়, ব্যাচ, শেষ তারিখ, বিবরণ) + নিজের অ্যাসাইনমেন্টের তালিকা ও জমার সংখ্যা | `assignments`-এ লেখা/পড়া (`teacherId`), জমা `submissions` থেকে গোনা |
| `teacher/exams.html` | পরীক্ষা তৈরি (শিরোনাম, বিষয়, ব্যাচ, তারিখ, শুরুর সময়, সময়কাল, মোট নম্বর) + নিজের পরীক্ষার তালিকা | `exams`-এ লেখা/পড়া (`teacherId`) |
| `teacher/results.html` | পরীক্ষা বেছে সেই ব্যাচের প্রত্যেক শিক্ষার্থীর নম্বর দেওয়া — নম্বর লিখলেই গ্রেড দেখায়, আগে দেওয়া নম্বরও দেখা যায় | `exams`, `students`, `results`-এ লেখা/পড়া (`examId, studentId, teacherId, marks, totalMarks, grade`) |
| `teacher/notifications.html` | নোটিফিকেশন কেন্দ্র — নিজের নোটিফিকেশন (অপঠিত আগে), ক্লিক করলে পড়া চিহ্ন হয়ে সংশ্লিষ্ট পেজে যায়, "সব পড়া হয়েছে" বোতাম | `notifications` (নিজের `userId`) |

সহায়ক ফাইল: `css/teacher.css` (global.css-এর ব্র্যান্ড রঙ, student.css-এর মতো মোবাইল রেসপন্সিভ), `js/teacher/common.js` (গার্ড, নেভবার/সাইডবার, Firestore পড়া/লেখা, ডেমো ফলব্যাক, গ্রেড হিসাব) ও প্রতি পেজের আলাদা JS (`js/teacher/dashboard.js`, `profile.js`, `my-classes.js`, `routine.js`, `students.js`, `attendance.js`, `lectures.js`, `upload-lecture.js`, `assignments.js`, `exams.js`, `results.js`, `notifications.js`)।

**নোট — লেকচার ফাইল আপলোড নয়, লিংক:** Firebase Storage-এ ফাইল আপলোড করতে ৩ ফেব্রুয়ারি ২০২৬ থেকে Blaze (pay-as-you-go) প্ল্যান লাগে — Spark প্ল্যানে Storage বাকেট পাওয়া যায় না। তাই আপাতত PDF/স্লাইড/রেকর্ডিংয়ের লিংক নেওয়া হয় (কোডে মন্তব্যসহ লেখা আছে)।

**নোট — এখনো খালি থাকবে, যতক্ষণ ডেটা না থাকে:** Firestore-এ `batches` কালেকশনে `teacherId == uid` ব্যাচ না থাকলে শিক্ষকের পেজগুলোতে বাংলায় খালি অবস্থা দেখাবে — অ্যাডমিন ব্যাচ দিলে (Phase 4) তবেই ক্লাস/শিক্ষার্থী দেখা যাবে। `classes`, `assignments`, `exams`, `attendance`, `results` কালেকশনের জন্য `firebase/firestore.rules`-এ এখনো আলাদা নিয়ম নেই, তাই Phase 4-এ অ্যাডমিন প্যানেল বানানোর সময় এগুলোর rules যোগ করতে হবে।

⚠️ **এখনো খালি থাকবে, যতক্ষণ অ্যাডমিন/শিক্ষক ডেটা না দেন:** Firestore-এ `classes`, `lectures`, `notices`, `exams`, `assignments`, `attendance`, `results` কালেকশনে কিছু না থাকলে প্রতিটি পেজে বাংলায় খালি অবস্থা ("এখনো কোনো ... দেওয়া হয়নি") দেখাবে — এটাই স্বাভাবিক। `classes` ও `assignments` কালেকশনের জন্য `firebase/firestore.rules`-এ এখনো আলাদা নিয়ম নেই, তাই Phase 4-এ অ্যাডমিন প্যানেল বানানোর সময় এগুলোর rules যোগ করতে হবে।

## ফোল্ডার স্ট্রাকচার (Phase 1 + 2 + 3)

```
sems/
├── index.html                  # ল্যান্ডিং + রিডাইরেক্ট
├── login.html
├── register.html
├── admission.html
├── forgot-password.html
├── firebase.json               # Hosting + Rules ডেপ্লয় কনফিগ
├── README.md
├── css/
│   ├── global.css              # রঙ, বাটন, ফর্ম, কার্ড, ল্যান্ডিং
│   ├── student.css             # Phase 2 — শিক্ষার্থী পেজ (ব্র্যান্ড রঙ, রেসপন্সিভ)
│   ├── teacher.css             # Phase 3 — শিক্ষক পেজ (ব্র্যান্ড রঙ, রেসপন্সিভ)
│   ├── auth.css                # লগইন/রেজিস্ট্রেশন/রিসেট
│   ├── admission.css           # ভর্তি ফরম
│   ├── dashboard.css           # ড্যাশবোর্ড
│   ├── components.css          # Toast, Modal, Navbar, Sidebar
│   └── responsive.css          # মোবাইল রেসপন্সিভ
├── js/
│   ├── firebase/
│   │   ├── config.js           # ⚠️ আসল Firebase config এখানে বসাতে হবে
│   │   ├── auth.js             # লগইন/রেজিস্ট্রেশন/Google/রিসেট/লগআউট, ইউজারনেম লুকআপ
│   │   ├── firestore.js        # ভর্তি ফরম সংরক্ষণ
│   │   ├── storage.js          # ছবি আপলোড
│   │   └── notifications.js    # FCM স্টাব (Phase 5)
│   ├── core/
│   │   ├── app.js
│   │   ├── router.js           # রোল অনুযায়ী ড্যাশবোর্ড পাথ
│   │   ├── auth-guard.js       # লগইন চেক
│   │   ├── role-guard.js       # রোল চেক + ভর্তি ফরম চেক
│   │   └── helpers.js          # বাংলায় এরর বার্তা, তারিখ ফরম্যাট
│   └── components/
│       ├── sidebar.js
│       ├── navbar.js
│       ├── modal.js
│       ├── loader.js
│       └── toast.js
│   └── student/                # Phase 2 — প্রতি পেজের আলাদা JS
│       ├── common.js           # গার্ড, Firestore পড়া, ডেমো ফলব্যাক
│       ├── dashboard.js
│       ├── profile.js
│       ├── routine.js
│       ├── lectures.js
│       ├── lecture-details.js
│       ├── notices.js
│       ├── attendance.js
│       ├── assignments.js
│       ├── exams.js
│       ├── results.js
│       └── notifications.js
│   └── teacher/                # Phase 3 — প্রতি পেজের আলাদা JS
│       ├── common.js           # গার্ড, Firestore পড়া/লেখা, ডেমো ফলব্যাক, গ্রেড হিসাব
│       ├── dashboard.js
│       ├── profile.js
│       ├── my-classes.js
│       ├── routine.js
│       ├── students.js
│       ├── attendance.js
│       ├── lectures.js
│       ├── upload-lecture.js
│       ├── assignments.js
│       ├── exams.js
│       └── results.js
├── student/                    # Phase 2 — সব পেজ সম্পূর্ণ
│   ├── dashboard.html
│   ├── profile.html
│   ├── routine.html
│   ├── lectures.html
│   ├── lecture-details.html
│   ├── notices.html
│   ├── attendance.html
│   ├── assignments.html
│   ├── exams.html
│   ├── results.html
│   └── notifications.html
├── teacher/                    # Phase 3 — সব পেজ সম্পূর্ণ
│   ├── dashboard.html
│   ├── profile.html
│   ├── my-classes.html
│   ├── routine.html
│   ├── students.html
│   ├── attendance.html
│   ├── lectures.html
│   ├── upload-lecture.html
│   ├── assignments.html
│   ├── exams.html
│   └── results.html
├── admin/dashboard.html        # Phase 4 প্লেসহোল্ডার
├── firebase/
│   ├── firestore.rules
│   ├── storage.rules
│   └── firestore.indexes.json
└── assets/                     # (খালি — লোগো/ছবির জন্য)
```

## Firebase সেটআপ (ধাপে ধাপে)

1. **Firebase প্রজেক্ট তৈরি করুন** — https://console.firebase.google.com → Add project।
2. **Authentication চালু করুন** — Build → Authentication → Sign-in method → **Email/Password** ও **Google** Enable করুন।
3. **Firestore তৈরি করুন** — Build → Firestore Database → Create database → Production mode → লোকেশন `asia-south1` (ঢাকার কাছাকাছি)।
4. **Config বসান** — Project Settings → Your apps → Web app (`</>`) তৈরি করে `firebaseConfig` কপি করুন, তারপর `js/firebase/config.js`-এর `YOUR_API_KEY`, `YOUR_PROJECT_ID` ইত্যাদি মানগুলো আসল মান দিয়ে বদলান।
5. **Rules ডেপ্লয় করুন** — Firebase CLI ইনস্টল করে (`npm install -g firebase-tools`, `firebase login`, `firebase init` — বিদ্যমান ফাইল ব্যবহার করুন) `firebase deploy --only firestore:rules,storage` চালান। অথবা Console থেকে rules কপি-পেস্ট করুন।
6. **অ্যাডমিন অ্যাকাউন্ট তৈরি করুন** — প্রথম অ্যাডমিন Console থেকে তৈরি করতে হবে: Authentication-এ ইউজার তৈরি করে Firestore-এ `users/{uid}` ডকুমেন্টে `role: "admin"` বসান। (রেজিস্ট্রেশন পেজ দিয়ে অ্যাডমিন হওয়া যায় না।)
7. **টেস্ট ফ্লো** — `login.html` → নতুন শিক্ষার্থী রেজিস্ট্রেশন → `admission.html` ফরম পূরণ → `student/dashboard.html`।

## ডেমো মোড (Firebase ছাড়াই টেস্ট)

`js/firebase/config.js`-এ এখনো placeholder মান আছে, তাই অ্যাপ **ডেমো মোডে** চলে — ক্র্যাশ করে না, পেজে বাংলায় "Firebase config বসানো হয়নি" নোটিশ দেখায়।

- **ডেমো লগইন:** যেকোনো ইমেইল + ৬+ অক্ষরের পাসওয়ার্ড → ডেমো শিক্ষার্থী হিসেবে লগইন।
- **ডেমো রেজিস্ট্রেশন:** Student/Teacher রেজিস্ট্রেশন এই ব্রাউজারের localStorage-এ সংরক্ষিত হয়।
- **ডেমো ভর্তি ফরম:** localStorage-এ সংরক্ষিত হয়; জমা দিলে ড্যাশবোর্ডে যাওয়া যায়।
- **ডেমোতে যা কাজ করে না:** Google সাইন-ইন, পাসওয়ার্ড রিসেট ইমেইল, আসল ছবি আপলোড (প্রিভিউ দেখা যায়)।
- **ডেমো লগআউট** করলে ডেমো ইউজার ও ভর্তি তথ্য মুছে যায়।

⚠️ ডেমো মোড শুধু UI ফ্লো পরীক্ষার জন্য — আসল ব্যবহারের আগে অবশ্যই Firebase config বসান।

## লোকাল টেস্ট

```bash
cd sems
python3 -m http.server 8000
# ব্রাউজারে: http://localhost:8000/
```

## পরের ধাপ (Phase 4–5, এখনো হয়নি)

- **Phase 4 — Admin Panel:** রুটিন, ব্যাচ, লেকচার/স্লাইড (প্রকাশের তারিখসহ), নোটিশ, পরীক্ষা, সেটিংস। সঙ্গে `classes`, `assignments`, `submissions` কালেকশনের Firestore Rules যোগ করতে হবে।
- **Phase 5 — Exam/Attendance/Notifications:** অনলাইন পরীক্ষার ইঞ্জিন, উপস্থিতি নেওয়া, FCM নোটিফিকেশন।

## Phase 4 — Admin Panel / Routine / Batch (সম্পূর্ণ)

অ্যাডমিনের সব পেজ বাংলায়, মোবাইল রেসপন্সিভ, সাইডবার নেভিগেশনসহ। প্রতিটি পেজ `SEMSRoleGuard.requireRole('admin')` দিয়ে সুরক্ষিত — লগইন না থাকলে `../login.html`, ভুল রোলে নিজের ড্যাশবোর্ড। গার্ড শেষ হলেই `SEMSLoader.hide()` কল হয়, তাই "লোড হচ্ছে..." আটকে থাকে না। Firebase চালু থাকলে (`SEMS.firebaseReady`) Firestore থেকে পড়ে/লেখে; ডেমো মোডে (`SEMS.isDemo`) localStorage-এর `sems_demo_*` নমুনা ডেটা দেখায় — সব নমুনা "ডেমো তথ্য" লেবেলসহ।

**অ্যাডমিনের সুযোগ পূর্ণ:** রুটিন, ব্যাচ, লেকচার/স্লাইড (প্রকাশের তারিখসহ), নোটিশ, পরীক্ষা, শিক্ষার্থী/শিক্ষক ব্যবস্থাপনা ও সেটিংস — সবকিছু।

| পেজ | যা করে | Firestore |
|---|---|---|
| `admin/dashboard.html` | স্বাগতম, মোট শিক্ষার্থী/শিক্ষক/ব্যাচ, বাকি ভর্তি আবেদন, আজকের ক্লাস, সর্বশেষ নোটিশ, সাম্প্রতিক লেকচার, আসন্ন পরীক্ষা | `users`, `students`, `batches`, `classes`, `admissions`, `notices`, `lectures`, `exams` |
| `admin/students.html` | সব শিক্ষার্থীর তালিকা — ব্যাচ ফিল্টার + নাম/ইমেইল খোঁজা | `students`, `batches` |
| `admin/add-student.html` | শিক্ষার্থী সরাসরি যোগ (students ডকে রেকর্ড; লগইন অ্যাকাউন্ট বানায় না — শিক্ষার্থীকে রেজিস্টার করতে হয়) | `students`-এ লেখা |
| `admin/admission-requests.html` | ভর্তি আবেদন অনুমোদন/বাতিল — অনুমোদনে `admissions.status=approved` + `users.admissionCompleted=true` + `students` ডক | `admissions`, `users`, `students` |
| `admin/student-details.html` | একক শিক্ষার্থীর বিস্তারিত (`?id=`) — প্রোফাইল, উপস্থিতির হার, রেজাল্ট | `students`, `attendance`, `results`, `batches` |
| `admin/teachers.html` | সব শিক্ষকের তালিকা — বিষয় খোঁজা | `users` (`role == teacher`), `batches` |
| `admin/add-teacher.html` | রেজিস্টার করা অ্যাকাউন্টকে ইমেইল দিয়ে খুঁজে তার `users` ডকের role `teacher` করা (ক্লায়েন্ট কোড দিয়ে অন্যের Auth অ্যাকাউন্ট বানানো যায় না) | `users` (পড়া + আপডেট) |
| `admin/teacher-details.html` | একক শিক্ষকের বিস্তারিত (`?id=`) — প্রোফাইল, তার ব্যাচ ও ক্লাস | `users`, `batches`, `classes`, `students` |
| `admin/courses.html` | কোর্সের তালিকা + নতুন কোর্স তৈরি | `courses`-এ লেখা/পড়া |
| `admin/batches.html` | ব্যাচের তালিকা + নতুন ব্যাচ তৈরি (কোর্স + শিক্ষক বসিয়ে — এটাই শিক্ষকের পেজে আসল ডেটা দেখায়) | `batches`-এ লেখা/পড়া, `courses`, `users` |
| `admin/classes.html` | সব ক্লাসের তালিকা — ব্যাচ ফিল্টার, মুছে ফেলা যায় | `classes`, `batches` |
| `admin/create-class.html` | নতুন ক্লাস তৈরি (বিষয়, অধ্যায়, ব্যাচ, শিক্ষক, তারিখ, সময়, মাধ্যম, ক্লাস লিংক) | `classes`-এ লেখা |
| `admin/routine.html` | পুরো রুটিন — সব ক্লাস তারিখ অনুযায়ী গ্রুপ করে, "আজ" ট্যাগসহ | `classes`, `batches` |
| `admin/lectures.html` | সব লেকচারের তালিকা — খোঁজা, মুছে ফেলা যায় | `lectures`, `batches` |
| `admin/upload-lecture.html` | লেকচার প্রকাশ (শিরোনাম, বিষয়, অধ্যায়, ব্যাচ, শিক্ষক, প্রকাশের তারিখ, PDF/স্লাইড/রেকর্ডিং লিংক) | `lectures`-এ লেখা (`published: true`) |
| `admin/notices.html` | নোটিশ তৈরি/প্রকাশ + তালিকা + মুছে ফেলা | `notices`-এ লেখা/পড়া |
| `admin/notifications.html` | নোটিফিকেশন কেন্দ্র — প্রকাশিত নোটিশ + সাম্প্রতিক কার্যকলাপ (আবেদন, পরীক্ষা, লেকচার) | `notices`, `admissions`, `exams`, `lectures` |
| `admin/assignments.html` | অ্যাসাইনমেন্ট তৈরি + সব অ্যাসাইনমেন্টের তালিকা (জমার সংখ্যাসহ) | `assignments`-এ লেখা/পড়া |
| `admin/exams.html` | পরীক্ষা তৈরি + সব পরীক্ষার তালিকা | `exams`-এ লেখা/পড়া |
| `admin/results.html` | রেজাল্টের সার্বিক চিত্র — পরীক্ষা ফিল্টার, গড় ও সর্বোচ্চ নম্বর | `results`, `exams`, `students` |
| `admin/reports.html` | রিপোর্ট — প্রতি ব্যাচে শিক্ষার্থী/ক্লাস সংখ্যা, উপস্থিতির হার, পরীক্ষার গড় নম্বর | `batches`, `students`, `classes`, `attendance`, `exams`, `results` |
| `admin/settings.html` | সেটিংস — প্রতিষ্ঠানের সাধারণ তথ্য (`settings/general` ডক, শুধু অ্যাডমিন) | `settings`-এ পড়া/লেখা |

সহায়ক ফাইল: `css/admin.css` (global.css-এর ব্র্যান্ড রঙ), `js/admin/common.js` (গার্ড, নেভবার/সাইডবার, Firestore পড়া/লেখা, ডেমো ফলব্যাক, তারিখ/স্ট্যাটাস/গ্রেড হিসাব) ও প্রতি পেজের আলাদা JS (`js/admin/dashboard.js`, `students.js`, `add-student.js`, `admission-requests.js`, `student-details.js`, `teachers.js`, `add-teacher.js`, `teacher-details.js`, `courses.js`, `batches.js`, `classes.js`, `create-class.js`, `routine.js`, `lectures.js`, `upload-lecture.js`, `notices.js`, `notifications.js`, `assignments.js`, `exams.js`, `results.js`, `reports.js`, `settings.js`)।

> **নোট:** `courses` কালেকশনের নিয়ম এখন `firebase/firestore.rules`-এ আছে (অ্যাডমিন লিখতে পারে) — Rules Publish করলেই কাজ করবে। `notifications` কালেকশনের নিয়ম Phase 5-এ যোগ হয়েছে (নিচে দেখুন)।

## নোটিফিকেশন সিস্টেম (Phase 5 — ইন-অ্যাপ)

অ্যাডমিন নোটিশ দিলে বা শিক্ষক লেকচার/অ্যাসাইনমেন্ট/পরীক্ষা প্রকাশ করলে বা রেজাল্ট দিলে সংশ্লিষ্ট শিক্ষার্থী/শিক্ষক **ইন-অ্যাপ নোটিফিকেশন** পায় — `notifications` কালেকশনে প্রতি প্রাপকের জন্য একটি ডক লেখা হয় (`js/firebase/notifications.js`, `SEMSNotifications`)।

**কে কী পায়:**

| ঘটনা | কারা পায় | লিংক |
|---|---|---|
| অ্যাডমিন নোটিশ প্রকাশ (`admin/notices.html`) | সব শিক্ষার্থী + সব শিক্ষক | শিক্ষার্থী: `notices.html`, শিক্ষক: `dashboard.html` |
| শিক্ষক/অ্যাডমিন লেকচার প্রকাশ | ওই ব্যাচের শিক্ষার্থীরা | `lectures.html` |
| শিক্ষক/অ্যাডমিন অ্যাসাইনমেন্ট তৈরি | ওই ব্যাচের শিক্ষার্থীরা | `assignments.html` |
| শিক্ষক/অ্যাডমিন পরীক্ষা তৈরি | ওই ব্যাচের শিক্ষার্থীরা | `exams.html` |
| শিক্ষক রেজাল্ট দেয় | যাদের নম্বর দেওয়া হয়েছে, সেই শিক্ষার্থীরা | `results.html` |

**যেভাবে দেখা যায়:** সব পেজের উপরের নেভবারে ঘণ্টা আইকন আছে — অপঠিত থাকলে লাল ব্যাজে সংখ্যা ওঠে। `student/notifications.html` ও `teacher/notifications.html`-এ তালিকা দেখা যায় (অপঠিত আগে), ক্লিক করলে পড়া হয়েছে বলে চিহ্নিত হয়ে সংশ্লিষ্ট পেজে যায়; "সব পড়া হয়েছে" বোতামে একসাথে চিহ্নিত হয়। অ্যাডমিনের ঘণ্টা `admin/notifications.html`-এ যায় (ব্যাজ নেই)।

**মনে রাখবেন:**
- এটা শুধু **ইন-অ্যাপ** নোটিফিকেশন — অ্যাপ খুললেই দেখা যাবে। ফোনে পুশ নোটিফিকেশন (FCM) এখানে নেই; সেটার জন্য Blaze (pay-as-you-go) প্ল্যান ও Cloud Functions লাগবে, পরে চালু করা যাবে (`js/firebase/notifications.js`-এর FCM স্টাব দেখুন)।
- নোটিফিকেশন পাঠানো fire-and-forget — পাঠাতে ব্যর্থ হলেও মূল কাজ (নোটিশ/লেকচার/পরীক্ষা/রেজাল্ট সংরক্ষণ) আটকায় না।
- Rules (`firebase/firestore.rules`, `notifications` ব্লক): লেখা শুধু অ্যাডমিন/শিক্ষক; পড়া ও পড়া-চিহ্ন শুধু নিজের ডক (বা অ্যাডমিন); মুছে ফেলা শুধু অ্যাডমিন। নতুন Rules Publish করতে হবে।
- ডেমো মোডে নোটিফিকেশন `sems_demo_notifications` (localStorage)-এ জমা হয়, নমুনা ডেটা "ডেমো তথ্য" লেবেলসহ দেখায়।

## শিক্ষক আবেদন ও অনুমোদন (Teacher Application Flow)

**সমস্যা ছিল:** রেজিস্ট্রেশন ফরমে যে কেউ "শিক্ষক" রোল বেছে অ্যাকাউন্ট খুলতে পারতো। এখন সেটা বন্ধ — রেজিস্ট্রেশন মানেই শিক্ষার্থী (student)।

**নতুন ফ্লো (ছাত্র ভর্তি অনুমোদনের মতোই):**

1. **আবেদন — `teacher-apply.html` (পাবলিক, লগইন লাগে না):** নাম, ইমেইল, মোবাইল, পড়ানোর বিষয়, যোগ্যতা, অভিজ্ঞতা, বর্তমান প্রতিষ্ঠান, ঠিকানা দিয়ে আবেদন জমা হয় `teacherApplications` কালেকশনে, `status: 'pending'`।
2. **অনুমোদন — `admin/teacher-requests.html`:** অ্যাডমিন বাকি/অনুমোদিত/বাতিল ফিল্টার ও নাম-ইমেইল-বিষয় খোঁজা দিয়ে আবেদন দেখেন; অনুমোদনে শুধু `status: 'approved'` হয় (বাতিলে `'rejected'`)। ড্যাশবোর্ডে বাকি শিক্ষক অনুরোধের সংখ্যা দেখা যায়।
3. **রেজিস্ট্রেশন — `register.html` / Google সাইন-ইন:** অনুমোদিত ইমেইল দিয়ে রেজিস্টার করলে `js/firebase/auth.js` অনুমোদিত আবেদন যাচাই করে `role: 'teacher'` দিয়ে অ্যাকাউন্ট তৈরি করে; অনুমোদন না থাকলে সবসময় `role: 'student'`।

**মনে রাখবেন:**
- অনুমোদনের আগেই রেজিস্টার করা থাকলে আবেদন অনুমোদনে রোল বদলায় না — তখন `admin/add-teacher.html` দিয়ে ইমেইল খুঁজে role `teacher` করতে হয়।
- অ্যাডমিন নিজে রেজিস্টার করতে পারে না — আগের মতোই Firebase Console থেকে `users/{uid}` ডকে `role: 'admin'` বসাতে হয়।
- Rules (`firebase/firestore.rules`, `teacherApplications` ব্লক): তৈরি (create) যে কেউ করতে পারে; পড়া শুধু অ্যাডমিন বা নিজের ইমেইলের আবেদনকারী; আপডেট/মুছে ফেলা শুধু অ্যাডমিন। নতুন Rules Publish করতে হবে।
- ডেমো মোডে আবেদন `sems_demo_teacher_applications` (localStorage)-এ জমা হয়, অনুমোদনও ডেমোতেই কাজ করে।
