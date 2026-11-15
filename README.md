# SEMS — Sinha Education Management System

কোচিং/শিক্ষা প্রতিষ্ঠান পরিচালনার প্ল্যাটফর্ম — শিক্ষার্থী, শিক্ষক ও অ্যাডমিন প্যানেল।
টেক: HTML, CSS, Vanilla JavaScript, Firebase (Auth, Firestore, Storage, Cloud Messaging, Hosting)।

> **বর্তমান অবস্থা: Phase 1 সম্পূর্ণ।** Phase 2/3/4/5 এখনো বানানো হয়নি — ড্যাশবোর্ডগুলো প্লেসহোল্ডার।

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
- **প্লেসহোল্ডার ড্যাশবোর্ড** — `student/dashboard.html` (Phase 2-এ আসছে), `teacher/dashboard.html` (Phase 3), `admin/dashboard.html` (Phase 4)। প্রতিটিতে লগআউট বাটন আছে, auth-guard ও role-guard দিয়ে সুরক্ষিত।
- **Firebase Rules** — `firebase/firestore.rules` (রোল-ভিত্তিক), `firebase/storage.rules`, `firebase/firestore.indexes.json`।

## ফোল্ডার স্ট্রাকচার (Phase 1)

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
├── student/dashboard.html      # Phase 2 প্লেসহোল্ডার
├── teacher/dashboard.html      # Phase 3 প্লেসহোল্ডার
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

## পরের ধাপ (Phase 2–5, এখনো হয়নি)

- **Phase 2 — Student Dashboard:** রুটিন, তারিখ অনুযায়ী লেকচার/স্লাইড, নোটিশ, উপস্থিতি, রেজাল্ট, প্রোফাইল।
- **Phase 3 — Teacher Panel:** নিজের ব্যাচ/ক্লাস, লেকচার, উপস্থিতি, নম্বর, অ্যাসাইনমেন্ট।
- **Phase 4 — Admin Panel:** রুটিন, ব্যাচ, লেকচার/স্লাইড (প্রকাশের তারিখসহ), নোটিশ, পরীক্ষা, সেটিংস।
- **Phase 5 — Exam/Attendance/Notifications:** পরীক্ষা, উপস্থিতি, FCM নোটিফিকেশন।
