import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function saveLocalAccount(account) {
  localStorage.setItem("locivioAccount", JSON.stringify(account));
}

window.createAccount = async function () {
  const name = document.getElementById("signupName")?.value.trim();
  const email = document.getElementById("signupEmail")?.value.trim();
  const password = document.getElementById("signupPassword")?.value;

  if (!name || !email || !password) {
    alert("Please enter name, email, and password.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const today = new Date();
    const trialEnd = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    const account = {
      uid: user.uid,
      name: name,
      email: email,
      plan: "trial",
      status: "active",
      trialDays: 5,
      trialStart: today.toISOString(),
      trialEnd: trialEnd.toISOString()
    };

    await setDoc(doc(db, "users", user.uid), {
      ...account,
      createdAt: serverTimestamp()
    });

    saveLocalAccount(account);

    alert("Account created successfully!");
    showScreen("appScreen");
  } catch (error) {
    alert(error.message);
  }
};

window.loginAccount = async function () {
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const snap = await getDoc(doc(db, "users", user.uid));

    if (snap.exists()) {
      saveLocalAccount(snap.data());
    }

    alert("Login successful!");
    showScreen("appScreen");
  } catch (error) {
    alert(error.message);
  }
};

window.logoutAccount = async function () {
  await signOut(auth);
  localStorage.removeItem("locivioAccount");
  showScreen("loginScreen");
};

onAuthStateChanged(auth, async (user) => {
  window.currentUser = user || null;
});
