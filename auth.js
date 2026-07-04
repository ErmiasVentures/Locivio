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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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

    await setDoc(doc(db, "users", user.uid), {
      name,
      email,
      createdAt: serverTimestamp()
    });

    alert("Account created successfully!");
    if (typeof showScreen === "function") showScreen("homeScreen");
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
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    if (typeof showScreen === "function") showScreen("homeScreen");
  } catch (error) {
    alert(error.message);
  }
};

window.logoutAccount = async function () {
  await signOut(auth);
  if (typeof showScreen === "function") showScreen("loginScreen");
};

onAuthStateChanged(auth, (user) => {
  window.currentUser = user || null;
});
