import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBm9_ZYYfmh-vbUTpuKOzq_BQAmR7LZnkE",
  authDomain: "locivio-febeb.firebaseapp.com",
  projectId: "locivio-febeb",
  storageBucket: "locivio-febeb.firebasestorage.app",
  messagingSenderId: "1048529393580",
  appId: "1:1048529393580:web:a5505378d9add537234c09"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);


