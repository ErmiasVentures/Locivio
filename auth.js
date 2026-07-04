/* ==========================================
   LOCIVIO AUTHENTICATION
========================================== */

const LOCIVIO_ACCOUNT_KEY = "locivio_account";
const LOCIVIO_SESSION_KEY = "locivio_session";

function createAccount() {
  const email = document.getElementById("signupEmail").value.trim().toLowerCase();
  const password = document.getElementById("signupPassword").value;
  const remember = document.getElementById("signupRemember").checked;

  if (!email) {
    alert("Please enter your email.");
    return;
  }

  if (!validateEmail(email)) {
    alert("Please enter a valid email.");
    return;
  }

  if (!password || password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const existingAccount = getAccount();

  if (existingAccount && existingAccount.email === email) {
    alert("An account already exists with this email. Please log in.");
    showScreen("loginScreen");
    return;
  }

  const today = new Date();

  const account = {
    email: email,
    password: password,
    remember: remember,
    plan: "trial",
    status: "active",
    createdAt: today.toISOString(),
    trialStart: today.toISOString(),
    trialEnd: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
  };

  saveAccount(account);
  startSession(account);

  alert("Account created. Your 5-day free trial has started.");
}

function login() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const remember = document.getElementById("loginRemember").checked;

  const account = getAccount();

  if (!account) {
    alert("No account found. Please create an account first.");
    return;
  }

  if (account.email !== email || account.password !== password) {
    alert("Incorrect email or password.");
    return;
  }

  account.remember = remember;
  saveAccount(account);

  startSession(account);
}

function startSession(account) {
  sessionStorage.setItem(LOCIVIO_SESSION_KEY, "true");

  if (account.remember) {
    localStorage.setItem("locivio_remember", "true");
  } else {
    localStorage.removeItem("locivio_remember");
  }

  const hero = document.querySelector(".hero");
  if (hero) hero.style.display = "none";

  showScreen("appScreen");

  if (typeof checkTrialStatus === "function") checkTrialStatus();
  if (typeof updateAccountStatus === "function") updateAccountStatus();
  if (typeof refreshData === "function") refreshData();
}

function logout() {
  sessionStorage.removeItem(LOCIVIO_SESSION_KEY);
  localStorage.removeItem("locivio_remember");

  const hero = document.querySelector(".hero");
  if (hero) hero.style.display = "flex";

  showLanding();
}

function checkLogin() {
  const remember = localStorage.getItem("locivio_remember");
  const account = getAccount();

  if (remember && account) {
    startSession(account);
  }
}

function getAccount() {
  return JSON.parse(localStorage.getItem(LOCIVIO_ACCOUNT_KEY));
}

function saveAccount(account) {
  localStorage.setItem(LOCIVIO_ACCOUNT_KEY, JSON.stringify(account));
}

function updateAccountStatus() {
  const account = getAccount();
  const statusBox = document.getElementById("accountStatus");

  if (!account || !statusBox) return;

  statusBox.innerHTML = `
    <strong>${escapeHTML(account.email)}</strong><br>
    Plan: ${escapeHTML(account.plan.toUpperCase())}<br>
    Status: ${escapeHTML(account.status.toUpperCase())}
  `;
}

function forgotPassword() {
  alert("Password reset email will be connected later when real cloud authentication is added.");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

