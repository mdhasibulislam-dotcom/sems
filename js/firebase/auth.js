/* SEMS — js/firebase/auth.js | Phase 1
 * লগইন / রেজিস্ট্রেশন / Google সাইন-ইন / পাসওয়ার্ড রিসেট / লগআউট
 * Firebase চালু থাকলে Firebase Auth, না থাকলে localStorage ডেমো।
 *
 * ইউজার অবজেক্টের আকার (দুই মোডেই একই):
 * { uid, email, name/displayName, username, phone, role, admissionCompleted }
 * রোল: 'student' | 'teacher' | 'admin'
 */
(function () {
  var DEMO_USER_KEY = 'sems_demo_user';
  var DEMO_USERS_KEY = 'sems_demo_users'; // ডেমো রেজিস্টার করা সব ইউজার

  function demoUsers() {
    try { return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveDemoUsers(list) { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(list)); }
  function getDemoUser() {
    try { return JSON.parse(localStorage.getItem(DEMO_USER_KEY) || 'null'); } catch (e) { return null; }
  }
  function setDemoUser(u) {
    if (u) localStorage.setItem(DEMO_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(DEMO_USER_KEY);
  }
  function demoErr(code, message) {
    var err = new Error(message || code);
    err.code = code;
    return err;
  }

  // Firestore থেকে ইউজারের প্রোফাইল (রোলসহ) পড়া
  async function fetchProfile(uid) {
    var db = firebase.firestore();
    var snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  // ইউজারনেম দিয়ে ইমেইল খোঁজা (usernames কালেকশন: docId=username -> { uid, email })
  async function resolveEmail(identifier) {
    if (identifier.indexOf('@') !== -1) return identifier;
    var db = firebase.firestore();
    var snap = await db.collection('usernames').doc(identifier.toLowerCase()).get();
    if (!snap.exists) throw demoErr('auth/user-not-found', 'এই ইউজারনেমে কোনো অ্যাকাউন্ট পাওয়া যায়নি।');
    return snap.data().email;
  }

  var SEMSAuth = {
    isDemo: function () { return !!(window.SEMS && SEMS.isDemo); },

    // বর্তমান লগইন করা ইউজার (Firebase বা ডেমো)
    getCurrentUser: async function () {
      if (SEMS.isDemo) return getDemoUser();
      if (!SEMS.firebaseReady) return null;
      var fbUser = firebase.auth().currentUser;
      if (!fbUser) return null;
      var profile = await fetchProfile(fbUser.uid).catch(function () { return null; });
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        name: (profile && profile.name) || fbUser.displayName || '',
        displayName: (profile && profile.name) || fbUser.displayName || '',
        username: (profile && profile.username) || '',
        phone: (profile && profile.phone) || '',
        role: (profile && profile.role) || 'student',
        admissionCompleted: !!(profile && profile.admissionCompleted)
      };
    },

    // ইমেইল অথবা ইউজারনেম + পাসওয়ার্ড দিয়ে লগইন
    signIn: async function (identifier, password) {
      if (SEMS.isDemo) {
        if (password.length < 6) throw demoErr('auth/wrong-password', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        var users = demoUsers();
        var found = users.find(function (u) {
          return u.email === identifier || u.username === identifier.toLowerCase();
        });
        if (found) {
          if (found.password !== password) throw demoErr('auth/wrong-password', 'ভুল পাসওয়ার্ড।');
          var session = Object.assign({}, found);
          delete session.password;
          setDemoUser(session);
          return session;
        }
        // ডেমো: যেকোনো ইমেইল + ৬+ অক্ষরের পাসওয়ার্ডে ডেমো শিক্ষার্থী তৈরি
        var demo = {
          uid: 'demo-' + Date.now(),
          email: identifier.indexOf('@') !== -1 ? identifier : identifier + '@demo.sems',
          name: identifier.split('@')[0],
          displayName: identifier.split('@')[0],
          username: identifier.split('@')[0].toLowerCase(),
          phone: '',
          role: 'student',
          admissionCompleted: !!localStorage.getItem('sems_demo_admission')
        };
        setDemoUser(demo);
        return demo;
      }
      var email = await resolveEmail(identifier);
      var cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      var profile = await fetchProfile(cred.user.uid);
      return {
        uid: cred.user.uid,
        email: cred.user.email,
        name: (profile && profile.name) || cred.user.displayName || '',
        displayName: (profile && profile.name) || cred.user.displayName || '',
        username: (profile && profile.username) || '',
        phone: (profile && profile.phone) || '',
        role: (profile && profile.role) || 'student',
        admissionCompleted: !!(profile && profile.admissionCompleted)
      };
    },

    // Google দিয়ে সাইন-ইন / সাইন-আপ
    signInWithGoogle: async function () {
      if (SEMS.isDemo) {
        throw demoErr('auth/demo-mode', 'ডেমো মোডে Google সাইন-ইন কাজ করে না। Firebase config বসানোর পর কাজ করবে।');
      }
      var provider = new firebase.auth.GoogleAuthProvider();
      var result = await firebase.auth().signInWithPopup(provider);
      var fbUser = result.user;
      var profile = await fetchProfile(fbUser.uid);
      if (!profile) {
        // প্রথমবার Google সাইন-ইন: ডিফল্ট রোল student দিয়ে প্রোফাইল তৈরি
        profile = {
          name: fbUser.displayName || '',
          email: fbUser.email,
          username: '',
          phone: '',
          role: 'student',
          admissionCompleted: false,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        await firebase.firestore().collection('users').doc(fbUser.uid).set(profile);
      }
      return {
        uid: fbUser.uid,
        email: fbUser.email,
        name: profile.name || fbUser.displayName || '',
        displayName: profile.name || fbUser.displayName || '',
        username: profile.username || '',
        phone: profile.phone || '',
        role: profile.role || 'student',
        admissionCompleted: !!profile.admissionCompleted
      };
    },

    // নতুন অ্যাকাউন্ট — রোল শুধু student / teacher (admin নয়)
    signUp: async function (data) {
      if (data.role === 'admin') throw demoErr('auth/invalid-role', 'অ্যাডমিন নিজে রেজিস্টার করতে পারবে না।');
      if (SEMS.isDemo) {
        var users = demoUsers();
        if (users.some(function (u) { return u.email === data.email; })) {
          throw demoErr('auth/email-already-in-use', 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।');
        }
        if (users.some(function (u) { return u.username === data.username; })) {
          throw demoErr('auth/username-taken', 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে।');
        }
        var user = {
          uid: 'demo-' + Date.now(),
          email: data.email,
          name: data.name,
          displayName: data.name,
          username: data.username,
          phone: data.phone,
          role: data.role,
          admissionCompleted: false,
          password: data.password
        };
        users.push(user);
        saveDemoUsers(users);
        var session = Object.assign({}, user);
        delete session.password;
        setDemoUser(session);
        return session;
      }
      // ইউজারনেম আগেই নেওয়া আছে কিনা দেখো
      var nameSnap = await firebase.firestore().collection('usernames').doc(data.username).get();
      if (nameSnap.exists) throw demoErr('auth/username-taken', 'এই ইউজারনেমটি ইতিমধ্যে নেওয়া হয়েছে।');
      var cred = await firebase.auth().createUserWithEmailAndPassword(data.email, data.password);
      var uid = cred.user.uid;
      var db = firebase.firestore();
      var batch = db.batch();
      batch.set(db.collection('users').doc(uid), {
        name: data.name,
        email: data.email,
        username: data.username,
        phone: data.phone,
        role: data.role,
        admissionCompleted: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.set(db.collection('usernames').doc(data.username), { uid: uid, email: data.email });
      await batch.commit();
      return {
        uid: uid, email: data.email, name: data.name, displayName: data.name,
        username: data.username, phone: data.phone, role: data.role, admissionCompleted: false
      };
    },

    // পাসওয়ার্ড রিসেট ইমেইল
    sendPasswordReset: async function (email) {
      if (SEMS.isDemo) {
        throw demoErr('auth/demo-mode', 'ডেমো মোডে রিসেট ইমেইল পাঠানো যায় না। Firebase config বসানোর পর কাজ করবে।');
      }
      await firebase.auth().sendPasswordResetEmail(email);
    },

    // লগআউট
    signOut: async function () {
      if (SEMS.isDemo) {
        localStorage.removeItem(DEMO_USER_KEY);
        // ডেমো ভর্তি তথ্য মুছে ফেলা হবে না — একই ব্রাউজারে আবার লগইন করলে
        // আগের ডেমো অ্যাকাউন্টের admissionCompleted হারিয়ে যায়, তাই
        // ডেমো লগআউটে admission ফ্ল্যাগও পরিষ্কার করা হয়।
        localStorage.removeItem('sems_demo_admission');
        return;
      }
      await firebase.auth().signOut();
    },

    // ভর্তি ফরম শেষ হলে প্রোফাইলে ফ্ল্যাগ আপডেট (ডেমোতেও)
    markAdmissionCompleted: async function (uid) {
      if (SEMS.isDemo) {
        var u = getDemoUser();
        if (u) { u.admissionCompleted = true; setDemoUser(u); }
        return;
      }
      await firebase.firestore().collection('users').doc(uid).update({ admissionCompleted: true });
    }
  };

  window.SEMSAuth = SEMSAuth;
})();
